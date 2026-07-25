import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import {
  FeeAccount,
  Payment,
  CLEARS_LATER,
  PAYMENT_METHODS,
  balanceOf,
  type FeeAccountDoc,
  type PaymentDoc,
} from "./fee.model.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate, parsed } from "../../middleware/validate.js";
import { ApiError } from "../../utils/ApiError.js";
import { toPublic } from "../../utils/crudRouter.js";

const router = Router();
router.use(requireAuth);

/** Collecting money is restricted — a librarian should not be issuing receipts. */
const canCollect = requireRole("super_admin", "school_admin", "principal", "accountant");

const accountQuery = z.object({
  search: z.string().optional(),
  className: z.string().optional(),
  /** "all" | "due" | "cleared" */
  standing: z.string().optional(),
});

router.get("/accounts", validate(accountQuery, "query"), async (req, res, next) => {
  try {
    const { search, className, standing } = parsed<z.infer<typeof accountQuery>>(req, "query");

    const filter: Record<string, unknown> = { schoolId: req.user!.schoolId };
    if (className) filter.className = className;

    if (search?.trim()) {
      const safe = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp(safe, "i");
      filter.$or = [{ name: rx }, { admissionNo: rx }, { rollNo: rx }, { guardian: rx }];
    }

    const docs = await FeeAccount.find(filter).sort({ name: 1 });

    // Standing depends on derived balance, so it can't be a database filter
    // without storing a total that would drift. Applied here instead.
    const filtered =
      standing === "due"
        ? docs.filter((d) => balanceOf(d) > 0)
        : standing === "cleared"
          ? docs.filter((d) => balanceOf(d) === 0)
          : docs;

    res.json({
      data: filtered.map((d) => toPublic(d as FeeAccountDoc)),
      meta: { total: filtered.length, page: 1, limit: filtered.length, pages: 1 },
    });
  } catch (err) {
    next(err);
  }
});

const paymentQuery = z.object({
  search: z.string().optional(),
  method: z.string().optional(),
  status: z.string().optional(),
});

router.get("/payments", validate(paymentQuery, "query"), async (req, res, next) => {
  try {
    const { search, method, status } = parsed<z.infer<typeof paymentQuery>>(req, "query");

    const filter: Record<string, unknown> = { schoolId: req.user!.schoolId };
    if (method) filter.method = method;
    if (status) filter.status = status;

    if (search?.trim()) {
      const safe = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp(safe, "i");
      filter.$or = [{ studentName: rx }, { receiptNo: rx }, { admissionNo: rx }, { reference: rx }];
    }

    const docs = await Payment.find(filter).sort({ createdAt: -1 }).limit(500);
    res.json({
      data: docs.map((d) => toPublic(d as PaymentDoc)),
      meta: { total: docs.length, page: 1, limit: 500, pages: 1 },
    });
  } catch (err) {
    next(err);
  }
});

const collectBody = z.object({
  accountId: z.string().min(1),
  allocations: z
    .array(z.object({ head: z.string().min(1), amount: z.coerce.number<number>().positive() }))
    .min(1, "Enter at least one amount"),
  method: z.enum(PAYMENT_METHODS),
  reference: z.string().default(""),
  bank: z.string().default(""),
  remarks: z.string().default(""),
});

/**
 * Records a payment and posts it to the student's ledger.
 *
 * Both writes happen inside one transaction: a receipt without its ledger
 * posting (or the reverse) is a reconciliation problem nobody can fix from
 * the UI, so a partial success must not be possible.
 */
router.post("/collect", canCollect, validate(collectBody), async (req, res, next) => {
  const body = req.body as z.infer<typeof collectBody>;
  const session = await mongoose.startSession();

  try {
    let receipt: PaymentDoc | null = null;

    await session.withTransaction(async () => {
      const account = await FeeAccount.findOne({
        _id: body.accountId,
        schoolId: req.user!.schoolId,
      }).session(session);

      if (!account) throw ApiError.notFound("Fee account not found.");

      const amount = body.allocations.reduce((sum, a) => sum + a.amount, 0);
      if (amount <= 0) throw ApiError.badRequest("Enter an amount greater than zero.");

      // Re-checked against the freshly-read account, not a figure the client
      // sent — otherwise a stale browser tab could overpay.
      const balance = balanceOf(account);
      if (amount > balance) {
        throw ApiError.badRequest(
          `Amount exceeds the outstanding balance of ₹${balance.toLocaleString("en-IN")}.`
        );
      }

      // Receipt numbers come from a per-school count that only moves forward,
      // so a deleted receipt never has its number reissued.
      const issued = await Payment.countDocuments({ schoolId: req.user!.schoolId }).session(session);
      const receiptNo = `RCP-${25000 + issued + 1}`;
      const today = new Date().toISOString().slice(0, 10);

      const [created] = await Payment.create(
        [
          {
            schoolId: req.user!.schoolId,
            receiptNo,
            studentId: account.studentId,
            studentName: account.name,
            admissionNo: account.admissionNo,
            className: `${account.className} · ${account.section}`,
            date: today,
            amount,
            method: body.method,
            reference: body.reference,
            bank: body.bank,
            allocations: body.allocations,
            remarks: body.remarks,
            collectedBy: req.user!.email,
            // Cheques and DDs are money in hand but not yet in the bank.
            status: CLEARS_LATER.includes(body.method) ? "pending-clearance" : "paid",
          },
        ],
        { session }
      );

      // Mutated in place: `heads` is a Mongoose subdocument array, and
      // replacing it with a plain array loses its change tracking.
      const byHead = new Map(body.allocations.map((a) => [a.head, a.amount]));
      for (const head of account.heads) {
        const extra = byHead.get(head.head);
        if (extra) head.paid += extra;
      }
      account.lastPaymentDate = today;
      await account.save({ session });

      receipt = created as PaymentDoc;
    });

    res.status(201).json({ data: toPublic(receipt!) });
  } catch (err) {
    next(err);
  } finally {
    await session.endSession();
  }
});

/* ------------------------------------------------------------------ */
/* Status transitions                                                   */
/*                                                                      */
/* Anything that takes money BACK out of the ledger (bounce, cancel)    */
/* must do it in the same transaction that changes the receipt status,  */
/* or a failure mid-way leaves the books wrong.                         */
/* ------------------------------------------------------------------ */

/** Subtracts a payment's allocations back off the account's paid figures. */
async function reverseAllocations(
  payment: PaymentDoc,
  session: mongoose.ClientSession,
  schoolId: string
) {
  const account = await FeeAccount.findOne({
    studentId: payment.studentId,
    schoolId,
  }).session(session);
  if (!account) return; // account deleted; nothing to unwind

  const byHead = new Map(payment.allocations.map((a) => [a.head, a.amount]));
  for (const head of account.heads) {
    const back = byHead.get(head.head);
    if (back) head.paid = Math.max(0, head.paid - back);
  }
  await account.save({ session });
}

/** Marks a cheque/DD as realised. No ledger change — it was already counted. */
router.post("/payments/:id/clear", canCollect, async (req, res, next) => {
  try {
    const payment = await Payment.findOne({ _id: req.params.id, schoolId: req.user!.schoolId });
    if (!payment) throw ApiError.notFound("Payment not found.");
    if (payment.status !== "pending-clearance") {
      throw ApiError.badRequest("Only a pending cheque or DD can be cleared.");
    }
    payment.status = "paid";
    await payment.save();
    res.json({ data: toPublic(payment as PaymentDoc) });
  } catch (err) {
    next(err);
  }
});

const reversalBody = z.object({ reason: z.string().min(3, "A reason is required") });

/** A bounced cheque never really paid — reverse the ledger and mark it. */
router.post(
  "/payments/:id/bounce",
  canCollect,
  validate(reversalBody),
  async (req, res, next) => {
    const dbSession = await mongoose.startSession();
    try {
      let updated: PaymentDoc | null = null;
      await dbSession.withTransaction(async () => {
        const payment = await Payment.findOne({
          _id: req.params.id,
          schoolId: req.user!.schoolId,
        }).session(dbSession);
        if (!payment) throw ApiError.notFound("Payment not found.");
        if (payment.status !== "pending-clearance") {
          throw ApiError.badRequest("Only a pending cheque or DD can bounce.");
        }
        await reverseAllocations(payment as PaymentDoc, dbSession, req.user!.schoolId);
        payment.status = "bounced";
        payment.reversedAt = new Date().toISOString().slice(0, 10);
        payment.reversedBy = req.user!.email;
        payment.reversalReason = (req.body as z.infer<typeof reversalBody>).reason;
        await payment.save({ session: dbSession });
        updated = payment as PaymentDoc;
      });
      res.json({ data: toPublic(updated!) });
    } catch (err) {
      next(err);
    } finally {
      await dbSession.endSession();
    }
  }
);

/** Cancels a wrongly-recorded receipt and returns the money to the ledger. */
router.post(
  "/payments/:id/cancel",
  canCollect,
  validate(reversalBody),
  async (req, res, next) => {
    const dbSession = await mongoose.startSession();
    try {
      let updated: PaymentDoc | null = null;
      await dbSession.withTransaction(async () => {
        const payment = await Payment.findOne({
          _id: req.params.id,
          schoolId: req.user!.schoolId,
        }).session(dbSession);
        if (!payment) throw ApiError.notFound("Payment not found.");
        if (payment.status === "cancelled" || payment.status === "bounced") {
          throw ApiError.badRequest("This payment has already been reversed.");
        }
        await reverseAllocations(payment as PaymentDoc, dbSession, req.user!.schoolId);
        payment.status = "cancelled";
        payment.reversedAt = new Date().toISOString().slice(0, 10);
        payment.reversedBy = req.user!.email;
        payment.reversalReason = (req.body as z.infer<typeof reversalBody>).reason;
        await payment.save({ session: dbSession });
        updated = payment as PaymentDoc;
      });
      res.json({ data: toPublic(updated!) });
    } catch (err) {
      next(err);
    } finally {
      await dbSession.endSession();
    }
  }
);

/**
 * The accountant's day-book: today's collection broken down by mode, plus the
 * headline figures the fee dashboard needs. All derived from the register and
 * ledger — never stored, so it can't drift.
 */
router.get("/summary", async (req, res, next) => {
  try {
    const schoolId = req.user!.schoolId;
    const today = new Date().toISOString().slice(0, 10);

    const [accounts, payments] = await Promise.all([
      FeeAccount.find({ schoolId }),
      Payment.find({ schoolId }),
    ]);

    // Cancelled and bounced receipts are excluded from every money total.
    const live = payments.filter((p) => p.status === "paid" || p.status === "pending-clearance");

    const collectedToday = live
      .filter((p) => p.date === today)
      .reduce((sum, p) => sum + p.amount, 0);

    const byMode: Record<string, number> = {};
    for (const p of live.filter((p) => p.date === today)) {
      byMode[p.method] = (byMode[p.method] ?? 0) + p.amount;
    }

    const totalCollected = live.reduce((sum, p) => sum + p.amount, 0);
    const outstanding = accounts.reduce((sum, a) => sum + balanceOf(a), 0);
    const defaulters = accounts.filter((a) => balanceOf(a) > 0).length;
    const pendingClearance = payments.filter((p) => p.status === "pending-clearance").length;

    res.json({
      data: {
        collectedToday,
        byMode,
        totalCollected,
        outstanding,
        defaulters,
        pendingClearance,
        accounts: accounts.length,
        receipts: live.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;

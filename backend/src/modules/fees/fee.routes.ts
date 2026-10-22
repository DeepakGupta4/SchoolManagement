import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import {
  FeeAccount,
  Payment,
  CLEARS_LATER,
  PAYMENT_METHODS,
  CURRENT_SESSION,
  balanceOf,
  headBalance,
  type FeeAccountDoc,
  type PaymentDoc,
} from "./fee.model.js";
import { Student, type StudentDoc } from "../students/student.model.js";
import { FeeStructure } from "../feeStructures/feeStructure.model.js";
import { Scholarship } from "../scholarships/scholarship.model.js";
import { BusRoute } from "../busRoutes/busRoute.model.js";
import {
  deriveGrossHeads,
  applyTransportHead,
  toAccountHeads,
  matchStructure,
  pickStructureForClass,
  netHeadsFor,
  provisionalAccountFor,
  scholarshipConcessionFor,
  type FeeFrequency,
} from "./feeProvisioning.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate, parsed } from "../../middleware/validate.js";
import { ApiError } from "../../utils/ApiError.js";
import { toPublic } from "../../utils/crudRouter.js";
import { notifySchool } from "../notifications/notification.model.js";
import {
  isRazorpayConfigured,
  razorpayKeyId,
  createRazorpayOrder,
  fetchRazorpayPayment,
  verifyRazorpaySignature,
  mapRazorpayMethod,
} from "../../utils/razorpay.js";
import type { Request } from "express";

const router = Router();
router.use(requireAuth);

/** Collecting money is restricted — a librarian should not be issuing receipts. */
const canCollect = requireRole("super_admin", "school_admin", "principal", "accountant");

/**
 * The late fee is tracked as a scalar on the account (`account.lateFee`), not as a
 * billed head, but it's collected through the same allocation list. Both the client
 * and the collect handler key it by this exact name — keep them in sync.
 */
const LATE_FEE_HEAD = "Late Fee";

/* ------------------------------------------------------------------ */
/* Student-centric fee rows                                             */
/*                                                                     */
/* The collection screen, dues list and dashboard all work from the    */
/* class's real STUDENTS, not just the accounts that happen to exist.   */
/* A student without a stored account is billed live from the class fee */
/* structure (net of active scholarships) and marked provisional — the  */
/* account itself is created the moment money is first collected.       */
/* ------------------------------------------------------------------ */

interface StudentFeeRow {
  id: string;
  studentId: string;
  admissionNo: string;
  name: string;
  className: string;
  section: string;
  rollNo: string;
  guardian: string;
  guardianPhone: string;
  session: string;
  heads: { head: string; billed: number; paid: number; frequency: FeeFrequency; unit: number }[];
  concession: number;
  lateFee: number;
  lastPaymentDate: string | null;
  dueDate: string | null;
  provisional: boolean;
}

function publicAccount(doc: FeeAccountDoc): StudentFeeRow {
  return {
    id: String(doc._id),
    studentId: String(doc.studentId),
    admissionNo: doc.admissionNo,
    name: doc.name,
    className: doc.className,
    section: doc.section,
    rollNo: doc.rollNo,
    guardian: doc.guardian,
    guardianPhone: doc.guardianPhone,
    session: doc.session,
    heads: doc.heads.map((h) => ({
      head: h.head,
      billed: h.billed,
      paid: h.paid,
      frequency: (h.frequency ?? "one-time") as FeeFrequency,
      unit: h.unit ?? 0,
    })),
    concession: doc.concession,
    lateFee: doc.lateFee,
    lastPaymentDate: doc.lastPaymentDate ?? null,
    dueDate: doc.dueDate ?? null,
    provisional: false,
  };
}

/**
 * Builds one fee row per active student, merging any stored account and
 * synthesising the rest from the class fee structure + active scholarships.
 * Optional class/search filters are applied to the student query.
 */
async function loadStudentFeeRows(
  schoolId: string,
  opts: { className?: string; search?: string } = {}
): Promise<StudentFeeRow[]> {
  const studentFilter: Record<string, unknown> = { schoolId, status: "active" };
  if (opts.className) studentFilter.className = opts.className;

  if (opts.search?.trim()) {
    const safe = opts.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rx = new RegExp(safe, "i");
    studentFilter.$or = [
      { firstName: rx },
      { lastName: rx },
      { admissionNo: rx },
      { rollNo: rx },
      { "guardian.name": rx },
    ];
  }

  const students = await Student.find(studentFilter).sort({ firstName: 1, lastName: 1 });
  if (students.length === 0) return [];

  const ids = students.map((s) => s._id);
  const [accounts, structures, scholarships, routes] = await Promise.all([
    FeeAccount.find({ schoolId, studentId: { $in: ids }, session: CURRENT_SESSION }),
    FeeStructure.find({ schoolId }),
    Scholarship.find({ schoolId, status: "active" }),
    BusRoute.find({ schoolId }),
  ]);

  const accountByStudent = new Map(accounts.map((a) => [String(a.studentId), a]));
  // A route's fee is the transport bill for the students assigned to it (by code).
  const routeFeeByCode = new Map(routes.map((r) => [r.code, Number(r.fee) || 0]));

  // Summed active scholarship waiver per linked student.
  const concessionByStudent = new Map<string, number>();
  for (const sc of scholarships) {
    if (!sc.studentId) continue;
    const key = String(sc.studentId);
    const amount = Math.max(0, Math.round(Number(sc.amount) || 0));
    concessionByStudent.set(key, (concessionByStudent.get(key) ?? 0) + amount);
  }

  return students.map((student) => {
    const existing = accountByStudent.get(String(student._id));
    if (existing) return publicAccount(existing as FeeAccountDoc);
    const structure = pickStructureForClass(structures, student.className);
    const gross = applyTransportHead(deriveGrossHeads(structure), {
      transportRequired: student.transportRequired,
      routeFee: student.transportRouteCode ? routeFeeByCode.get(student.transportRouteCode) ?? null : null,
      monthsPerYear: structure?.monthsPerYear,
    });
    const concession = concessionByStudent.get(String(student._id)) ?? 0;
    return provisionalAccountFor(student, gross, concession);
  });
}

const accountQuery = z.object({
  search: z.string().optional(),
  className: z.string().optional(),
  /** "all" | "due" | "cleared" */
  standing: z.string().optional(),
});

router.get("/accounts", canCollect, validate(accountQuery, "query"), async (req, res, next) => {
  try {
    const { search, className, standing } = parsed<z.infer<typeof accountQuery>>(req, "query");

    const rows = await loadStudentFeeRows(req.user!.schoolId, { search, className });

    // Standing depends on the derived balance, so it can't be a database filter
    // without storing a total that would drift. Applied here instead.
    const filtered =
      standing === "due"
        ? rows.filter((r) => balanceOf(r) > 0)
        : standing === "cleared"
          ? rows.filter((r) => balanceOf(r) === 0)
          : rows;

    res.json({
      data: filtered,
      meta: { total: filtered.length, page: 1, limit: filtered.length, pages: 1 },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Opens (or updates) a student's fee account. Used by the "Register New Student"
 * flow so an admin can set fees during admission, but reusable anywhere.
 *
 * The billed `heads` define what is owed. An optional `concession` is netted off
 * the heads (oldest first) so the DERIVED balance already reflects it — the same
 * convention the collection screen relies on, where the stored `concession` is
 * shown for the record but is never re-subtracted from the balance.
 *
 * Idempotent per student + session: re-posting updates the same account instead
 * of failing on the unique index, so setting fees twice can't 500.
 */
const feeAccountBody = z.object({
  studentId: z.string().min(1),
  heads: z
    .array(
      z.object({
        head: z.string().min(1),
        billed: z.coerce.number<number>().min(0),
        frequency: z.enum(["monthly", "one-time", "per-exam"]).optional(),
        unit: z.coerce.number<number>().min(0).optional(),
      })
    )
    .min(1, "Add at least one fee head"),
  concession: z.coerce.number<number>().min(0).default(0),
  lateFee: z.coerce.number<number>().min(0).default(0),
  dueDate: z.string().optional(),
  session: z.string().min(1).default(CURRENT_SESSION),
});

router.post("/accounts", canCollect, validate(feeAccountBody), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof feeAccountBody>;
    const schoolId = req.user!.schoolId;

    const student = await Student.findOne({ _id: body.studentId, schoolId });
    if (!student) throw ApiError.notFound("Student not found.");

    // Heads are stored net of the concession; the concession can't exceed the bill.
    const gross = body.heads.map((h) => ({
      head: h.head,
      billed: Math.round(h.billed),
      frequency: (h.frequency ?? "one-time") as FeeFrequency,
      unit: Math.round(h.unit ?? h.billed),
    }));
    const net = netHeadsFor(gross, body.concession);

    const account = await FeeAccount.findOneAndUpdate(
      { schoolId, studentId: student._id, session: body.session },
      {
        $set: {
          admissionNo: student.admissionNo,
          name: `${student.firstName} ${student.lastName}`.trim(),
          className: student.className,
          section: student.section,
          rollNo: student.rollNo,
          guardian: student.guardian.name,
          guardianPhone: student.guardian.phone,
          heads: toAccountHeads(net.heads),
          concession: net.concession,
          lateFee: Math.round(body.lateFee),
          dueDate: body.dueDate?.trim() ? body.dueDate.trim() : null,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    );

    // Keep the student's headline fee-due metric (shown on the profile & list)
    // in step with the freshly-opened ledger.
    student.feeDue = balanceOf(account as FeeAccountDoc);
    await student.save();

    res.status(201).json({ data: toPublic(account as FeeAccountDoc) });
  } catch (err) {
    next(err);
  }
});

const paymentQuery = z.object({
  search: z.string().optional(),
  method: z.string().optional(),
  status: z.string().optional(),
  studentId: z.string().optional(),
  className: z.string().optional(),
});

router.get("/payments", canCollect, validate(paymentQuery, "query"), async (req, res, next) => {
  try {
    const { search, method, status, studentId, className } = parsed<z.infer<typeof paymentQuery>>(
      req,
      "query"
    );

    const filter: Record<string, unknown> = { schoolId: req.user!.schoolId };
    if (method) filter.method = method;
    if (status) filter.status = status;
    if (studentId && mongoose.isValidObjectId(studentId)) filter.studentId = studentId;

    if (className?.trim()) {
      // Stored as "Class 6 · A"; anchor to the class name up to a word boundary
      // so "Class 1" doesn't also match "Class 10".
      const safe = className.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.className = new RegExp(`^${safe}(\\s|·|$)`);
    }

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

const collectBody = z
  .object({
    accountId: z.string().optional(),
    studentId: z.string().optional(),
    allocations: z
      .array(z.object({ head: z.string().min(1), amount: z.coerce.number<number>().positive() }))
      .min(1, "Enter at least one amount"),
    method: z.enum(PAYMENT_METHODS),
    reference: z.string().default(""),
    bank: z.string().default(""),
    remarks: z.string().default(""),
  })
  .refine((b) => Boolean(b.accountId || b.studentId), {
    message: "A student or account is required.",
    path: ["studentId"],
  });

/**
 * Creates a student's fee account on demand, billed from the class fee structure
 * net of any active scholarship. Runs inside the collection transaction so a
 * first-time payment and the account it posts to land together.
 */
async function provisionAccount(
  schoolId: string,
  studentId: string,
  session: mongoose.ClientSession
): Promise<FeeAccountDoc> {
  const student = await Student.findOne({ _id: studentId, schoolId }).session(session);
  if (!student) throw ApiError.notFound("Student not found.");

  const structure = await matchStructure(schoolId, student.className);
  const route =
    student.transportRequired && student.transportRouteCode
      ? await BusRoute.findOne({ schoolId, code: student.transportRouteCode }).session(session)
      : null;
  const gross = applyTransportHead(deriveGrossHeads(structure), {
    transportRequired: student.transportRequired,
    routeFee: route?.fee ?? null,
    monthsPerYear: structure?.monthsPerYear,
  });
  const concession = await scholarshipConcessionFor(schoolId, studentId);
  const net = netHeadsFor(gross, concession);

  const [created] = await FeeAccount.create(
    [
      {
        schoolId,
        studentId: student._id,
        admissionNo: student.admissionNo,
        name: `${student.firstName} ${student.lastName}`.trim(),
        className: student.className,
        section: student.section,
        rollNo: student.rollNo,
        guardian: student.guardian.name,
        guardianPhone: student.guardian.phone,
        session: CURRENT_SESSION,
        heads: toAccountHeads(net.heads),
        concession: net.concession,
        lateFee: 0,
      },
    ],
    { session }
  );
  return created as FeeAccountDoc;
}

/**
 * Records a payment and posts it to the student's ledger.
 *
 * Both writes happen inside one transaction: a receipt without its ledger
 * posting (or the reverse) is a reconciliation problem nobody can fix from
 * the UI, so a partial success must not be possible. If the student has no
 * account yet, it is created here from the class fee structure first.
 */
router.post("/collect", canCollect, validate(collectBody), async (req, res, next) => {
  const body = req.body as z.infer<typeof collectBody>;
  const schoolId = req.user!.schoolId;
  const session = await mongoose.startSession();

  try {
    let receipt: PaymentDoc | null = null;

    await session.withTransaction(async () => {
      let account: FeeAccountDoc | null = null;

      if (body.accountId && mongoose.isValidObjectId(body.accountId)) {
        account = await FeeAccount.findOne({ _id: body.accountId, schoolId }).session(session);
      }

      // No stored account (a provisional row, or a stale id) — resolve or open
      // one for the student so historical students can still be collected from.
      if (!account && body.studentId && mongoose.isValidObjectId(body.studentId)) {
        account = await FeeAccount.findOne({
          schoolId,
          studentId: body.studentId,
          session: CURRENT_SESSION,
        }).session(session);
        if (!account) account = await provisionAccount(schoolId, body.studentId, session);
      }

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

      // Every allocation must land on a real due — a billed head with room left,
      // or the account's late fee (a scalar, not a head row). Validating here keeps
      // the receipt total equal to what actually posts: an unknown head would
      // otherwise be receipted but silently dropped (phantom money), and an amount
      // over one head's due would overpay it while another head stayed unpaid.
      const dueByHead = new Map<string, number>();
      for (const head of account.heads) dueByHead.set(head.head, headBalance(head));

      // Head names are free-form, so a structure MAY bill a real head literally
      // named "Late Fee". When it does, that head wins and the scalar late fee is
      // left alone — otherwise the two would collide (one blocks the other, or the
      // amount posts twice).
      const lateFeeIsScalar = !dueByHead.has(LATE_FEE_HEAD);

      // Sum per head name: the client may split a head across rows, and the receipt
      // total must equal what posts. This is also what the posting loop consumes.
      const byHead = new Map<string, number>();
      for (const a of body.allocations) byHead.set(a.head, (byHead.get(a.head) ?? 0) + a.amount);

      for (const [head, amt] of byHead) {
        const room = dueByHead.has(head)
          ? dueByHead.get(head)!
          : head === LATE_FEE_HEAD && lateFeeIsScalar
            ? account.lateFee
            : null;
        if (room == null) {
          throw ApiError.badRequest(`Unknown fee head "${head}".`);
        }
        if (amt > room) {
          throw ApiError.badRequest(
            `₹${amt.toLocaleString("en-IN")} exceeds the ₹${room.toLocaleString(
              "en-IN"
            )} due on "${head}".`
          );
        }
      }

      // Receipt numbers come from a per-school count that only moves forward,
      // so a deleted receipt never has its number reissued.
      const issued = await Payment.countDocuments({ schoolId }).session(session);
      const receiptNo = `RCP-${25000 + issued + 1}`;
      const today = new Date().toISOString().slice(0, 10);

      const [created] = await Payment.create(
        [
          {
            schoolId,
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

      // Mutated in place: `heads` is a Mongoose subdocument array, and replacing it
      // with a plain array loses its change tracking. Credit a name once even if two
      // heads happen to share it, so a single allocation never posts twice.
      for (const head of account.heads) {
        const extra = byHead.get(head.head);
        if (extra) {
          head.paid += extra;
          byHead.delete(head.head);
        }
      }
      // The late fee is a scalar field, not a head row, so settle it explicitly —
      // but only when "Late Fee" isn't itself a billed head (that head was just
      // posted by the loop above; settling the scalar too would double-count).
      if (lateFeeIsScalar) {
        const lateFeePaid = byHead.get(LATE_FEE_HEAD);
        if (lateFeePaid) account.lateFee = Math.max(0, account.lateFee - lateFeePaid);
      }
      account.lastPaymentDate = today;
      await account.save({ session });

      // Keep the student's headline fee-due metric in step with the ledger.
      await Student.updateOne(
        { _id: account.studentId, schoolId },
        { $set: { feeDue: balanceOf(account) } }
      ).session(session);

      receipt = created as PaymentDoc;
    });

    if (receipt) {
      const r: PaymentDoc = receipt;
      void notifySchool(schoolId, {
        type: "fee",
        title: "Fee payment received",
        body: `₹${r.amount.toLocaleString("en-IN")} from ${r.studentName} · ${r.receiptNo}`,
        link: "/fees/receipts",
        roles: ["super_admin", "school_admin", "principal", "accountant"],
      });
    }

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
  await Student.updateOne(
    { _id: account.studentId, schoolId },
    { $set: { feeDue: balanceOf(account) } }
  ).session(session);
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
 * the student-centric ledger — never stored, so it can't drift.
 */
router.get("/summary", canCollect, async (req, res, next) => {
  try {
    const schoolId = req.user!.schoolId;
    const today = new Date().toISOString().slice(0, 10);

    const [rows, payments] = await Promise.all([
      loadStudentFeeRows(schoolId),
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
    const outstanding = rows.reduce((sum, r) => sum + balanceOf(r), 0);
    const defaulters = rows.filter((r) => balanceOf(r) > 0).length;
    const pendingClearance = payments.filter((p) => p.status === "pending-clearance").length;

    res.json({
      data: {
        collectedToday,
        byMode,
        totalCollected,
        outstanding,
        defaulters,
        pendingClearance,
        accounts: rows.length,
        receipts: live.length,
      },
    });
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------------------ */
/* Online fee payment (Razorpay) — self-service for guardians/students  */
/*                                                                      */
/* These routes are deliberately NOT gated to the office: a signed-in    */
/* guardian or student pays their OWN dues. Ownership is re-checked on    */
/* the server for every call (never trusted from the client), and the     */
/* money is posted through the SAME transactional ledger write as a       */
/* counter collection, so an online receipt is indistinguishable from a   */
/* cash one in the register. Without Razorpay keys the endpoints answer    */
/* 503 and the portal falls back to "pay at the office".                   */
/* ------------------------------------------------------------------ */

/** Office staff may collect for anyone; everyone else only for themselves/their child. */
const OFFICE_ROLES = new Set(["super_admin", "school_admin", "principal", "accountant"]);

/**
 * Resolves the one student the caller is allowed to pay for, re-checking
 * ownership server-side so a crafted studentId can neither pay against nor probe
 * someone else's ledger:
 *  - office staff → any student in their school (by id);
 *  - everyone else → only a student whose guardian/father/mother/own email is
 *    the caller's login, or (with no id) their own student record.
 */
async function resolvePayableStudent(req: Request, studentId?: string): Promise<StudentDoc> {
  const schoolId = req.user!.schoolId;
  const email = (req.user!.email || "").trim().toLowerCase();

  if (OFFICE_ROLES.has(req.user!.role)) {
    if (!studentId || !mongoose.isValidObjectId(studentId)) {
      throw ApiError.badRequest("A student is required.");
    }
    const s = await Student.findOne({ _id: studentId, schoolId });
    if (!s) throw ApiError.notFound("Student not found.");
    return s;
  }

  if (studentId && mongoose.isValidObjectId(studentId)) {
    const s = await Student.findOne({ _id: studentId, schoolId });
    const mine =
      !!s &&
      [s.guardian?.email, s.fatherEmail, s.motherEmail, s.email]
        .map((e) => String(e ?? "").trim().toLowerCase())
        .includes(email);
    // Don't reveal whether the id exists for someone else's child.
    if (!s || !mine) throw ApiError.notFound("Student not found.");
    return s;
  }

  const self = email ? await Student.findOne({ schoolId, email }) : null;
  if (!self) throw ApiError.notFound("No student record is linked to your account.");
  return self;
}

/** The student's current outstanding balance, from a stored account or synthesised live. */
async function outstandingFor(schoolId: string, student: StudentDoc) {
  const stored = await FeeAccount.findOne({
    schoolId,
    studentId: student._id,
    session: CURRENT_SESSION,
  });
  if (stored) return { balance: balanceOf(stored), name: stored.name };
  const structure = await matchStructure(schoolId, student.className);
  const route =
    student.transportRequired && student.transportRouteCode
      ? await BusRoute.findOne({ schoolId, code: student.transportRouteCode })
      : null;
  const gross = applyTransportHead(deriveGrossHeads(structure), {
    transportRequired: student.transportRequired,
    routeFee: route?.fee ?? null,
    monthsPerYear: structure?.monthsPerYear,
  });
  const concession = await scholarshipConcessionFor(schoolId, String(student._id));
  const prov = provisionalAccountFor(student, gross, concession);
  return { balance: balanceOf(prov), name: prov.name };
}

/** Spreads a paid amount across outstanding heads, earliest first (never past each head's bill). */
function allocateAcrossHeads(
  heads: { head: string; billed: number; paid: number }[],
  amount: number
): { head: string; amount: number }[] {
  let left = amount;
  const out: { head: string; amount: number }[] = [];
  for (const h of heads) {
    if (left <= 0) break;
    const due = Math.max(0, h.billed - h.paid);
    if (due <= 0) continue;
    const put = Math.min(due, left);
    out.push({ head: h.head, amount: put });
    left -= put;
  }
  return out;
}

const payOrderBody = z.object({ studentId: z.string().optional() });

/**
 * Opens a Razorpay order for the caller's own outstanding balance. Returns the
 * public key id and order so the browser can launch Checkout; 503 (handled
 * gracefully by the client) when online payment isn't configured for the school.
 */
router.post("/pay/order", validate(payOrderBody), async (req, res, next) => {
  try {
    if (!isRazorpayConfigured()) {
      throw new ApiError(
        503,
        "Online payment isn't set up for this school yet. Please pay at the school office."
      );
    }
    const body = req.body as z.infer<typeof payOrderBody>;
    const student = await resolvePayableStudent(req, body.studentId);
    const { balance, name } = await outstandingFor(req.user!.schoolId, student);
    if (balance <= 0) throw ApiError.badRequest("There are no dues to pay right now.");

    const order = await createRazorpayOrder(Math.round(balance * 100), `fee_${String(student._id)}`);
    res.json({
      data: {
        keyId: razorpayKeyId(),
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        studentId: String(student._id),
        studentName: name,
        dueRupees: balance,
      },
    });
  } catch (err) {
    next(err);
  }
});

const payVerifyBody = z.object({
  studentId: z.string().optional(),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

/**
 * Verifies a Checkout callback and posts the payment to the ledger. The money is
 * only recorded after the HMAC signature verifies AND Razorpay itself confirms a
 * captured payment for the matching order — never on the browser's word — and
 * the receipt + ledger posting land in one transaction, exactly like a counter
 * collection. A repeat callback for the same payment returns the first receipt.
 */
router.post("/pay/verify", validate(payVerifyBody), async (req, res, next) => {
  const body = req.body as z.infer<typeof payVerifyBody>;
  const schoolId = req.user!.schoolId;
  const session = await mongoose.startSession();
  try {
    if (!isRazorpayConfigured()) {
      throw new ApiError(503, "Online payment isn't set up for this school yet.");
    }

    // 1. A forged callback fails here, so no receipt is posted for unpaid money.
    if (!verifyRazorpaySignature(body.razorpay_order_id, body.razorpay_payment_id, body.razorpay_signature)) {
      throw ApiError.badRequest(
        "Payment verification failed. If money was deducted it will be refunded automatically."
      );
    }

    // 2. Ownership — never trust the studentId the browser sent.
    const student = await resolvePayableStudent(req, body.studentId);

    // 3. Read the payment from Razorpay: the authority on amount and capture.
    const payment = await fetchRazorpayPayment(body.razorpay_payment_id);
    if (payment.order_id !== body.razorpay_order_id) {
      throw ApiError.badRequest("This payment doesn't match its order.");
    }
    if (payment.status !== "captured") {
      throw ApiError.badRequest("This payment hasn't been captured yet. Please try again shortly.");
    }
    const paidRupees = Math.round(payment.amount / 100);
    if (paidRupees <= 0) throw ApiError.badRequest("Nothing was paid.");

    // Idempotency: a Razorpay payment id is unique, so a receipt already
    // referencing it means this callback was handled — return that receipt.
    const already = await Payment.findOne({ schoolId, reference: body.razorpay_payment_id });
    if (already) {
      res.status(200).json({ data: toPublic(already) });
      return;
    }

    let receipt: PaymentDoc | null = null;
    await session.withTransaction(async () => {
      let account = await FeeAccount.findOne({
        schoolId,
        studentId: student._id,
        session: CURRENT_SESSION,
      }).session(session);
      if (!account) account = await provisionAccount(schoolId, String(student._id), session);

      // Never post more than is owed, even if the balance dropped since the
      // order was opened (e.g. the office also collected in the meantime).
      const applied = Math.min(paidRupees, balanceOf(account));
      if (applied <= 0) throw ApiError.badRequest("There are no dues to pay right now.");

      const allocations = allocateAcrossHeads(
        account.heads.map((h) => ({ head: h.head, billed: h.billed, paid: h.paid })),
        applied
      );
      // allocateAcrossHeads fills billed heads only, but the balance also includes
      // the scalar late fee, so settle its share here — otherwise an online payment
      // is receipted in full while the late fee is dropped and never clears (this
      // mirrors /collect). Skip when "Late Fee" is itself a billed head (the loop
      // above already allocated it) so the two can't double-count.
      const lateFeeIsScalar = !account.heads.some((h) => h.head === LATE_FEE_HEAD);
      let lateFeePaid = 0;
      if (lateFeeIsScalar && account.lateFee > 0) {
        const toHeads = allocations.reduce((s, a) => s + a.amount, 0);
        lateFeePaid = Math.min(applied - toHeads, account.lateFee);
        if (lateFeePaid > 0) allocations.push({ head: LATE_FEE_HEAD, amount: lateFeePaid });
      }

      const issued = await Payment.countDocuments({ schoolId }).session(session);
      const receiptNo = `RCP-${25000 + issued + 1}`;
      const today = new Date().toISOString().slice(0, 10);

      const [created] = await Payment.create(
        [
          {
            schoolId,
            receiptNo,
            studentId: account.studentId,
            studentName: account.name,
            admissionNo: account.admissionNo,
            className: `${account.className} · ${account.section}`,
            date: today,
            amount: applied,
            method: mapRazorpayMethod(payment.method),
            reference: body.razorpay_payment_id,
            bank: "",
            allocations,
            remarks: "Online payment (Razorpay)",
            collectedBy: req.user!.email,
            status: "paid",
          },
        ],
        { session }
      );

      const byHead = new Map(allocations.map((a) => [a.head, a.amount]));
      for (const head of account.heads) {
        const extra = byHead.get(head.head);
        if (extra) head.paid += extra;
      }
      if (lateFeePaid > 0) account.lateFee = Math.max(0, account.lateFee - lateFeePaid);
      account.lastPaymentDate = today;
      await account.save({ session });

      await Student.updateOne(
        { _id: account.studentId, schoolId },
        { $set: { feeDue: balanceOf(account) } }
      ).session(session);

      receipt = created as PaymentDoc;
    });

    if (receipt) {
      const r: PaymentDoc = receipt;
      void notifySchool(schoolId, {
        type: "fee",
        title: "Online fee payment received",
        body: `₹${r.amount.toLocaleString("en-IN")} from ${r.studentName} · ${r.receiptNo}`,
        link: "/fees/receipts",
        roles: ["super_admin", "school_admin", "principal", "accountant"],
      });
    }

    res.status(201).json({ data: toPublic(receipt!) });
  } catch (err) {
    next(err);
  } finally {
    await session.endSession();
  }
});

export default router;

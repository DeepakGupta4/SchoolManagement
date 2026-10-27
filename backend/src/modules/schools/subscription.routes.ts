import { Router } from "express";
import crypto from "node:crypto";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { ApiError } from "../../utils/ApiError.js";
import { env } from "../../config/env.js";
import { School, toPublicSchool, resetReminders } from "./school.model.js";
import { Student } from "../students/student.model.js";
import { TIERS, tierDef, tierPriceInr, MIN_BILLED_STUDENTS, type Tier } from "./tiers.js";
import { sendEmail } from "../../utils/email.js";
import { paymentSuccessEmail } from "./emails.js";
import { runSubscriptionReminders } from "./reminders.js";
import { notifySchool } from "../notifications/notification.model.js";

/**
 * Self-service subscription payment via Razorpay — now PER-STUDENT, TIERED pricing.
 *
 * Each tier (Starter/Standard/Premium) has a ₹/student/month rate; the bill is that
 * rate × the school's active-student count (floored to a minimum). NOT behind
 * `checkSubscription` — an expired school must be able to pay to get back in. The
 * gateway signature is verified on the server before the subscription is activated.
 */
const router = Router();

const paymentConfigured = () => Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);

/** Active-student count and the billed count (floored to a minimum). */
async function studentBilling(schoolId: string): Promise<{ students: number; billed: number }> {
  const students = await Student.countDocuments({ schoolId, status: "active" });
  return { students, billed: Math.max(students, MIN_BILLED_STUDENTS) };
}

/** The tiers with per-student rates and the totals for this school's student count. */
function tierPlans(billed: number) {
  return TIERS.map((t) => ({
    id: t.id,
    name: t.name,
    blurb: t.blurb,
    modules: t.modules,
    perStudentMonthlyInr: t.perStudentMonthlyInr,
    perStudentYearlyInr: t.perStudentYearlyInr,
    monthlyTotalInr: t.perStudentMonthlyInr * billed,
    yearlyTotalInr: t.perStudentYearlyInr * billed,
  }));
}

/** Reminder sweep trigger for an external scheduler (shared-secret header). */
router.post("/run-reminders", async (req, res, next) => {
  try {
    if (!env.CRON_SECRET) throw new ApiError(503, "Reminder cron is not configured.");
    if (req.header("x-cron-secret") !== env.CRON_SECRET) throw ApiError.unauthorized();
    const counts = await runSubscriptionReminders();
    res.json({ data: counts });
  } catch (err) {
    next(err);
  }
});

router.use(requireAuth);

/** Paying for / managing the SaaS plan is the account owner's action, not the principal's. */
const canBill = requireRole("super_admin", "school_admin");

/** Tiers + per-student totals for this school, plus the current plan and whether pay is on. */
router.get("/plans", async (req, res, next) => {
  try {
    const schoolId = req.user!.schoolId;
    const { students, billed } = await studentBilling(schoolId);
    const school = await School.findOne({ schoolId });
    const sub = school?.subscription;
    res.json({
      data: {
        tiers: tierPlans(billed),
        students,
        billedStudents: billed,
        minBilledStudents: MIN_BILLED_STUDENTS,
        paymentEnabled: paymentConfigured(),
        currentTier: sub && (sub.plan === "monthly" || sub.plan === "yearly") ? sub.tier : null,
        currentCycle: sub && (sub.plan === "monthly" || sub.plan === "yearly") ? sub.plan : null,
      },
    });
  } catch (err) {
    next(err);
  }
});

const orderSchema = z.object({
  tier: z.enum(["starter", "standard", "premium"]),
  cycle: z.enum(["monthly", "yearly"]),
});

/** Create a Razorpay order for the chosen tier × cycle × student count. */
router.post("/order", canBill, validate(orderSchema), async (req, res, next) => {
  try {
    if (!paymentConfigured()) {
      throw new ApiError(503, "Online payment is not configured yet. Please contact support to activate.");
    }
    const { tier, cycle } = req.body as z.infer<typeof orderSchema>;
    const schoolId = req.user!.schoolId;
    const { billed } = await studentBilling(schoolId);

    const priceInr = tierPriceInr(tier as Tier, cycle) * billed;
    if (priceInr <= 0) throw ApiError.badRequest("Could not price this plan.");
    const amount = priceInr * 100; // paise

    const auth = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString("base64");
    const receipt = `sub_${schoolId}_${Date.now()}`.slice(0, 40);

    const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
      body: JSON.stringify({
        amount,
        currency: "INR",
        receipt,
        notes: { schoolId, tier, cycle, billedStudents: String(billed) },
      }),
    });

    if (!rzpRes.ok) {
      const detail = await rzpRes.text().catch(() => "");
      console.error("Razorpay order failed:", rzpRes.status, detail);
      throw new ApiError(502, "Could not start the payment. Please try again.");
    }

    const order = (await rzpRes.json()) as { id: string; amount: number; currency: string };
    res.json({
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: env.RAZORPAY_KEY_ID,
        tier,
        cycle,
        billedStudents: billed,
      },
    });
  } catch (err) {
    next(err);
  }
});

const verifySchema = z.object({
  tier: z.enum(["starter", "standard", "premium"]),
  cycle: z.enum(["monthly", "yearly"]),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

/** Verify the gateway signature and activate the subscription at the chosen tier. */
router.post("/verify", canBill, validate(verifySchema), async (req, res, next) => {
  try {
    if (!paymentConfigured()) throw new ApiError(503, "Payment is not configured.");
    const body = req.body as z.infer<typeof verifySchema>;

    const expected = crypto
      .createHmac("sha256", env.RAZORPAY_KEY_SECRET!)
      .update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`)
      .digest("hex");

    const ok =
      expected.length === body.razorpay_signature.length &&
      crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(body.razorpay_signature));
    if (!ok) throw ApiError.badRequest("Payment verification failed.");

    const school = await School.findOne({ schoolId: req.user!.schoolId });
    if (!school) throw ApiError.notFound("School not found for this account.");

    const def = tierDef(body.tier)!;
    const { billed } = await studentBilling(school.schoolId);
    const amountInr = tierPriceInr(body.tier as Tier, body.cycle) * billed;
    const months = body.cycle === "yearly" ? 12 : 1;
    const now = new Date();
    const end = new Date(now);
    end.setMonth(end.getMonth() + months);

    const sub = school.subscription;
    sub.plan = body.cycle; // billing cycle
    sub.tier = body.tier; // feature tier
    sub.status = "active";
    sub.paidStartDate = now;
    sub.paidEndDate = end;
    sub.paymentStatus = "paid";
    sub.paymentId = body.razorpay_payment_id;
    sub.orderId = body.razorpay_order_id;
    sub.freeAccess = false;
    school.status = "active";
    resetReminders(sub);
    await school.save();

    void sendEmail(
      paymentSuccessEmail({
        to: school.email,
        schoolName: school.name,
        plan: `${def.name} (${body.cycle})`,
        amountInr,
        paidUntil: end,
      })
    );
    void notifySchool(school.schoolId, {
      type: "payment",
      title: "Subscription activated",
      body: `Your ${def.name} plan (${body.cycle}) is now active. Thank you!`,
      link: "/subscription",
      roles: ["super_admin", "school_admin", "principal"],
    });

    res.json({ data: toPublicSchool(school) });
  } catch (err) {
    next(err);
  }
});

export default router;

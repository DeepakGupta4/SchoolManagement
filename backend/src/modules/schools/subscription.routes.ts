import { Router } from "express";
import crypto from "node:crypto";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { ApiError } from "../../utils/ApiError.js";
import { env } from "../../config/env.js";
import { School, toPublicSchool, resetReminders } from "./school.model.js";
import { sendEmail } from "../../utils/email.js";
import { paymentSuccessEmail } from "./emails.js";
import { runSubscriptionReminders } from "./reminders.js";
import { notifySchool } from "../notifications/notification.model.js";

/**
 * Self-service subscription payment via Razorpay.
 *
 * NOT behind `checkSubscription` — an expired school must be able to pay to get
 * back in. The gateway signature is verified on the server (never trusting the
 * browser's "payment succeeded"), and only then is the subscription activated.
 */
const router = Router();

interface Plan {
  id: "monthly" | "yearly";
  name: string;
  months: number;
  /** Amount in paise, what Razorpay charges. */
  amount: number;
  /** Amount in rupees, for display. */
  priceInr: number;
}

function plans(): Plan[] {
  return [
    { id: "monthly", name: "Monthly", months: 1, amount: env.PLAN_MONTHLY_PRICE, priceInr: env.PLAN_MONTHLY_PRICE / 100 },
    { id: "yearly", name: "Yearly", months: 12, amount: env.PLAN_YEARLY_PRICE, priceInr: env.PLAN_YEARLY_PRICE / 100 },
  ];
}

const paymentConfigured = () => Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);

/**
 * Reminder sweep trigger for an external scheduler. Authenticated by a shared
 * secret header, NOT a user token, so it sits above `requireAuth`. Idempotent —
 * safe to call on any cadence.
 */
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

/** Available plans, plus whether online payment is currently enabled. */
router.get("/plans", (_req, res) => {
  res.json({ data: { plans: plans(), paymentEnabled: paymentConfigured() } });
});

const orderSchema = z.object({ plan: z.enum(["monthly", "yearly"]) });

/** Create a Razorpay order for the chosen plan. */
router.post("/order", validate(orderSchema), async (req, res, next) => {
  try {
    if (!paymentConfigured()) {
      throw new ApiError(503, "Online payment is not configured yet. Please contact support to activate.");
    }
    const { plan } = req.body as z.infer<typeof orderSchema>;
    const chosen = plans().find((p) => p.id === plan)!;

    const auth = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString("base64");
    const receipt = `sub_${req.user!.schoolId}_${Date.now()}`.slice(0, 40);

    const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
      body: JSON.stringify({
        amount: chosen.amount,
        currency: "INR",
        receipt,
        notes: { schoolId: req.user!.schoolId, plan },
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
        plan,
      },
    });
  } catch (err) {
    next(err);
  }
});

const verifySchema = z.object({
  plan: z.enum(["monthly", "yearly"]),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

/** Verify the gateway signature and activate the subscription. */
router.post("/verify", validate(verifySchema), async (req, res, next) => {
  try {
    if (!paymentConfigured()) throw new ApiError(503, "Payment is not configured.");
    const body = req.body as z.infer<typeof verifySchema>;

    // The signature proves the payment is genuine and untampered.
    const expected = crypto
      .createHmac("sha256", env.RAZORPAY_KEY_SECRET!)
      .update(`${body.razorpay_order_id}|${body.razorpay_payment_id}`)
      .digest("hex");

    // Constant-time compare to avoid leaking timing information.
    const ok =
      expected.length === body.razorpay_signature.length &&
      crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(body.razorpay_signature));
    if (!ok) throw ApiError.badRequest("Payment verification failed.");

    const school = await School.findOne({ schoolId: req.user!.schoolId });
    if (!school) throw ApiError.notFound("School not found for this account.");

    const chosen = plans().find((p) => p.id === body.plan)!;
    const now = new Date();
    const end = new Date(now);
    end.setMonth(end.getMonth() + chosen.months);

    const sub = school.subscription;
    sub.plan = body.plan;
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
        plan: chosen.name,
        amountInr: chosen.priceInr,
        paidUntil: end,
      })
    );
    void notifySchool(school.schoolId, {
      type: "payment",
      title: "Subscription activated",
      body: `Your ${chosen.name} plan is now active. Thank you!`,
      link: "/subscription",
    });

    res.json({ data: toPublicSchool(school) });
  } catch (err) {
    next(err);
  }
});

export default router;

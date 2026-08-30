import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { ApiError } from "../../utils/ApiError.js";
import { env } from "../../config/env.js";
import { User, hashPassword } from "../auth/user.model.js";
import { generateTempPassword } from "../../utils/password.js";
import { sendEmail, isEmailConfigured } from "../../utils/email.js";
import { passwordResetEmail } from "./emails.js";
import { School, evaluateAccess, toPublicSchool, resetReminders, type SchoolDoc } from "./school.model.js";
import { SchoolRequest } from "./schoolRequest.model.js";
import { Student } from "../students/student.model.js";
import { Teacher } from "../teachers/teacher.model.js";

const router = Router();
const DAY = 86_400_000;

router.use(requireAuth);

/**
 * The signed-in user's own school subscription state. Deliberately NOT behind
 * `checkSubscription` — an expired school must still be able to read this to
 * render its lock screen and trial countdown. Legacy tenants and the platform
 * owner report as unrestricted.
 */
router.get("/me", async (req, res, next) => {
  try {
    const user = req.user!;

    if (user.role === "super_admin") {
      res.json({
        data: { hasSubscription: false, allowed: true, status: "active", plan: null, daysRemaining: null, trialEndDate: null, paidEndDate: null, schoolName: null },
      });
      return;
    }

    const school = await School.findOne({ schoolId: user.schoolId });
    if (!school) {
      res.json({
        data: { hasSubscription: false, allowed: true, status: "active", plan: null, daysRemaining: null, trialEndDate: null, paidEndDate: null, schoolName: null },
      });
      return;
    }

    const access = evaluateAccess(school);
    res.json({
      data: {
        hasSubscription: true,
        allowed: access.allowed,
        status: access.status,
        plan: school.subscription.plan,
        daysRemaining: access.daysRemaining,
        trialEndDate: access.trialEndDate,
        paidEndDate: access.paidEndDate,
        schoolName: school.name,
      },
    });
  } catch (err) {
    next(err);
  }
});

/* --------------------------------------------- Super Admin: manage tenants */

// Everything below is platform-owner only.
router.use(requireRole("super_admin"));

/**
 * Every tenant school with its live access state AND real usage — the actual
 * number of students and staff each school has added (counted from their own
 * records, not the figures claimed at sign-up).
 */
router.get("/", async (_req, res, next) => {
  try {
    const schools = await School.find().sort({ createdAt: -1 });

    const [studentAgg, teacherAgg] = await Promise.all([
      Student.aggregate<{ _id: string; n: number }>([{ $group: { _id: "$schoolId", n: { $sum: 1 } } }]),
      Teacher.aggregate<{ _id: string; n: number }>([{ $group: { _id: "$schoolId", n: { $sum: 1 } } }]),
    ]);
    const students = new Map(studentAgg.map((x) => [x._id, x.n]));
    const staff = new Map(teacherAgg.map((x) => [x._id, x.n]));

    const data = schools.map((s) => ({
      ...toPublicSchool(s),
      studentsAdded: students.get(s.schoolId) ?? 0,
      staffAdded: staff.get(s.schoolId) ?? 0,
    }));

    res.json({ data, meta: { total: schools.length } });
  } catch (err) {
    next(err);
  }
});

/**
 * Diagnostic: sends a test email (to the caller by default) and returns the
 * real result — including the SMTP error message on failure — so email config
 * can be verified without digging through server logs.
 */
router.post("/test-email", async (req, res, next) => {
  try {
    const to = (typeof req.body?.to === "string" && req.body.to.trim()) || req.user!.email;
    const result = await sendEmail({
      to,
      subject: `${env.SOFTWARE_NAME} test email`,
      text: `This is a test email from ${env.SOFTWARE_NAME}. If you can read this, SMTP is working.`,
      html: `<p>This is a test email from <b>${env.SOFTWARE_NAME}</b>. If you can read this, SMTP is working.</p>`,
    });
    res.json({ data: { to, configured: isEmailConfigured(), ...result } });
  } catch (err) {
    next(err);
  }
});

/** Loads the target school or throws a clean 404. */
async function findSchool(schoolId: string): Promise<SchoolDoc & { save: () => Promise<unknown> }> {
  const school = await School.findOne({ schoolId });
  if (!school) throw ApiError.notFound("School not found.");
  return school as unknown as SchoolDoc & { save: () => Promise<unknown> };
}

const extendSchema = z.object({ days: z.coerce.number<number>().min(1).max(3650) });

/** Extend the trial (or paid window) by N days from whichever end is later. */
router.post("/:schoolId/extend", validate(extendSchema), async (req, res, next) => {
  try {
    const { days } = req.body as z.infer<typeof extendSchema>;
    const school = await findSchool(String(req.params.schoolId));
    const sub = school.subscription;
    const now = new Date();

    const onPaidPlan = sub.plan !== "trial" && !!sub.paidEndDate;
    if (onPaidPlan) {
      const base = sub.paidEndDate && sub.paidEndDate > now ? sub.paidEndDate : now;
      sub.paidEndDate = new Date(base.getTime() + days * DAY);
      sub.status = "active";
    } else {
      const base = sub.trialEndDate && sub.trialEndDate > now ? sub.trialEndDate : now;
      sub.trialEndDate = new Date(base.getTime() + days * DAY);
      sub.status = "trial";
    }
    school.status = "active";
    resetReminders(sub);
    await school.save();
    res.json({ data: toPublicSchool(school) });
  } catch (err) {
    next(err);
  }
});

/** Grant free, unlimited access — bypasses payment entirely. */
router.post("/:schoolId/activate-free", async (req, res, next) => {
  try {
    const school = await findSchool(String(req.params.schoolId));
    school.subscription.freeAccess = true;
    school.subscription.status = "active";
    school.status = "active";
    await school.save();
    res.json({ data: toPublicSchool(school) });
  } catch (err) {
    next(err);
  }
});

const activatePaidSchema = z.object({
  plan: z.enum(["monthly", "yearly"]),
  months: z.coerce.number<number>().min(1).max(120).optional(),
});

/** Manually activate a paid plan without going through the gateway. */
router.post("/:schoolId/activate-paid", validate(activatePaidSchema), async (req, res, next) => {
  try {
    const { plan, months } = req.body as z.infer<typeof activatePaidSchema>;
    const school = await findSchool(String(req.params.schoolId));
    const now = new Date();
    const span = plan === "yearly" ? 12 : months ?? 1;
    const end = new Date(now);
    end.setMonth(end.getMonth() + span);

    const sub = school.subscription;
    sub.plan = plan;
    sub.status = "active";
    sub.paidStartDate = now;
    sub.paidEndDate = end;
    sub.paymentStatus = "paid";
    sub.freeAccess = false;
    school.status = "active";
    resetReminders(sub);
    await school.save();
    res.json({ data: toPublicSchool(school) });
  } catch (err) {
    next(err);
  }
});

const trialEndSchema = z.object({ trialEndDate: z.coerce.date() });

/** Set an exact trial end date. */
router.patch("/:schoolId/trial", validate(trialEndSchema), async (req, res, next) => {
  try {
    const { trialEndDate } = req.body as z.infer<typeof trialEndSchema>;
    const school = await findSchool(String(req.params.schoolId));
    school.subscription.trialEndDate = trialEndDate;
    school.subscription.status = "trial";
    school.status = "active";
    resetReminders(school.subscription);
    await school.save();
    res.json({ data: toPublicSchool(school) });
  } catch (err) {
    next(err);
  }
});

/**
 * Reset the school admin's password to a fresh temporary one — for when the
 * approval popup was missed or the credentials email didn't arrive. Returns the
 * new password once (never stored in plain text) and emails it too.
 */
router.post("/:schoolId/reset-password", async (req, res, next) => {
  try {
    const school = await findSchool(String(req.params.schoolId));
    const user = await User.findOne({ email: school.email, schoolId: school.schoolId });
    if (!user) throw ApiError.notFound("No admin login found for this school.");

    const tempPassword = generateTempPassword();
    user.passwordHash = await hashPassword(tempPassword);
    await user.save();

    void sendEmail(
      passwordResetEmail({
        to: school.email,
        schoolName: school.name,
        email: school.email,
        temporaryPassword: tempPassword,
        loginUrl: env.APP_LOGIN_URL,
      })
    );

    res.json({
      data: { email: school.email, temporaryPassword: tempPassword, emailDelivered: isEmailConfigured() },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/:schoolId/suspend", async (req, res, next) => {
  try {
    const school = await findSchool(String(req.params.schoolId));
    school.status = "suspended";
    school.subscription.status = "suspended";
    await school.save();
    res.json({ data: toPublicSchool(school) });
  } catch (err) {
    next(err);
  }
});

/** Permanently remove a school, its user logins and its registration request. */
router.delete("/:schoolId", async (req, res, next) => {
  try {
    const schoolId = String(req.params.schoolId);
    const school = await School.findOne({ schoolId });
    if (!school) throw ApiError.notFound("School not found.");
    await User.deleteMany({ schoolId });
    await SchoolRequest.deleteMany({ schoolId });
    await School.deleteOne({ schoolId });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.post("/:schoolId/resume", async (req, res, next) => {
  try {
    const school = await findSchool(String(req.params.schoolId));
    school.status = "active";
    // Restore a sensible subscription status; evaluateAccess re-derives expiry.
    school.subscription.status = school.subscription.freeAccess
      ? "active"
      : school.subscription.plan === "trial"
        ? "trial"
        : "active";
    await school.save();
    res.json({ data: toPublicSchool(school) });
  } catch (err) {
    next(err);
  }
});

export default router;

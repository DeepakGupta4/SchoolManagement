import { Router } from "express";
import mongoose from "mongoose";
import net from "node:net";
import dns from "node:dns/promises";
import { z } from "zod";
import { requireAuth, requireRole, signToken } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { ApiError } from "../../utils/ApiError.js";
import { env } from "../../config/env.js";
import { User, hashPassword, toPublicUser } from "../auth/user.model.js";
import { notifySchool } from "../notifications/notification.model.js";
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

/** The caller's own school profile (full details), for the Settings page. */
router.get("/mine", async (req, res, next) => {
  try {
    const school = await School.findOne({ schoolId: req.user!.schoolId });
    res.json({ data: school ? toPublicSchool(school) : null });
  } catch (err) {
    next(err);
  }
});

const profileSchema = z.object({
  name: z.string().min(2).optional(),
  ownerName: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  website: z.string().optional(),
  schoolType: z.string().optional(),
  logo: z.string().optional(),
  bellSchedule: z
    .array(z.object({ label: z.string(), time: z.string(), isBreak: z.boolean() }))
    .optional(),
});

/** A school edits its own profile. Subscription/status/schoolId are off-limits. */
router.patch(
  "/mine",
  requireRole("super_admin", "school_admin", "principal"),
  validate(profileSchema),
  async (req, res, next) => {
    try {
      const updates = req.body as z.infer<typeof profileSchema>;
      const school = await School.findOneAndUpdate(
        { schoolId: req.user!.schoolId },
        { $set: updates },
        { new: true, runValidators: true }
      );
      if (!school) throw ApiError.notFound("No school profile for this account.");
      res.json({ data: toPublicSchool(school) });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Danger zone: wipe ALL of this school's domain data (students, teachers, fees,
 * classes, exams, events, notifications, documents, …) for a clean-slate setup.
 * Auth (users), the school record and school requests are preserved, so the
 * admin stays logged in. Scoped strictly to the caller's own schoolId.
 */
router.post(
  "/reset-data",
  requireRole("super_admin", "school_admin", "principal"),
  async (req, res, next) => {
    try {
      const schoolId = req.user!.schoolId;
      const db = mongoose.connection.db;
      if (!db) throw new Error("Database not connected");

      const KEEP = new Set(["users", "schools", "schoolrequests"]);
      const collections = await db.listCollections().toArray();
      const cleared: Record<string, number> = {};
      let removed = 0;

      for (const c of collections) {
        if (KEEP.has(c.name)) continue;
        const result = await db.collection(c.name).deleteMany({ schoolId });
        if (result.deletedCount) {
          cleared[c.name] = result.deletedCount;
          removed += result.deletedCount;
        }
      }

      res.json({ data: { removed, cleared } });
    } catch (err) {
      next(err);
    }
  }
);

/* --------------------------------------------- Super Admin: manage tenants */

// Everything below is platform-owner only.
router.use(requireRole("super_admin"));

const broadcastSchema = z.object({
  title: z.string().min(2),
  body: z.string().default(""),
});

/** Send one in-app notification to every tenant school. */
router.post("/broadcast", validate(broadcastSchema), async (req, res, next) => {
  try {
    const { title, body } = req.body as z.infer<typeof broadcastSchema>;
    const schools = await School.find({}, "schoolId");
    await Promise.all(
      schools.map((s) =>
        notifySchool(s.schoolId, { type: "broadcast", title, body, link: "/dashboard" })
      )
    );
    res.json({ data: { sent: schools.length } });
  } catch (err) {
    next(err);
  }
});

/**
 * Sign in AS a school's admin (support/impersonation). Returns a token scoped
 * to that school so the platform owner can see and manage the school's own
 * panel. Super-admin only.
 */
router.post("/:schoolId/impersonate", async (req, res, next) => {
  try {
    const school = await findSchool(String(req.params.schoolId));
    const user =
      (await User.findOne({ schoolId: school.schoolId, role: "school_admin" })) ??
      (await User.findOne({ email: school.email, schoolId: school.schoolId })) ??
      (await User.findOne({ schoolId: school.schoolId }));
    if (!user) throw ApiError.notFound("No user account found for this school.");

    const token = signToken({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
    });
    res.json({ data: { token, user: toPublicUser(user), schoolName: school.name } });
  } catch (err) {
    next(err);
  }
});

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
 * Diagnostic: raw TCP reachability from THIS server. Proves whether SMTP ports
 * are actually open outbound (vs a config problem). google.com:443 is a control
 * that should always connect.
 */
router.get("/net-test", async (_req, res, next) => {
  try {
    const probe = (label: string, host: string, port: number, family: 0 | 4 | 6 = 0, timeout = 8000) =>
      new Promise<{ label: string; ok: boolean; ms: number; code?: string; error?: string }>((resolve) => {
        const start = Date.now();
        const socket = new net.Socket();
        let done = false;
        const finish = (ok: boolean, code?: string, error?: string) => {
          if (done) return;
          done = true;
          socket.destroy();
          resolve({ label, ok, ms: Date.now() - start, code, error });
        };
        socket.setTimeout(timeout);
        socket.once("connect", () => finish(true));
        socket.once("timeout", () => finish(false, "ETIMEDOUT", "timeout"));
        socket.once("error", (e: NodeJS.ErrnoException) => finish(false, e.code, e.message));
        socket.connect({ host, port, family });
      });

    // DNS: what does smtp.gmail.com resolve to over IPv4 vs IPv6?
    const a = await dns.resolve4("smtp.gmail.com").catch((e) => [`err:${e.code}`]);
    const aaaa = await dns.resolve6("smtp.gmail.com").catch((e) => [`err:${e.code}`]);

    const probes = await Promise.all([
      probe("gmail:465 (default)", "smtp.gmail.com", 465, 0),
      probe("gmail:465 (IPv4)", "smtp.gmail.com", 465, 4),
      probe("gmail:465 (IPv6)", "smtp.gmail.com", 465, 6),
      probe("gmail:587 (IPv4)", "smtp.gmail.com", 587, 4),
      probe("google:443 (IPv4)", "google.com", 443, 4),
    ]);

    res.json({ data: { dns: { A: a, AAAA: aaaa }, probes } });
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

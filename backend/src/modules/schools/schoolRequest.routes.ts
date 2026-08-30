import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate, parsed } from "../../middleware/validate.js";
import { ApiError } from "../../utils/ApiError.js";
import { env } from "../../config/env.js";
import { User, hashPassword } from "../auth/user.model.js";
import { generateTempPassword, slugify, shortId } from "../../utils/password.js";
import { sendEmail, isEmailConfigured } from "../../utils/email.js";
import { SchoolRequest, toPublicRequest, REQUEST_STATUSES } from "./schoolRequest.model.js";
import { School, evaluateAccess } from "./school.model.js";
import { requestReceivedEmail, approvalEmail, rejectionEmail } from "./emails.js";

const router = Router();

/* ------------------------------------------------------------ public sign-up */

const registrationSchema = z.object({
  schoolName: z.string().min(2, "School name is required"),
  ownerName: z.string().min(2, "Owner name is required"),
  email: z.email(),
  phone: z.string().min(6, "A valid phone number is required"),
  address: z.string().min(3, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  country: z.string().min(2).default("India"),
  studentCount: z.coerce.number<number>().min(0).default(0),
  teacherCount: z.coerce.number<number>().min(0).default(0),
  schoolType: z.string().default(""),
  website: z.union([z.url(), z.literal("")]).default(""),
  message: z.string().max(2000).default(""),
});

/**
 * Open registration. Anyone can submit; nothing is activated. A duplicate email
 * — one already registered, or one already waiting in the queue — is refused so
 * the same school can't create two accounts.
 */
router.post("/", validate(registrationSchema), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof registrationSchema>;
    const email = body.email.toLowerCase();

    if (await User.exists({ email })) {
      throw ApiError.conflict("An account already exists for this email. Try signing in instead.");
    }
    if (await SchoolRequest.exists({ email, status: "pending" })) {
      throw ApiError.conflict("A request for this email is already under review.");
    }

    const request = await SchoolRequest.create({ ...body, email });

    // Best-effort acknowledgement — never let a mail hiccup fail the sign-up.
    void sendEmail(requestReceivedEmail({ to: email, schoolName: body.schoolName }));

    res.status(201).json({
      data: { id: String(request._id), status: request.status },
    });
  } catch (err) {
    next(err);
  }
});

/* --------------------------------------------------- Super Admin: management */

// Everything below is platform-owner only.
router.use(requireAuth, requireRole("super_admin"));

const listQuerySchema = z.object({
  status: z.enum([...REQUEST_STATUSES, "all"]).default("all"),
  search: z.string().optional(),
});

router.get("/", validate(listQuerySchema, "query"), async (req, res, next) => {
  try {
    const { status, search } = parsed<z.infer<typeof listQuerySchema>>(req, "query");

    const filter: Record<string, unknown> = {};
    if (status !== "all") filter.status = status;
    if (search?.trim()) {
      const safe = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const rx = new RegExp(safe, "i");
      filter.$or = [{ schoolName: rx }, { ownerName: rx }, { email: rx }, { city: rx }];
    }

    const requests = await SchoolRequest.find(filter).sort({ createdAt: -1 });

    // Join the live subscription state for approved requests in one lookup.
    const schoolIds = requests.map((r) => r.schoolId).filter(Boolean);
    const schools = schoolIds.length
      ? await School.find({ schoolId: { $in: schoolIds } })
      : [];
    const bySchoolId = new Map(schools.map((s) => [s.schoolId, s]));

    const data = requests.map((r) => {
      const base = toPublicRequest(r);
      const school = r.schoolId ? bySchoolId.get(r.schoolId) : undefined;
      return {
        ...base,
        trialStatus: school ? evaluateAccess(school).status : null,
        trialEndDate: school?.subscription.trialEndDate ?? null,
      };
    });

    res.json({ data, meta: { total: data.length } });
  } catch (err) {
    next(err);
  }
});

/** Aggregate counts for the Super Admin dashboard cards. */
router.get("/stats/overview", async (_req, res, next) => {
  try {
    const [pending, approved, rejected, schools] = await Promise.all([
      SchoolRequest.countDocuments({ status: "pending" }),
      SchoolRequest.countDocuments({ status: "approved" }),
      SchoolRequest.countDocuments({ status: "rejected" }),
      School.find(),
    ]);

    let activeTrials = 0;
    let trialsExpired = 0;
    let paid = 0;
    let suspended = 0;
    let revenue = 0; // ₹ value of currently-active paid subscriptions
    for (const s of schools) {
      const a = evaluateAccess(s);
      if (a.status === "suspended") suspended++;
      else if (a.status === "active") {
        // Free-access accounts read as "active" but aren't paying.
        if (!s.subscription.freeAccess && s.subscription.plan !== "trial") {
          paid++;
          revenue += (s.subscription.plan === "yearly" ? env.PLAN_YEARLY_PRICE : env.PLAN_MONTHLY_PRICE) / 100;
        }
      } else if (a.status === "trial") activeTrials++;
      else if (a.status === "expired") trialsExpired++;
    }

    res.json({
      data: {
        totalSchools: schools.length,
        pendingRequests: pending,
        approvedRequests: approved,
        rejectedRequests: rejected,
        activeTrials,
        trialsExpired,
        paidSchools: paid,
        suspendedSchools: suspended,
        revenue,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const request = await SchoolRequest.findById(req.params.id);
    if (!request) throw ApiError.notFound("Request not found.");

    const school = request.schoolId
      ? await School.findOne({ schoolId: request.schoolId })
      : null;

    res.json({
      data: {
        ...toPublicRequest(request),
        school: school
          ? { subscription: school.subscription, access: evaluateAccess(school) }
          : null,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * Approve a request: create the tenant, its admin login and a 7-day trial, then
 * email the credentials. The temporary password is returned once in the
 * response (never stored in plain text) so the UI can show it if mail is off.
 */
router.post("/:id/approve", async (req, res, next) => {
  try {
    const request = await SchoolRequest.findById(req.params.id);
    if (!request) throw ApiError.notFound("Request not found.");
    if (request.status === "approved") {
      throw ApiError.conflict("This request has already been approved.");
    }

    const email = request.email.toLowerCase();
    if (await User.exists({ email })) {
      throw ApiError.conflict(`An account already exists for ${email}.`);
    }

    // Unique tenant id from the school name plus a random suffix.
    let schoolId = "";
    for (let i = 0; i < 6; i++) {
      const candidate = `${slugify(request.schoolName)}-${shortId(3)}`;
      if (!(await School.exists({ schoolId: candidate }))) {
        schoolId = candidate;
        break;
      }
    }
    if (!schoolId) throw ApiError.badRequest("Could not allocate a school id. Try again.");

    const now = new Date();
    const trialEnd = new Date(now.getTime() + env.TRIAL_DAYS * 86_400_000);

    const school = await School.create({
      schoolId,
      name: request.schoolName,
      ownerName: request.ownerName,
      email,
      phone: request.phone,
      address: request.address,
      city: request.city,
      state: request.state,
      country: request.country,
      studentCount: request.studentCount,
      teacherCount: request.teacherCount,
      schoolType: request.schoolType,
      website: request.website,
      status: "active",
      subscription: {
        plan: "trial",
        status: "trial",
        trialStartDate: now,
        trialEndDate: trialEnd,
        paymentStatus: "pending",
      },
    });

    const tempPassword = generateTempPassword();

    // If creating the login fails, don't leave an orphan tenant behind.
    let adminUser;
    try {
      adminUser = await User.create({
        name: request.ownerName,
        email,
        passwordHash: await hashPassword(tempPassword),
        role: "school_admin",
        schoolId,
      });
    } catch (err) {
      await School.deleteOne({ _id: school._id });
      throw err;
    }

    request.status = "approved";
    request.reviewedBy = req.user!.id;
    request.reviewedAt = now;
    request.schoolId = schoolId;
    await request.save();

    // Fire-and-forget: don't make the admin wait on the SMTP handshake.
    void sendEmail(
      approvalEmail({
        to: email,
        schoolName: school.name,
        email,
        temporaryPassword: tempPassword,
        loginUrl: env.APP_LOGIN_URL,
        trialStartDate: now,
        trialEndDate: trialEnd,
      })
    );

    res.status(201).json({
      data: {
        schoolId,
        email,
        // Shown once so the admin can pass it on if email delivery is off.
        temporaryPassword: tempPassword,
        emailDelivered: isEmailConfigured(),
        trialStartDate: now,
        trialEndDate: trialEnd,
        userId: String(adminUser._id),
      },
    });
  } catch (err) {
    next(err);
  }
});

const rejectSchema = z.object({ reason: z.string().max(500).optional() });

router.post("/:id/reject", validate(rejectSchema), async (req, res, next) => {
  try {
    const { reason } = req.body as z.infer<typeof rejectSchema>;
    const request = await SchoolRequest.findById(req.params.id);
    if (!request) throw ApiError.notFound("Request not found.");
    if (request.status === "approved") {
      throw ApiError.conflict("An approved request cannot be rejected.");
    }

    request.status = "rejected";
    request.reviewedBy = req.user!.id;
    request.reviewedAt = new Date();
    request.rejectionReason = reason ?? "";
    await request.save();

    void sendEmail(
      rejectionEmail({ to: request.email, schoolName: request.schoolName, reason })
    );

    res.json({ data: toPublicRequest(request) });
  } catch (err) {
    next(err);
  }
});

/**
 * Fully remove a request AND everything it created — the tenant school and all
 * its user logins — in one go, so nothing is left orphaned across collections.
 */
router.delete("/:id", async (req, res, next) => {
  try {
    const request = await SchoolRequest.findById(req.params.id);
    if (!request) throw ApiError.notFound("Request not found.");

    if (request.schoolId) {
      await School.deleteOne({ schoolId: request.schoolId });
      await User.deleteMany({ schoolId: request.schoolId });
    }
    await SchoolRequest.deleteOne({ _id: request._id });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;

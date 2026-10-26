import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { User, hashPassword, toPublicUser, USER_ROLES, type UserDoc } from "./user.model.js";
import { RefreshToken, generateRefreshToken, hashRefreshToken } from "./refreshToken.model.js";
import { signToken, requireAuth, requireRole } from "../../middleware/auth.js";
import { Role, permissionsOf } from "../roles/role.model.js";
import { validate } from "../../middleware/validate.js";
import { ApiError } from "../../utils/ApiError.js";
import { env } from "../../config/env.js";

const router = Router();

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z
  .object({
    name: z.string().min(2),
    email: z.email(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(USER_ROLES),
    /** Required when role is "custom" — the Role document's key. */
    customRoleKey: z.string().trim().default(""),
    schoolId: z.string().default("school_1"),
  })
  .refine((d) => d.role !== "custom" || d.customRoleKey.length > 0, {
    message: "A custom role requires a role to be selected.",
    path: ["customRoleKey"],
  });

/**
 * Public user shape + resolved permissions for a custom role. Built-in roles get
 * their fixed client-side gating, so they carry no permission map.
 */
async function publicUserWithPermissions(user: UserDoc) {
  const base = toPublicUser(user);
  if (user.role !== "custom" || !user.customRoleKey) return base;
  const role = await Role.findOne({
    schoolId: user.schoolId,
    key: user.customRoleKey,
    isActive: true,
  });
  return { ...base, permissions: permissionsOf(role), roleName: role?.name ?? "" };
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again after 15 minutes." },
  skip: (req) => req.ip === "127.0.0.1" || req.ip === "::1",
});

router.post("/login", loginLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body as z.infer<typeof loginSchema>;

    // The hash is `select: false`, so it must be asked for explicitly.
    const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");

    // Same message whether the email is unknown or the password is wrong —
    // distinguishing them would let an attacker enumerate valid accounts.
    if (!user || !(await user.verifyPassword(password))) {
      throw ApiError.unauthorized("Incorrect email or password.");
    }
    if (!user.isActive) {
      throw ApiError.forbidden("This account has been deactivated.");
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = signToken({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      customRoleKey: user.customRoleKey ?? "",
    });

    // Issue a refresh token (30-day, stored hashed) so the client can get a
    // new access token without re-entering credentials.
    const rawRefresh = generateRefreshToken();
    await RefreshToken.create({
      tokenHash: hashRefreshToken(rawRefresh),
      userId: user._id.toString(),
      schoolId: user.schoolId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    res.json({ token, refreshToken: rawRefresh, user: await publicUserWithPermissions(user) });
  } catch (err) {
    next(err);
  }
});

/** Exchange a valid refresh token for a new access token. */
router.post("/refresh", async (req, res, next) => {
  try {
    const raw = (req.body as { refreshToken?: string })?.refreshToken;
    if (!raw) throw ApiError.unauthorized("Refresh token is required.");

    const hash = hashRefreshToken(raw);
    const stored = await RefreshToken.findOne({ tokenHash: hash });
    if (!stored || stored.expiresAt < new Date()) {
      if (stored) await stored.deleteOne();
      throw ApiError.unauthorized("Session expired. Please sign in again.");
    }

    const user = await User.findById(stored.userId);
    if (!user || !user.isActive) throw ApiError.unauthorized("Account not found or deactivated.");

    const token = signToken({
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      customRoleKey: user.customRoleKey ?? "",
    });

    // Rotate: delete old refresh token, issue a new one.
    await stored.deleteOne();
    const newRaw = generateRefreshToken();
    await RefreshToken.create({
      tokenHash: hashRefreshToken(newRaw),
      userId: user._id.toString(),
      schoolId: user.schoolId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    res.json({ token, refreshToken: newRaw, user: await publicUserWithPermissions(user) });
  } catch (err) {
    next(err);
  }
});

/** Invalidate the refresh token so the session can't be silently renewed. */
router.post("/logout", async (req, res, next) => {
  try {
    const raw = (req.body as { refreshToken?: string })?.refreshToken;
    if (raw) await RefreshToken.deleteOne({ tokenHash: hashRefreshToken(raw) });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/** Forgot password — issues a reset token and emails it. Rate-limited. */
const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again after 15 minutes." },
});

const forgotSchema = z.object({ email: z.email() });

// In-memory store: token → { userId, expiresAt }. A real deployment should use
// Redis or a DB collection; this is sufficient for a single-process server.
const RESET_TOKENS = new Map<string, { userId: string; expiresAt: number }>();

router.post("/forgot-password", forgotLimiter, validate(forgotSchema), async (req, res, next) => {
  try {
    const { email } = req.body as z.infer<typeof forgotSchema>;
    // Always respond 200 — never reveal whether the email exists.
    const user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      const token = (await import("node:crypto")).randomBytes(32).toString("hex");
      RESET_TOKENS.set(token, { userId: String(user._id), expiresAt: Date.now() + 15 * 60 * 1000 });
      // Prune expired tokens.
      for (const [k, v] of RESET_TOKENS) if (v.expiresAt < Date.now()) RESET_TOKENS.delete(k);
      const { sendEmail, isEmailConfigured } = await import("../../utils/email.js");
      const { env } = await import("../../config/env.js");
      if (isEmailConfigured()) {
        void sendEmail({
          to: user.email,
          subject: `${env.SOFTWARE_NAME}: Reset your password`,
          text: `Use this link to reset your password (valid 15 minutes):\n\n${env.APP_LOGIN_URL}?reset=${token}\n\nIf you didn't request this, ignore this email.`,
          html: `<p>Use this link to reset your password (valid 15 minutes):</p><p><a href="${env.APP_LOGIN_URL}?reset=${token}">${env.APP_LOGIN_URL}?reset=${token}</a></p><p>If you didn't request this, ignore this email.</p>`,
        });
      }
    }
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

router.post("/reset-password", validate(resetPasswordSchema), async (req, res, next) => {
  try {
    const { token, newPassword } = req.body as z.infer<typeof resetPasswordSchema>;
    const entry = RESET_TOKENS.get(token);
    if (!entry || entry.expiresAt < Date.now()) {
      RESET_TOKENS.delete(token);
      throw ApiError.badRequest("This reset link has expired or is invalid. Please request a new one.");
    }
    const user = await User.findById(entry.userId);
    if (!user) throw ApiError.notFound("Account not found.");
    user.passwordHash = await hashPassword(newPassword);
    await user.save();
    RESET_TOKENS.delete(token);
    // Invalidate all refresh tokens for this user so old sessions can't continue.
    await RefreshToken.deleteMany({ userId: String(user._id) });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/** Creating accounts is an admin action, not open self-service. */
router.post(
  "/register",
  requireAuth,
  requireRole("super_admin", "school_admin"),
  validate(registerSchema),
  async (req, res, next) => {
    try {
      const { name, email, password, role, customRoleKey, schoolId } = req.body as z.infer<
        typeof registerSchema
      >;

      if (await User.exists({ email: email.toLowerCase() })) {
        throw ApiError.conflict(`An account already exists for ${email}.`);
      }

      const user = await User.create({
        name,
        email: email.toLowerCase(),
        passwordHash: await hashPassword(password),
        role,
        // Only a custom role carries a key; built-in roles never do.
        customRoleKey: role === "custom" ? customRoleKey : "",
        schoolId,
      });

      res.status(201).json({ user: toPublicUser(user) });
    } catch (err) {
      next(err);
    }
  }
);

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) throw ApiError.unauthorized("This account no longer exists.");
    res.json({ user: await publicUserWithPermissions(user) });
  } catch (err) {
    next(err);
  }
});

const updateMeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  // A downscaled data URL (the app's convention for photos); generously capped
  // so a huge upload can't be posted.
  avatar: z.string().max(2_000_000, "Image is too large").optional(),
});

/** The signed-in user edits their OWN basic profile — display name and photo. */
router.patch("/me", requireAuth, validate(updateMeSchema), async (req, res, next) => {
  try {
    const { name, avatar } = req.body as z.infer<typeof updateMeSchema>;
    const user = await User.findById(req.user!.id);
    if (!user) throw ApiError.unauthorized("This account no longer exists.");
    if (typeof name === "string") user.name = name.trim();
    if (typeof avatar === "string") user.avatar = avatar;
    await user.save();
    res.json({ user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

/**
 * The signed-in user changes their OWN password. The current password is verified
 * first so a stolen session alone can't silently lock the owner out. passwordHash
 * is `select:false`, so it must be requested explicitly (as in /login).
 */
router.patch("/me/password", requireAuth, validate(changePasswordSchema), async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body as z.infer<typeof changePasswordSchema>;
    const user = await User.findById(req.user!.id).select("+passwordHash");
    if (!user) throw ApiError.unauthorized("This account no longer exists.");
    if (!(await user.verifyPassword(currentPassword))) {
      throw ApiError.badRequest("Your current password is incorrect.");
    }
    user.passwordHash = await hashPassword(newPassword);
    await user.save();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

/* ------------------------------------------------------------------ */
/* User management — school_admin / principal only                      */
/* ------------------------------------------------------------------ */

/** List all user accounts for the caller's school. */
router.get(
  "/users",
  requireAuth,
  requireRole("super_admin", "school_admin", "principal"),
  async (req, res, next) => {
    try {
      const schoolId = req.user!.schoolId;
      const users = await User.find({ schoolId }).sort({ createdAt: -1 }).select("-passwordHash");
      res.json({
        data: users.map(toPublicUser),
        meta: { total: users.length },
      });
    } catch (err) {
      next(err);
    }
  }
);

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(USER_ROLES).optional(),
  /** Set alongside role "custom" to point at the Role document. */
  customRoleKey: z.string().trim().optional(),
  isActive: z.boolean().optional(),
});

/** Update a user's name, role or active status. */
router.patch(
  "/users/:id",
  requireAuth,
  requireRole("super_admin", "school_admin"),
  validate(updateUserSchema),
  async (req, res, next) => {
    try {
      const schoolId = req.user!.schoolId;
      const updates = req.body as z.infer<typeof updateUserSchema>;
      const user = await User.findOne({ _id: req.params.id, schoolId });
      if (!user) throw ApiError.notFound("User not found.");
      // Prevent demoting the last school_admin.
      if (updates.isActive === false || updates.role) {
        const adminCount = await User.countDocuments({ schoolId, role: "school_admin", isActive: true });
        if (user.role === "school_admin" && adminCount <= 1) {
          throw ApiError.badRequest("Cannot deactivate or change the role of the last school admin.");
        }
      }
      if (typeof updates.name === "string") user.name = updates.name.trim();
      if (typeof updates.role === "string") {
        user.role = updates.role;
        // Keep the custom-role key consistent: set it for a custom role, clear it
        // for any built-in role.
        if (updates.role === "custom") {
          user.customRoleKey = (updates.customRoleKey ?? user.customRoleKey ?? "").trim();
        } else {
          user.customRoleKey = "";
        }
      } else if (typeof updates.customRoleKey === "string" && user.role === "custom") {
        user.customRoleKey = updates.customRoleKey.trim();
      }
      if (typeof updates.isActive === "boolean") user.isActive = updates.isActive;
      await user.save();
      res.json({ data: toPublicUser(user) });
    } catch (err) {
      next(err);
    }
  }
);

export default router;

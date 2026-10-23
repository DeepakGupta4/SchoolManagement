import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { User, hashPassword, toPublicUser, USER_ROLES } from "./user.model.js";
import { RefreshToken, generateRefreshToken, hashRefreshToken } from "./refreshToken.model.js";
import { signToken, requireAuth, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { ApiError } from "../../utils/ApiError.js";
import { env } from "../../config/env.js";

const router = Router();

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(USER_ROLES),
  schoolId: z.string().default("school_1"),
});

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

    res.json({ token, refreshToken: rawRefresh, user: toPublicUser(user) });
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

    res.json({ token, refreshToken: newRaw, user: toPublicUser(user) });
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

/** Creating accounts is an admin action, not open self-service. */
router.post(
  "/register",
  requireAuth,
  requireRole("super_admin", "school_admin"),
  validate(registerSchema),
  async (req, res, next) => {
    try {
      const { name, email, password, role, schoolId } = req.body as z.infer<typeof registerSchema>;

      if (await User.exists({ email: email.toLowerCase() })) {
        throw ApiError.conflict(`An account already exists for ${email}.`);
      }

      const user = await User.create({
        name,
        email: email.toLowerCase(),
        passwordHash: await hashPassword(password),
        role,
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
    res.json({ user: toPublicUser(user) });
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

export default router;

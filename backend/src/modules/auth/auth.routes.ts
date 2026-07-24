import { Router } from "express";
import { z } from "zod";
import { User, hashPassword, toPublicUser, USER_ROLES } from "./user.model.js";
import { signToken, requireAuth, requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { ApiError } from "../../utils/ApiError.js";

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

router.post("/login", validate(loginSchema), async (req, res, next) => {
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

    res.json({ token, user: toPublicUser(user) });
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

export default router;

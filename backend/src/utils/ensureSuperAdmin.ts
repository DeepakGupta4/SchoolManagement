import { User, hashPassword } from "../modules/auth/user.model.js";
import { env } from "../config/env.js";

/**
 * Guarantees a platform owner exists.
 *
 * A brand-new deployment has no one who can approve schools. If
 * SUPER_ADMIN_EMAIL/PASSWORD are set, this upserts that account at boot (safe to
 * run every start — it only creates the user if missing, and never overwrites an
 * existing password). Runs against the real database too, unlike the demo seed.
 */
export async function ensureSuperAdmin(): Promise<void> {
  if (!env.SUPER_ADMIN_EMAIL || !env.SUPER_ADMIN_PASSWORD) return;

  const email = env.SUPER_ADMIN_EMAIL.toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) {
    // Make sure the account has the right role and is enabled, but leave its
    // password alone so a rotated env value can't lock the real owner out.
    if (existing.role !== "super_admin" || !existing.isActive) {
      existing.role = "super_admin";
      existing.isActive = true;
      await existing.save();
    }
    return;
  }

  await User.create({
    name: env.SUPER_ADMIN_NAME,
    email,
    passwordHash: await hashPassword(env.SUPER_ADMIN_PASSWORD),
    role: "super_admin",
    schoolId: "platform",
  });
  console.log(`Super Admin ready: ${email}`);
}

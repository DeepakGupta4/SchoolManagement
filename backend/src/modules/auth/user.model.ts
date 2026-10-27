import mongoose, { Schema, type InferSchemaType } from "mongoose";
import bcrypt from "bcryptjs";

/**
 * Every person who can sign in. Students, parents, drivers and staff all live
 * here — the `role` decides what the token is allowed to do, and each of the
 * planned apps (parent, student, driver) authenticates against this one model.
 */
export const USER_ROLES = [
  "super_admin",
  "school_admin",
  "principal",
  "teacher",
  "accountant",
  "librarian",
  "parent",
  "student",
  "driver",
  "staff",
  // A school-defined custom role; the actual permissions live on a Role document
  // referenced by `customRoleKey` (see modules/roles). Lets admins add their own
  // roles without touching this fixed built-in list.
  "custom",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    // `select: false` keeps the hash out of every query result by default, so
    // it can't be leaked by a careless `res.json(user)`.
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: USER_ROLES, required: true },
    /** When role is "custom", the key of the Role document that holds this user's
     *  permissions (modules/roles). Empty for every built-in role. */
    customRoleKey: { type: String, default: "" },
    schoolId: { type: String, required: true, default: "school_1", index: true },
    avatar: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

/**
 * Roles that are one-per-school: a school has exactly one account owner
 * (school_admin) and one principal. Enforced in the routes (for a friendly
 * message) and by the partial unique indexes below (race-safe, DB-level).
 */
export const SINGLETON_ROLES = ["school_admin", "principal"] as const;

export function isSingletonRole(role: string): role is (typeof SINGLETON_ROLES)[number] {
  return (SINGLETON_ROLES as readonly string[]).includes(role);
}

// One ACTIVE school_admin and one ACTIVE principal per school. Partial indexes so
// only active holders are constrained — a deactivated admin/principal can be
// replaced. NOTE: if a school already has two active holders of either role, the
// matching index won't build until the duplicates are resolved; the route-level
// check still blocks new duplicates in the meantime.
userSchema.index(
  { schoolId: 1 },
  { unique: true, partialFilterExpression: { role: "school_admin", isActive: true } }
);
userSchema.index(
  { schoolId: 1 },
  { unique: true, partialFilterExpression: { role: "principal", isActive: true } }
);

userSchema.methods.verifyPassword = function (plain: string): Promise<boolean> {
  return bcrypt.compare(plain, this.passwordHash);
};

/** Hashes a plaintext password with a per-password salt. */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export type UserDoc = InferSchemaType<typeof userSchema> & {
  _id: mongoose.Types.ObjectId;
  verifyPassword(plain: string): Promise<boolean>;
};

export const User = mongoose.model<UserDoc>("User", userSchema);

/** Shape returned to clients — never includes the hash. */
export function toPublicUser(user: UserDoc) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    customRoleKey: user.customRoleKey ?? "",
    schoolId: user.schoolId,
    avatar: user.avatar,
  };
}

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
    schoolId: { type: String, required: true, default: "school_1", index: true },
    avatar: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
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
    schoolId: user.schoolId,
    avatar: user.avatar,
  };
}

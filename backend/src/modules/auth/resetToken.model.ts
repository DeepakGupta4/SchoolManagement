import mongoose, { Schema } from "mongoose";
import crypto from "node:crypto";

/**
 * One-time, short-lived tokens for password reset and the danger-zone data reset.
 *
 * Stored in Mongo (not process memory) so a link issued before a deploy/restart —
 * or served by a different instance than the one that minted it — still works.
 * Render restarts on every push and free instances spin down on idle, which made
 * the old in-memory Map silently invalidate live reset links. A TTL index sweeps
 * expired rows automatically.
 */
const resetTokenSchema = new Schema(
  {
    token: { type: String, required: true, unique: true, index: true },
    purpose: { type: String, enum: ["password", "data-reset"], required: true },
    // Exactly one of these is meaningful, depending on purpose.
    userId: { type: String, default: "" },
    schoolId: { type: String, default: "" },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  },
  { timestamps: true }
);

export const ResetToken = mongoose.model("ResetToken", resetTokenSchema);

export type ResetPurpose = "password" | "data-reset";

/** Issues a random token, persists it, and returns the token string. */
export async function issueResetToken(input: {
  purpose: ResetPurpose;
  userId?: string;
  schoolId?: string;
  ttlMs: number;
}): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  await ResetToken.create({
    token,
    purpose: input.purpose,
    userId: input.userId ?? "",
    schoolId: input.schoolId ?? "",
    expiresAt: new Date(Date.now() + input.ttlMs),
  });
  return token;
}

/**
 * Validates and CONSUMES a token (one-time use): atomically deletes it and returns
 * its payload, or null if it's missing, the wrong purpose, or expired. The TTL
 * index sweeps lazily (up to ~60s late), so expiry is also checked here so an
 * expired token is never honoured.
 */
export async function consumeResetToken(
  token: string,
  purpose: ResetPurpose
): Promise<{ userId: string; schoolId: string } | null> {
  if (!token) return null;
  const doc = await ResetToken.findOneAndDelete({ token, purpose });
  if (!doc || doc.expiresAt.getTime() < Date.now()) return null;
  return { userId: doc.userId, schoolId: doc.schoolId };
}

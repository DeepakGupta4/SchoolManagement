import mongoose, { Schema } from "mongoose";

/**
 * Refresh tokens — long-lived (30 days), stored hashed in the DB.
 * On logout the token is deleted, so a stolen access token can't be
 * silently renewed after the user signs out.
 */
const refreshTokenSchema = new Schema(
  {
    tokenHash: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    schoolId: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  },
  { timestamps: true }
);

export const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);

import crypto from "node:crypto";

export function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString("hex");
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

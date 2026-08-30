import { apiRequest } from "./client";

/**
 * The signed-in school's live subscription state, as decided by the server.
 * The UI uses this only for display (banner, lock screen) — the backend is the
 * real gate and returns 402 on protected routes when access is not allowed.
 */

export type SubscriptionStatus =
  | "trial"
  | "active"
  | "expired"
  | "suspended"
  | "cancelled"
  | "payment_pending";

export interface MySubscription {
  /** false for the platform owner and legacy tenants — never gated, no banner. */
  hasSubscription: boolean;
  allowed: boolean;
  status: SubscriptionStatus;
  plan: "trial" | "monthly" | "yearly" | null;
  daysRemaining: number | null;
  trialEndDate: string | null;
  paidEndDate: string | null;
  schoolName: string | null;
}

export async function getMySubscription(): Promise<MySubscription> {
  return apiRequest<MySubscription>("/api/schools/me");
}

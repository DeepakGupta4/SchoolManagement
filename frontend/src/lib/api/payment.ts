import { apiRequest } from "./client";

/** Subscription tiers (per-student pricing) and Razorpay checkout wiring. */

export type TierId = "starter" | "standard" | "premium";
export type BillingCycle = "monthly" | "yearly";

export interface TierPlan {
  id: TierId;
  name: string;
  blurb: string;
  /** Module keys this tier unlocks. */
  modules: string[];
  perStudentMonthlyInr: number;
  perStudentYearlyInr: number;
  /** Per-student rate × this school's billed student count. */
  monthlyTotalInr: number;
  yearlyTotalInr: number;
}

export interface PlansResponse {
  tiers: TierPlan[];
  /** Active students in this school (what the price is based on). */
  students: number;
  /** Billed count — students floored to a minimum so a tiny school still pays a real amount. */
  billedStudents: number;
  minBilledStudents: number;
  paymentEnabled: boolean;
  /** The school's current paid tier + cycle, if any. */
  currentTier: TierId | null;
  currentCycle: BillingCycle | null;
}

export async function getPlans(): Promise<PlansResponse> {
  return apiRequest<PlansResponse>("/api/subscription/plans");
}

export interface RazorpayOrder {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  tier: TierId;
  cycle: BillingCycle;
  billedStudents: number;
}

export async function createOrder(tier: TierId, cycle: BillingCycle): Promise<RazorpayOrder> {
  return apiRequest<RazorpayOrder>("/api/subscription/order", { method: "POST", body: { tier, cycle } });
}

export interface VerifyPayload {
  tier: TierId;
  cycle: BillingCycle;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export async function verifyPayment(payload: VerifyPayload): Promise<unknown> {
  return apiRequest("/api/subscription/verify", { method: "POST", body: payload });
}

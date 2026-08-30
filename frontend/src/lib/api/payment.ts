import { apiRequest } from "./client";

/** Subscription plans and Razorpay checkout wiring. */

export interface Plan {
  id: "monthly" | "yearly";
  name: string;
  months: number;
  amount: number; // paise
  priceInr: number;
}

export interface PlansResponse {
  plans: Plan[];
  paymentEnabled: boolean;
}

export interface RazorpayOrder {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  plan: "monthly" | "yearly";
}

export async function getPlans(): Promise<PlansResponse> {
  return apiRequest<PlansResponse>("/api/subscription/plans");
}

export async function createOrder(plan: "monthly" | "yearly"): Promise<RazorpayOrder> {
  return apiRequest<RazorpayOrder>("/api/subscription/order", { method: "POST", body: { plan } });
}

export interface VerifyPayload {
  plan: "monthly" | "yearly";
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export async function verifyPayment(payload: VerifyPayload): Promise<unknown> {
  return apiRequest("/api/subscription/verify", { method: "POST", body: payload });
}

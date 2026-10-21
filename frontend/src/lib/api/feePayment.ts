import { apiRequest } from "./client";

/**
 * Self-service fee payment (Razorpay) for guardians and students.
 *
 * Mirrors the subscription-billing client, but for a student's OWN dues. The
 * order is created for the caller's outstanding balance (resolved and
 * ownership-checked on the server), and the payment is recorded on the ledger
 * only after the server verifies the signature — the browser is never trusted.
 */

export interface FeeOrder {
  keyId: string;
  orderId: string;
  amount: number; // paise
  currency: string;
  studentId: string;
  studentName: string;
  dueRupees: number;
}

/** Opens a Razorpay order for the caller's own dues (or a guardian's named child). */
export async function createFeeOrder(studentId?: string): Promise<FeeOrder> {
  return apiRequest<FeeOrder>("/api/fees/pay/order", {
    method: "POST",
    body: studentId ? { studentId } : {},
  });
}

export interface FeeVerifyPayload {
  studentId?: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/** The receipt the server posts after a verified online payment. */
export interface FeeReceipt {
  id: string;
  receiptNo: string;
  amount: number;
  studentName: string;
  date: string;
  method: string;
}

export async function verifyFeePayment(payload: FeeVerifyPayload): Promise<FeeReceipt> {
  return apiRequest<FeeReceipt>("/api/fees/pay/verify", { method: "POST", body: payload });
}

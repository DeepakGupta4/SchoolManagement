import crypto from "node:crypto";
import { env } from "../config/env.js";
import { PAYMENT_METHODS } from "../modules/fees/fee.model.js";

/**
 * Thin client for Razorpay's REST API.
 *
 * Uses plain HTTPS (port 443) and the built-in crypto module — no SDK — so it
 * stays consistent with the Gemini/OpenAI helpers and adds no dependency. Online
 * payment is OPTIONAL: without both keys the pay endpoints degrade to a clear
 * "not configured" 503 and guardians pay at the office, so the app still works.
 *
 * The KEY_ID is public (it's handed to the browser to open Checkout); the
 * KEY_SECRET signs orders and verifies callbacks and must never leave the server.
 */

const ORDERS_URL = "https://api.razorpay.com/v1/orders";
const PAYMENTS_URL = "https://api.razorpay.com/v1/payments";

export function isRazorpayConfigured(): boolean {
  return Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
}

/** The publishable key id, safe to send to the browser. */
export function razorpayKeyId(): string {
  return env.RAZORPAY_KEY_ID ?? "";
}

function authHeader(): string {
  const basic = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString("base64");
  return `Basic ${basic}`;
}

export interface RazorpayOrder {
  id: string;
  amount: number; // paise
  currency: string;
  status: string;
}

/**
 * Creates an order Razorpay Checkout can collect against. `amountPaise` is the
 * amount in the smallest currency unit (₹1 = 100). Throws when unconfigured or
 * on any API error — the caller catches and answers 503/502.
 */
export async function createRazorpayOrder(amountPaise: number, receipt: string): Promise<RazorpayOrder> {
  if (!isRazorpayConfigured()) throw new Error("Razorpay is not configured");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const res = await fetch(ORDERS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: authHeader() },
      // payment_capture:1 → funds are captured automatically on success, so we
      // never leave a guardian's money in an authorised-but-uncaptured limbo.
      body: JSON.stringify({ amount: amountPaise, currency: "INR", receipt, payment_capture: 1 }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Razorpay orders API ${res.status}: ${text.slice(0, 300)}`);
    }
    return (await res.json()) as RazorpayOrder;
  } finally {
    clearTimeout(timeout);
  }
}

export interface RazorpayPayment {
  id: string;
  amount: number; // paise
  currency: string;
  status: string; // "captured" when the money is actually taken
  method: string; // card | netbanking | upi | wallet | emi | …
  order_id: string;
}

/**
 * Fetches a payment straight from Razorpay so the amount and capture status are
 * read from the authority, never trusted from the browser callback.
 */
export async function fetchRazorpayPayment(paymentId: string): Promise<RazorpayPayment> {
  if (!isRazorpayConfigured()) throw new Error("Razorpay is not configured");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const res = await fetch(`${PAYMENTS_URL}/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: authHeader() },
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Razorpay payments API ${res.status}: ${text.slice(0, 300)}`);
    }
    return (await res.json()) as RazorpayPayment;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Verifies the Checkout callback signature: HMAC-SHA256(order_id|payment_id)
 * keyed by the secret must equal the signature Razorpay returned. A constant-
 * time compare avoids leaking anything through timing. A forged callback fails
 * here, so no receipt is ever posted for money that wasn't really paid.
 */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  if (!env.RAZORPAY_KEY_SECRET || !orderId || !paymentId || !signature) return false;
  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  // timingSafeEqual throws on length mismatch, which is itself a failed verify.
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * Maps a Razorpay payment method onto the ledger's fixed PAYMENT_METHODS, so an
 * online receipt sits in the same register as a counter one without widening the
 * enum. Unknown/UPI/wallet modes record as "UPI" (the common case in India).
 */
export function mapRazorpayMethod(method: string): (typeof PAYMENT_METHODS)[number] {
  switch (method) {
    case "card":
      return "Card";
    case "netbanking":
    case "bank_transfer":
      return "Bank Transfer";
    default:
      return "UPI";
  }
}

import { api } from "./client";

/** The fee desk day-book figures, derived server-side. Accountant-readable. */
export interface FeeSummary {
  collectedToday: number;
  byMode: Record<string, number>;
  totalCollected: number;
  outstanding: number;
  defaulters: number;
  pendingClearance: number;
  accounts: number;
  receipts: number;
}
export const getFeeSummary = () => api<FeeSummary>("/api/fees/summary");

export type PaymentStatus = "paid" | "pending-clearance" | "cancelled" | "bounced";

/** One receipt in the payment register. */
export interface Payment {
  id: string;
  receiptNo: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  className: string;
  date: string; // ISO
  amount: number;
  method: string;
  status: PaymentStatus;
}
// The server returns the most recent receipts (its own cap); a limit query is ignored.
export const listPayments = () => api<Payment[]>("/api/fees/payments");

export interface FeeHeadDue {
  head: string;
  billed: number;
  paid: number;
}

/** A student's fee ledger (billed-vs-paid per head). */
export interface FeeAccount {
  id: string;
  studentId: string;
  name: string;
  className: string;
  section: string;
  rollNo: string;
  guardian: string;
  guardianPhone: string;
  heads: FeeHeadDue[];
  lateFee: number;
  concession: number;
}
export const listFeeAccounts = () => api<FeeAccount[]>("/api/fees/accounts");

/** Outstanding balance for an account (billed + late fee − paid), never negative.
 *  Mirrors the web ledger's balanceOf; concession is already netted into billed. */
export const accountBalance = (a: FeeAccount) => {
  const billed = a.heads.reduce((s, h) => s + (h.billed || 0), 0) + (a.lateFee || 0);
  const paid = a.heads.reduce((s, h) => s + (h.paid || 0), 0);
  return Math.max(0, billed - paid);
};

/** ₹ in the Indian numbering style, whole rupees (the fee desk house style). */
export const inr = (n: number | null | undefined) =>
  typeof n === "number" ? `₹${Math.round(n).toLocaleString("en-IN")}` : "—";

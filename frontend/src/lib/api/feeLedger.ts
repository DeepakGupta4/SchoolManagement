import { apiList, apiRequest } from "./client";

/**
 * Student fee accounts and the payment register.
 *
 * A school almost never collects the full outstanding amount in one go — a
 * guardian pays what they can afford today, against the heads they choose.
 * So the ledger tracks billed-vs-paid PER HEAD, and a payment carries an
 * explicit allocation across those heads rather than a single lump figure.
 */

export type PaymentMethod = "Cash" | "UPI" | "Card" | "Cheque" | "Bank Transfer" | "DD";

/** Methods whose reference number is mandatory — cash never has one. */
export const REFERENCE_REQUIRED: PaymentMethod[] = ["UPI", "Card", "Cheque", "Bank Transfer", "DD"];

/** Instruments that clear later, so the receipt starts unconfirmed. */
export const CLEARS_LATER: PaymentMethod[] = ["Cheque", "DD"];

export const PAYMENT_METHODS: PaymentMethod[] = [
  "Cash",
  "UPI",
  "Card",
  "Cheque",
  "Bank Transfer",
  "DD",
];

/** Label for the reference field, which differs per instrument. */
export const REFERENCE_LABEL: Record<PaymentMethod, string> = {
  Cash: "Reference (optional)",
  UPI: "UPI transaction ID",
  Card: "Card txn / auth code",
  Cheque: "Cheque number",
  "Bank Transfer": "NEFT / IMPS reference",
  DD: "Demand draft number",
};

export interface FeeHeadDue {
  head: string;
  billed: number;
  paid: number;
}

export interface StudentFeeAccount {
  id: string;
  admissionNo: string;
  name: string;
  className: string;
  section: string;
  rollNo: string;
  guardian: string;
  guardianPhone: string;
  session: string;
  heads: FeeHeadDue[];
  /** Approved scholarship or sibling concession, already deducted from dues. */
  concession: number;
  /** Accrued for overdue instalments. Collected alongside the heads. */
  lateFee: number;
  lastPaymentDate: string | null;
}

export interface PaymentAllocation {
  head: string;
  amount: number;
}

export type PaymentStatus = "paid" | "pending-clearance" | "cancelled" | "bounced";

export interface Payment {
  id: string;
  receiptNo: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  className: string;
  /** ISO date the payment was recorded. */
  date: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  bank: string;
  allocations: PaymentAllocation[];
  remarks: string;
  collectedBy: string;
  status: PaymentStatus;
  /** Set when the payment was reversed (cancelled or bounced). */
  reversedAt?: string | null;
  reversedBy?: string;
  reversalReason?: string;
}

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

/* ------------------------------------------------------------------ */
/* Derived totals — never stored, so they cannot go stale               */
/* ------------------------------------------------------------------ */

export const headBalance = (h: FeeHeadDue) => Math.max(0, h.billed - h.paid);

export const totalBilled = (a: StudentFeeAccount) =>
  a.heads.reduce((sum, h) => sum + h.billed, 0) + a.lateFee;

export const totalPaid = (a: StudentFeeAccount) => a.heads.reduce((sum, h) => sum + h.paid, 0);

export const balanceOf = (a: StudentFeeAccount) => Math.max(0, totalBilled(a) - totalPaid(a));

export const isCleared = (a: StudentFeeAccount) => balanceOf(a) === 0;

/**
 * Spreads an amount across the unpaid heads in order, filling each before
 * moving on. This is what a clerk does by hand: the money goes to the oldest
 * dues first unless they say otherwise.
 */
export function autoAllocate(account: StudentFeeAccount, amount: number): PaymentAllocation[] {
  let left = Math.round(amount);
  const out: PaymentAllocation[] = [];

  for (const head of account.heads) {
    if (left <= 0) break;
    const due = headBalance(head);
    if (due <= 0) continue;
    const take = Math.min(due, left);
    out.push({ head: head.head, amount: take });
    left -= take;
  }

  // Anything still unallocated lands on late fee, which isn't a head row.
  if (left > 0 && account.lateFee > 0) out.push({ head: "Late Fee", amount: left });
  return out;
}

export interface FeeAccountFilters {
  search?: string;
  className?: string;
  /** "all" | "due" | "cleared" */
  standing?: string;
}

export const CLASS_OPTIONS = ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"];

/** Reads fee accounts from the server. Standing is derived, so it filters there. */
export const feeAccountsApi = {
  async list(filters: FeeAccountFilters = {}): Promise<StudentFeeAccount[]> {
    const result = await apiList<StudentFeeAccount>("/api/fees/accounts", {
      query: {
        search: filters.search,
        className: filters.className,
        standing: filters.standing,
      },
    });
    return result.data;
  },
};

export interface PaymentFilters {
  search?: string;
  method?: string;
  status?: string;
}

export const paymentsApi = {
  async list(filters: PaymentFilters = {}): Promise<Payment[]> {
    const result = await apiList<Payment>("/api/fees/payments", {
      query: { search: filters.search, method: filters.method, status: filters.status },
    });
    return result.data;
  },
};

/**
 * Records a payment and posts it to the student's ledger.
 *
 * This is ONE server call by design. The receipt and the ledger update happen
 * inside a database transaction, so a half-applied payment — a receipt with no
 * posting, or the reverse — cannot occur. The server also re-checks the amount
 * against the live balance, so a stale browser tab can't overpay.
 */
export async function collectPayment(input: {
  account: StudentFeeAccount;
  allocations: PaymentAllocation[];
  method: PaymentMethod;
  reference: string;
  bank: string;
  remarks: string;
  /** Kept for the call signature; the server records the signed-in collector. */
  collectedBy?: string;
}): Promise<Payment> {
  const { account, allocations, method, reference, bank, remarks } = input;

  return apiRequest<Payment>("/api/fees/collect", {
    method: "POST",
    body: { accountId: account.id, allocations, method, reference, bank, remarks },
  });
}

/** Marks a pending cheque/DD as realised. */
export async function clearPayment(id: string): Promise<Payment> {
  return apiRequest<Payment>(`/api/fees/payments/${id}/clear`, { method: "POST" });
}

/** Marks a pending cheque/DD as bounced — the server reverses the ledger. */
export async function bouncePayment(id: string, reason: string): Promise<Payment> {
  return apiRequest<Payment>(`/api/fees/payments/${id}/bounce`, {
    method: "POST",
    body: { reason },
  });
}

/** Cancels a receipt — the server returns the money to the ledger. */
export async function cancelPayment(id: string, reason: string): Promise<Payment> {
  return apiRequest<Payment>(`/api/fees/payments/${id}/cancel`, {
    method: "POST",
    body: { reason },
  });
}

/** The fee dashboard's day-book figures, all derived server-side. */
export async function getFeeSummary(): Promise<FeeSummary> {
  return apiRequest<FeeSummary>("/api/fees/summary");
}

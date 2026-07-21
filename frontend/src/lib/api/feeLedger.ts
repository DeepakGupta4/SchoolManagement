import { createResource, textMatch } from "./createResource";

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

export type PaymentStatus = "paid" | "pending-clearance" | "cancelled";

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

/* ------------------------------------------------------------------ */
/* Seed                                                                */
/* ------------------------------------------------------------------ */

const HEADS = ["Tuition", "Transport", "Lab", "Library", "Sports", "Exam"];

function account(
  i: number,
  name: string,
  className: string,
  section: string,
  guardian: string,
  billed: number[],
  paid: number[],
  concession = 0,
  lateFee = 0,
  lastPaymentDate: string | null = null
): StudentFeeAccount {
  return {
    id: `acc_${String(i).padStart(3, "0")}`,
    admissionNo: `ADM${2024000 + i}`,
    name,
    className,
    section,
    rollNo: String(i).padStart(2, "0"),
    guardian,
    guardianPhone: `9${810000000 + i * 137911}`,
    session: "2025-26",
    heads: HEADS.map((head, h) => ({ head, billed: billed[h] ?? 0, paid: paid[h] ?? 0 })),
    concession,
    lateFee,
    lastPaymentDate,
  };
}

const seed: StudentFeeAccount[] = [
  account(1, "Arjun Sharma", "Class 10", "A", "Rajesh Sharma", [24000, 6000, 1800, 900, 1200, 1500], [24000, 6000, 1800, 900, 1200, 1500], 0, 0, "2025-07-18"),
  account(2, "Priya Patel", "Class 9", "B", "Mahesh Patel", [22000, 6000, 1800, 900, 1200, 1500], [11000, 3000, 0, 900, 0, 0], 0, 0, "2025-07-02"),
  account(3, "Rahul Verma", "Class 11", "A", "Suresh Verma", [28000, 0, 2400, 900, 1200, 1800], [14000, 0, 0, 0, 0, 0], 2000, 500, "2025-06-20"),
  account(4, "Sneha Gupta", "Class 8", "B", "Anil Gupta", [20000, 6000, 1500, 900, 1200, 1200], [20000, 6000, 1500, 900, 1200, 1200], 0, 0, "2025-07-15"),
  account(5, "Karan Mehta", "Class 12", "A", "Vinod Mehta", [30000, 6000, 2400, 900, 1200, 1800], [10000, 0, 0, 0, 0, 0], 0, 750, "2025-05-28"),
  account(6, "Ananya Singh", "Class 7", "A", "Deepak Singh", [18000, 0, 1500, 900, 1200, 1200], [9000, 0, 750, 900, 0, 0], 1500, 0, "2025-07-05"),
  account(7, "Vikram Joshi", "Class 6", "B", "Ramesh Joshi", [16000, 6000, 1200, 900, 1200, 1000], [16000, 6000, 1200, 900, 1200, 1000], 0, 0, "2025-07-12"),
  account(8, "Meera Nair", "Class 11", "B", "Suresh Nair", [28000, 6000, 2400, 900, 1200, 1800], [7000, 1500, 0, 0, 0, 0], 0, 1000, "2025-04-18"),
  account(9, "Rohan Das", "Class 9", "A", "Prabir Das", [22000, 0, 1800, 900, 1200, 1500], [22000, 0, 1800, 900, 1200, 1500], 3000, 0, "2025-07-09"),
  account(10, "Kavya Reddy", "Class 12", "B", "Srinivas Reddy", [30000, 6000, 2400, 900, 1200, 1800], [15000, 3000, 1200, 900, 0, 0], 0, 0, "2025-06-30"),
  account(11, "Aditya Rao", "Class 10", "B", "Naveen Rao", [24000, 6000, 1800, 900, 1200, 1500], [6000, 0, 0, 0, 0, 0], 0, 1250, "2025-05-10"),
  account(12, "Ishita Bose", "Class 8", "A", "Amit Bose", [20000, 0, 1500, 900, 1200, 1200], [20000, 0, 1500, 900, 1200, 1200], 0, 0, "2025-07-16"),
];

export interface FeeAccountFilters {
  search?: string;
  className?: string;
  /** "all" | "due" | "cleared" */
  standing?: string;
}

export const CLASS_OPTIONS = ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12"];

export const feeAccountsApi = createResource<StudentFeeAccount, FeeAccountFilters>({
  idPrefix: "acc",
  seed,
  uniqueBy: { field: "admissionNo", label: "Admission number" },
  matches: (row, { search, className, standing }) => {
    if (className && row.className !== className) return false;
    if (standing === "due" && isCleared(row)) return false;
    if (standing === "cleared" && !isCleared(row)) return false;
    return textMatch(search, row.name, row.admissionNo, row.rollNo, row.guardian, row.className);
  },
});

export interface PaymentFilters {
  search?: string;
  method?: string;
  status?: string;
}

export const paymentsApi = createResource<Payment, PaymentFilters, "receiptNo">({
  idPrefix: "pay",
  seed: [],
  uniqueBy: { field: "receiptNo", label: "Receipt number" },
  // Receipt numbers are issued by a counter that only moves forward, so a
  // cancelled or deleted receipt never has its number reused.
  generate: (count) => ({ receiptNo: `RCP-${25000 + count + 1}` }),
  matches: (row, { search, method, status }) => {
    if (method && row.method !== method) return false;
    if (status && row.status !== status) return false;
    return textMatch(search, row.studentName, row.receiptNo, row.admissionNo, row.reference);
  },
});

/**
 * Records a payment and posts it to the student's ledger in one step.
 *
 * These must not be separate calls from the UI: a receipt that exists without
 * its ledger posting (or the reverse) is a reconciliation problem, and the
 * caller has no way to roll back the half that succeeded.
 */
export async function collectPayment(input: {
  account: StudentFeeAccount;
  allocations: PaymentAllocation[];
  method: PaymentMethod;
  reference: string;
  bank: string;
  remarks: string;
  collectedBy: string;
}): Promise<Payment> {
  const { account: acc, allocations, method, reference, bank, remarks, collectedBy } = input;

  const amount = allocations.reduce((sum, a) => sum + a.amount, 0);
  if (amount <= 0) throw new Error("Enter an amount greater than zero.");
  if (amount > balanceOf(acc)) {
    throw new Error("Amount exceeds the outstanding balance.");
  }

  const today = new Date().toISOString().slice(0, 10);

  const payment = await paymentsApi.create({
    studentId: acc.id,
    studentName: acc.name,
    admissionNo: acc.admissionNo,
    className: `${acc.className} · ${acc.section}`,
    date: today,
    amount,
    method,
    reference,
    bank,
    allocations,
    remarks,
    collectedBy,
    // Cheques and DDs are money in hand but not yet in the bank.
    status: CLEARS_LATER.includes(method) ? "pending-clearance" : "paid",
  });

  const byHead = new Map(allocations.map((a) => [a.head, a.amount]));
  await feeAccountsApi.update(acc.id, {
    heads: acc.heads.map((h) => ({ ...h, paid: h.paid + (byHead.get(h.head) ?? 0) })),
    lastPaymentDate: today,
  });

  return payment;
}

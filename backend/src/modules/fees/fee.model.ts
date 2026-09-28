import mongoose, { Schema, type InferSchemaType } from "mongoose";

/** The academic session every fee account and payment is scoped to for now. */
export const CURRENT_SESSION = "2025-26";

/**
 * Fee accounts and the payment register.
 *
 * Money is tracked per fee head (billed vs paid) rather than as one running
 * balance, because a guardian pays what they can afford against the heads they
 * choose. A payment therefore carries an explicit allocation across heads, and
 * the two writes — receipt and ledger posting — must land together.
 */

const feeHeadSchema = new Schema(
  {
    head: { type: String, required: true },
    billed: { type: Number, required: true, min: 0 },
    paid: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const feeAccountSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },

    /** Links back to the Student document. */
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },

    // Denormalised so the collection screen doesn't need a join per row.
    admissionNo: { type: String, required: true, index: true },
    name: { type: String, required: true },
    className: { type: String, required: true, index: true },
    section: { type: String, required: true },
    rollNo: { type: String, required: true },
    guardian: { type: String, required: true },
    guardianPhone: { type: String, required: true },

    session: { type: String, required: true, default: "2025-26" },
    heads: { type: [feeHeadSchema], default: [] },
    concession: { type: Number, default: 0, min: 0 },
    lateFee: { type: Number, default: 0, min: 0 },
    lastPaymentDate: { type: String, default: null },
    /** Optional fee deadline; drives the "overdue" status when set. */
    dueDate: { type: String, default: null },
  },
  { timestamps: true }
);

// One account per student per session.
feeAccountSchema.index({ schoolId: 1, studentId: 1, session: 1 }, { unique: true });

export type FeeAccountAttrs = InferSchemaType<typeof feeAccountSchema>;
export const FeeAccount = mongoose.model("FeeAccount", feeAccountSchema);
export type FeeAccountDoc = mongoose.HydratedDocument<FeeAccountAttrs>;

/* ------------------------------------------------------------------ */

export const PAYMENT_METHODS = ["Cash", "UPI", "Card", "Cheque", "Bank Transfer", "DD"] as const;

/** Instruments that clear later, so the receipt starts unconfirmed. */
export const CLEARS_LATER: string[] = ["Cheque", "DD"];

const allocationSchema = new Schema(
  {
    head: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const paymentSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },

    receiptNo: { type: String, required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true, index: true },
    studentName: { type: String, required: true },
    admissionNo: { type: String, required: true },
    className: { type: String, required: true },

    date: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: PAYMENT_METHODS, required: true },
    reference: { type: String, default: "" },
    bank: { type: String, default: "" },
    allocations: { type: [allocationSchema], default: [] },
    remarks: { type: String, default: "" },
    collectedBy: { type: String, required: true },
    status: {
      type: String,
      enum: ["paid", "pending-clearance", "cancelled", "bounced"],
      default: "paid",
      index: true,
    },

    // Audit trail for anything that reverses money. A cancelled or bounced
    // receipt keeps its row (never deleted) so the register stays complete.
    reversedAt: { type: String, default: null },
    reversedBy: { type: String, default: "" },
    reversalReason: { type: String, default: "" },
  },
  { timestamps: true }
);

// A receipt number is a legal reference — it must never repeat within a school.
paymentSchema.index({ schoolId: 1, receiptNo: 1 }, { unique: true });

export type PaymentAttrs = InferSchemaType<typeof paymentSchema>;
export const Payment = mongoose.model("Payment", paymentSchema);
export type PaymentDoc = mongoose.HydratedDocument<PaymentAttrs>;

/* ------------------------------------------------------------------ */
/* Derived totals — never stored, so they cannot drift out of sync      */
/*                                                                      */
/* Typed structurally (not against the Mongoose doc) so they work for   */
/* both a loaded account document and a plain synthesised row alike.    */
/* ------------------------------------------------------------------ */

interface HeadLike {
  billed: number;
  paid: number;
}
interface AccountLike {
  heads: HeadLike[];
  lateFee: number;
}

export const headBalance = (h: HeadLike) => Math.max(0, h.billed - h.paid);

export function totalBilled(a: AccountLike) {
  return a.heads.reduce((sum, h) => sum + h.billed, 0) + a.lateFee;
}

export function totalPaid(a: Pick<AccountLike, "heads">) {
  return a.heads.reduce((sum, h) => sum + h.paid, 0);
}

export function balanceOf(a: AccountLike) {
  return Math.max(0, totalBilled(a) - totalPaid(a));
}

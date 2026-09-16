import mongoose, { Schema, type InferSchemaType } from "mongoose";

const expenseSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    voucherNo: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, default: "" },
    amount: { type: Number, default: 0 },
    date: { type: String, default: "" },
    paidTo: { type: String, default: "" },
    method: { type: String, default: "" },
    status: { type: String, default: "pending" },
    recurring: { type: Boolean, default: false },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export type ExpenseAttrs = InferSchemaType<typeof expenseSchema>;
export const Expense = mongoose.model("Expense", expenseSchema);

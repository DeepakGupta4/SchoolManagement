import mongoose, { Schema, type InferSchemaType } from "mongoose";

const payrollSchema = new Schema(
  {
    schoolId: { type: String, required: true, default: "school_1", index: true },
    employeeId: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, default: "" },
    dept: { type: String, default: "" },
    basic: { type: Number, default: 0 },
    hra: { type: Number, default: 0 },
    ta: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    net: { type: Number, default: 0 },
    status: { type: String, default: "pending" },
    bank: { type: String, default: "" },
  },
  { timestamps: true }
);

export type PayrollEntryAttrs = InferSchemaType<typeof payrollSchema>;
export const PayrollEntry = mongoose.model("PayrollEntry", payrollSchema);

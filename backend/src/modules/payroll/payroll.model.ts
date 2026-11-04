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
    // net is DERIVED (basic + hra + ta − deductions), computed server-side on
    // create/update — never trusted from the client.
    net: { type: Number, default: 0 },
    // Pay PERIOD this payslip is for, "YYYY-MM" (empty on legacy rows). Lets a
    // school keep one payslip per employee PER MONTH instead of a single row.
    month: { type: String, default: "" },
    status: { type: String, default: "pending" },
    bank: { type: String, default: "" },
  },
  { timestamps: true }
);

// One payroll row per employee per PAY PERIOD. (Was {schoolId,employeeId} — a single
// row per employee ever, so earlier months were overwritten.) After deploy, run
// `npm run migrate -- --apply` so syncIndexes DROPS the old unique index; until then
// the lingering old index still blocks a second month for the same employee.
payrollSchema.index({ schoolId: 1, employeeId: 1, month: 1 }, { unique: true });

export type PayrollEntryAttrs = InferSchemaType<typeof payrollSchema>;
export const PayrollEntry = mongoose.model("PayrollEntry", payrollSchema);

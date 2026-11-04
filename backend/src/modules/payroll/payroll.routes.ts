import { z } from "zod";
import type { HydratedDocument } from "mongoose";
import { PayrollEntry, type PayrollEntryAttrs } from "./payroll.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";

const payrollSchema = z.object({
  employeeId: z.string().min(1),
  name: z.string().min(1),
  role: z.string().default(""),
  dept: z.string().default(""),
  basic: z.coerce.number<number>().min(0).default(0),
  hra: z.coerce.number<number>().min(0).default(0),
  ta: z.coerce.number<number>().min(0).default(0),
  deductions: z.coerce.number<number>().min(0).default(0),
  // Pay period "YYYY-MM"; empty keeps the single-row behaviour until the UI sets it.
  month: z.string().default(""),
  // net is server-derived (see recomputeNet) and is NOT accepted from the client.
  status: z.string().default("pending"),
  bank: z.string().default(""),
});

/**
 * net is DERIVED from its components — never trusted from the client, so a saved net
 * can't silently disagree with basic/hra/ta/deductions. Runs after create/update and
 * only re-saves when the value actually changes (idempotent).
 */
async function recomputeNet(doc: HydratedDocument<PayrollEntryAttrs>): Promise<void> {
  const net = Math.max(0, (doc.basic ?? 0) + (doc.hra ?? 0) + (doc.ta ?? 0) - (doc.deductions ?? 0));
  if (doc.net !== net) {
    doc.net = net;
    await doc.save();
  }
}

export default createCrudRouter<PayrollEntryAttrs>({
  model: PayrollEntry,
  createSchema: payrollSchema,
  searchFields: ["name", "employeeId", "dept", "role"],
  filterFields: ["role", "status", "month"],
  writeRoles: ["super_admin", "school_admin", "principal", "accountant"],
  // Salary breakdown + bank details — office/HR only, never students/parents/teachers.
  readRoles: ["super_admin", "school_admin", "principal", "accountant"],
  afterCreate: recomputeNet,
  afterUpdate: recomputeNet,
});

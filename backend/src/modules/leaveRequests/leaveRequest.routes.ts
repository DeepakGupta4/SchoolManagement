import { z } from "zod";
import { LeaveRequest } from "./leaveRequest.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";
import { ISO_DATE, isRealDate } from "../../utils/dates.js";

// A real YYYY-MM-DD date. (from <= to is enforced client-side — an object-level
// zod refine can't be used here because crudRouter calls createSchema.partial().)
const leaveDate = z
  .string()
  .min(1, "Date is required.")
  .regex(ISO_DATE, "Use a YYYY-MM-DD date.")
  .refine(isRealDate, "That date doesn't exist on the calendar.");

const leaveRequestSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  role: z.string().default(""),
  type: z.string().default(""),
  from: leaveDate,
  to: leaveDate,
  days: z.coerce.number<number>().min(1).default(1),
  reason: z.string().default(""),
  status: z.enum(["Pending", "Approved", "Rejected"]).default("Pending"),
  dept: z.string().default(""),
});

export default createCrudRouter({
  model: LeaveRequest,
  createSchema: leaveRequestSchema,
  searchFields: ["name", "code", "dept", "role"],
  filterFields: ["status", "type"],
  // Leave reasons are health-adjacent PII — restrict reads to office/HR roles.
  readRoles: ["super_admin", "school_admin", "principal"],
});

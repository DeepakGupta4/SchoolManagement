import { z } from "zod";
import { PayrollEntry } from "./payroll.model.js";
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
  net: z.coerce.number<number>().min(0).default(0),
  status: z.string().default("pending"),
  bank: z.string().default(""),
});

export default createCrudRouter({
  model: PayrollEntry,
  createSchema: payrollSchema,
  searchFields: ["name", "employeeId", "dept", "role"],
  filterFields: ["role", "status"],
});

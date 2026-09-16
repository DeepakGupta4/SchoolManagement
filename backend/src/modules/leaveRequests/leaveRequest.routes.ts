import { z } from "zod";
import { LeaveRequest } from "./leaveRequest.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";

const leaveRequestSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  role: z.string().default(""),
  type: z.string().default(""),
  from: z.string().default(""),
  to: z.string().default(""),
  days: z.coerce.number<number>().min(0).default(1),
  reason: z.string().default(""),
  status: z.string().default("Pending"),
  dept: z.string().default(""),
});

export default createCrudRouter({
  model: LeaveRequest,
  createSchema: leaveRequestSchema,
  searchFields: ["name", "code", "dept", "role"],
  filterFields: ["status", "type"],
});

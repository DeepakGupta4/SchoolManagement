import { z } from "zod";
import { Allocation } from "./allocation.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";

const allocationSchema = z.object({
  teacher: z.string().min(1),
  empId: z.string().default(""),
  dept: z.string().default(""),
  subject: z.string().default(""),
  classes: z.array(z.string()).default([]),
  periods: z.coerce.number<number>().min(0).default(0),
  labs: z.coerce.number<number>().min(0).default(0),
  room: z.string().default(""),
});

export default createCrudRouter({
  model: Allocation,
  createSchema: allocationSchema,
  searchFields: ["teacher", "empId", "subject", "dept", "room"],
  filterFields: ["dept"],
});

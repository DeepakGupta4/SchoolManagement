import { z } from "zod";
import { Scholarship } from "./scholarship.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";

const scholarshipSchema = z.object({
  code: z.string().min(1),
  student: z.string().min(1),
  class: z.string().default(""),
  type: z.string().default(""),
  percentage: z.coerce.number<number>().min(0).default(0),
  amount: z.coerce.number<number>().min(0).default(0),
  reason: z.string().default(""),
  status: z.string().default("pending"),
  since: z.string().default(""),
});

export default createCrudRouter({
  model: Scholarship,
  createSchema: scholarshipSchema,
  searchFields: ["student", "code", "type", "class", "reason"],
  filterFields: ["status"],
});

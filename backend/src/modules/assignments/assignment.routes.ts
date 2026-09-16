import { z } from "zod";
import { Assignment } from "./assignment.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";

const assignmentSchema = z.object({
  title: z.string().min(1),
  subject: z.string().default(""),
  class: z.string().default(""),
  teacher: z.string().default(""),
  given: z.string().default(""),
  due: z.string().default(""),
  totalMarks: z.coerce.number<number>().min(0).default(0),
  submitted: z.coerce.number<number>().min(0).default(0),
  total: z.coerce.number<number>().min(0).default(0),
  status: z.string().default("upcoming"),
  type: z.string().default(""),
});

export default createCrudRouter({
  model: Assignment,
  createSchema: assignmentSchema,
  searchFields: ["title", "subject", "class", "teacher", "code"],
  filterFields: ["status"],
  // Reference numbers continue the per-school sequence rather than restarting.
  generate: (seq) => ({ code: `A${String(seq + 1).padStart(3, "0")}` }),
});

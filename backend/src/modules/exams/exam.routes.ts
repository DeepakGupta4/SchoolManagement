import { z } from "zod";
import { Exam } from "./exam.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";

const examSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  type: z.string().default(""),
  classes: z.array(z.string()).default([]),
  subject: z.string().default(""),
  date: z.string().default(""),
  time: z.string().default(""),
  duration: z.string().default(""),
  totalMarks: z.coerce.number<number>().min(0).default(0),
  status: z.string().default("upcoming"),
  students: z.coerce.number<number>().min(0).default(0),
});

export default createCrudRouter({
  model: Exam,
  createSchema: examSchema,
  searchFields: ["name", "code", "subject", "type"],
  filterFields: ["status"],
});

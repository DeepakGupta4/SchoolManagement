import { z } from "zod";
import { Syllabus } from "./syllabus.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";

const syllabusSchema = z.object({
  className: z.string().min(1),
  subject: z.string().min(1),
  teacher: z.string().default(""),
  unit: z.string().min(1),
  chapter: z.string().min(1),
  topics: z.coerce.number<number>().min(0).default(0),
  completedTopics: z.coerce.number<number>().min(0).default(0),
  status: z.string().default("pending"),
  date: z.string().default("—"),
});

export default createCrudRouter({
  model: Syllabus,
  createSchema: syllabusSchema,
  searchFields: ["subject", "teacher", "unit", "chapter"],
  filterFields: ["className", "subject", "status"],
});

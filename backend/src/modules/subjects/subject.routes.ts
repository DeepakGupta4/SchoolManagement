import { z } from "zod";
import { Subject } from "./subject.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";

const subjectSchema = z.object({
  name: z.string().min(1),
  code: z.string().default(""),
  department: z.string().default(""),
});

export default createCrudRouter({
  model: Subject,
  createSchema: subjectSchema,
  searchFields: ["name", "code", "department"],
  filterFields: ["department"],
});

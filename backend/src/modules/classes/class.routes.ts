import { z } from "zod";
import { SchoolClass } from "./class.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";

const classSchema = z.object({
  name: z.string().min(1),
  sections: z.array(z.string()).default([]),
  stream: z.string().default("General"),
  classTeacher: z.string().default(""),
  room: z.string().default(""),
  students: z.coerce.number<number>().min(0).default(0),
  teachers: z.coerce.number<number>().min(0).default(0),
});

export default createCrudRouter({
  model: SchoolClass,
  createSchema: classSchema,
  searchFields: ["name", "classTeacher", "room", "stream"],
  filterFields: ["stream"],
});

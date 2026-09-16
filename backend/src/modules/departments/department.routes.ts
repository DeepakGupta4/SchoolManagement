import { z } from "zod";
import { Department } from "./department.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";

const departmentSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  hod: z.string().default(""),
  block: z.string().default(""),
  teachers: z.coerce.number<number>().min(0).default(0),
  subjects: z.array(z.string()).default([]),
  budget: z.coerce.number<number>().min(0).default(0),
  spent: z.coerce.number<number>().min(0).default(0),
  status: z.string().default("active"),
});

export default createCrudRouter({
  model: Department,
  createSchema: departmentSchema,
  searchFields: ["name", "code", "hod", "block"],
  filterFields: ["block", "status"],
});

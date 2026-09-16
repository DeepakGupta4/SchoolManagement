import { z } from "zod";
import { Alumnus } from "./alumnus.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";

const alumnusSchema = z.object({
  name: z.string().min(1),
  batch: z.string().default(""),
  stream: z.string().default(""),
  occupation: z.string().default(""),
  employer: z.string().default(""),
  city: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  mentor: z.boolean().default(false),
  interests: z.array(z.string()).default([]),
});

export default createCrudRouter({
  model: Alumnus,
  createSchema: alumnusSchema,
  searchFields: ["name", "occupation", "employer", "email"],
  filterFields: ["batch", "stream", "city"],
});

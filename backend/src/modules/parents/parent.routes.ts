import { z } from "zod";
import { Parent } from "./parent.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";

const parentSchema = z.object({
  name: z.string().min(1),
  relation: z.string().default("Guardian"),
  phone: z.string().default(""),
  email: z.string().default(""),
  occupation: z.string().default(""),
  address: z.string().default(""),
  // Linked student `_id`s — see parent.model.ts for why ids over admission nos.
  students: z.array(z.string()).default([]),
});

export default createCrudRouter({
  model: Parent,
  createSchema: parentSchema,
  searchFields: ["name", "phone", "email", "occupation"],
  filterFields: ["relation"],
});

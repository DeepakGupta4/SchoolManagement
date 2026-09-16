import { z } from "zod";
import { Lab } from "./lab.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";

const labSchema = z.object({
  name: z.string().min(1),
  type: z.string().default(""),
  block: z.string().default(""),
  capacity: z.coerce.number<number>().min(0).default(0),
  inCharge: z.string().default(""),
  assistant: z.string().default(""),
  equipmentTotal: z.coerce.number<number>().min(0).default(0),
  equipmentWorking: z.coerce.number<number>().min(0).default(0),
  weeklyPracticals: z.coerce.number<number>().min(0).default(0),
  nextPractical: z.string().default(""),
  nextPracticalClass: z.string().default(""),
  status: z.string().default("operational"),
});

export default createCrudRouter({
  model: Lab,
  createSchema: labSchema,
  searchFields: ["name", "inCharge", "block", "nextPracticalClass"],
  filterFields: ["type", "status"],
});

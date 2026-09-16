import { z } from "zod";
import { Medicine } from "./medicine.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";

const medicineSchema = z.object({
  name: z.string().min(1),
  category: z.string().default(""),
  stock: z.coerce.number<number>().min(0).default(0),
  unit: z.string().default(""),
  expiry: z.string().default("—"),
  status: z.string().default("In Stock"),
});

export default createCrudRouter({
  model: Medicine,
  createSchema: medicineSchema,
  searchFields: ["name", "category", "code"],
  filterFields: ["status"],
  // Stock references continue the per-school sequence rather than restarting.
  generate: (seq) => ({ code: `MD-${String(seq + 1).padStart(3, "0")}` }),
});

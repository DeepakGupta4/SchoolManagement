import { z } from "zod";
import { MenuItem } from "./menuItem.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";

const menuItemSchema = z.object({
  name: z.string().min(1),
  category: z.string().default(""),
  price: z.coerce.number<number>().min(0).default(0),
  available: z.boolean().default(true),
  sold: z.coerce.number<number>().min(0).default(0),
  emoji: z.string().default("🍽️"),
});

export default createCrudRouter({
  model: MenuItem,
  createSchema: menuItemSchema,
  searchFields: ["name", "category", "code"],
  filterFields: ["category"],
  // Menu codes continue the per-school sequence rather than restarting.
  generate: (seq) => ({ code: `MI-${String(seq + 1).padStart(3, "0")}` }),
});

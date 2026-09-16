import { z } from "zod";
import { InventoryItem } from "./inventoryItem.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";

const inventoryItemSchema = z.object({
  name: z.string().min(1),
  category: z.string().default(""),
  qty: z.coerce.number<number>().min(0).default(0),
  minQty: z.coerce.number<number>().min(0).default(0),
  unit: z.string().default(""),
  unitPrice: z.coerce.number<number>().min(0).default(0),
  supplier: z.string().default(""),
  lastUpdated: z.string().default(""),
  status: z.string().default("in-stock"),
});

export default createCrudRouter({
  model: InventoryItem,
  createSchema: inventoryItemSchema,
  searchFields: ["name", "code", "supplier"],
  filterFields: ["category"],
  // Item codes continue the per-school sequence rather than restarting.
  generate: (seq) => ({ code: `INV-${String(seq + 1).padStart(3, "0")}` }),
});

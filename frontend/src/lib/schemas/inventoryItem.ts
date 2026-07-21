import { z } from "zod";

export const inventoryItemSchema = z.object({
  name: z.string().min(2, "Item name is required"),
  category: z.string().min(1, "Category is required"),
  qty: z.coerce.number<number>().min(0, "Cannot be negative"),
  minQty: z.coerce.number<number>().min(0, "Cannot be negative"),
  unit: z.string().min(1, "Unit is required"),
  unitPrice: z.coerce.number<number>().min(0, "Cannot be negative"),
  supplier: z.string().min(2, "Supplier is required"),
  lastUpdated: z.string().min(1, "Last updated is required"),
  status: z.string().min(1, "Status is required"),
});

export type InventoryItemSchema = z.infer<typeof inventoryItemSchema>;

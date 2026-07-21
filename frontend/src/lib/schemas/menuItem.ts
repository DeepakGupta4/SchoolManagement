import { z } from "zod";

export const menuItemSchema = z.object({
  name: z.string().min(2, "Item name is required"),
  category: z.string().min(1, "Category is required"),
  emoji: z.string().min(1, "Pick an emoji for this item"),
  price: z.coerce.number<number>().min(0, "Cannot be negative"),
  sold: z.coerce.number<number>().min(0, "Cannot be negative"),
  /** Kept as a string so it binds directly to a native <select>. */
  available: z.string().min(1, "Availability is required"),
});

export type MenuItemSchema = z.infer<typeof menuItemSchema>;

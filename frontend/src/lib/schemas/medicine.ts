import { z } from "zod";

export const medicineSchema = z.object({
  name: z.string().min(2, "Medicine name is required"),
  category: z.string().min(1, "Category is required"),
  stock: z.coerce.number<number>().min(0, "Cannot be negative"),
  unit: z.string().min(1, "Unit is required"),
  expiry: z.string().min(1, "Expiry is required"),
  status: z.string().min(1, "Status is required"),
});

export type MedicineSchema = z.infer<typeof medicineSchema>;

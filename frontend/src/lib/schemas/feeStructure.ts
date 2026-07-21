import { z } from "zod";

const amount = z.coerce.number<number>().min(0, "Cannot be negative");

export const feeStructureSchema = z.object({
  code: z.string().min(2, "Structure code is required"),
  class: z.string().min(2, "Class is required"),
  tuition: amount,
  transport: amount,
  lab: amount,
  library: amount,
  sports: amount,
  misc: amount,
});

export type FeeStructureSchema = z.infer<typeof feeStructureSchema>;

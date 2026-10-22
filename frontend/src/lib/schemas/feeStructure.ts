import { z } from "zod";

export const feeHeadSchema = z.object({
  name: z.string().trim().min(1, "Head name is required"),
  amount: z.coerce.number<number>().min(0, "Cannot be negative"),
});

export const feeStructureSchema = z
  .object({
    code: z.string().trim().min(2, "Structure code is required"),
    class: z.string().trim().min(2, "Class is required"),
    heads: z.array(feeHeadSchema).min(1, "Add at least one fee head"),
  })
  .refine(
    (s) => {
      const names = s.heads.map((h) => h.name.trim().toLowerCase());
      return new Set(names).size === names.length;
    },
    { message: "Each fee head name must be unique.", path: ["heads"] }
  );

export type FeeHeadInput = z.infer<typeof feeHeadSchema>;
export type FeeStructureSchema = z.infer<typeof feeStructureSchema>;

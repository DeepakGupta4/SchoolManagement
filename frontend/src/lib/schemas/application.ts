import { z } from "zod";
import { isValidDateString } from "@/lib/dates";

// No `.default()` here: it makes the zod input/output types diverge, which breaks
// the react-hook-form resolver. The form supplies defaults via its emptyValues.
export const applicationSchema = z.object({
  jobCode: z.string().optional(),
  jobTitle: z.string().optional(),
  name: z.string().trim().min(2, "Candidate name is required"),
  email: z.union([z.literal(""), z.email("Enter a valid email")]).optional(),
  phone: z.string().optional(),
  experience: z.string().optional(),
  appliedOn: z
    .string()
    .refine((d) => !d || isValidDateString(d), "Enter a valid date")
    .optional(),
  stage: z.string().min(1),
  note: z.string().optional(),
});

export type ApplicationSchema = z.infer<typeof applicationSchema>;

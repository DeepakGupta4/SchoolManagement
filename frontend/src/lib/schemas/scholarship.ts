import { z } from "zod";

export const scholarshipSchema = z.object({
  code: z.string().trim().min(2, "Scholarship ID is required"),
  student: z.string().trim().min(2, "Student name is required"),
  class: z.string().trim().min(1, "Class is required"),
  type: z.string().trim().min(1, "Type is required"),
  percentage: z.coerce
    .number<number>()
    .min(1, "Must be at least 1%")
    .max(100, "Cannot exceed 100%"),
  amount: z.coerce.number<number>().min(0, "Cannot be negative"),
  reason: z.string().trim().min(3, "Reason is required"),
  status: z.string().min(1, "Status is required"),
  since: z.string().trim().min(3, "Start month is required"),
});

export type ScholarshipSchema = z.infer<typeof scholarshipSchema>;

import { z } from "zod";

export const subjectSchema = z.object({
  name: z.string().trim().min(1, "Subject name is required"),
  code: z.string().trim(),
  department: z.string().trim(),
  type: z.string().trim().min(1, "Type is required"),
});

export type SubjectSchema = z.infer<typeof subjectSchema>;

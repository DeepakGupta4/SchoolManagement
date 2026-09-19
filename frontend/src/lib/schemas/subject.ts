import { z } from "zod";

export const subjectSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  code: z.string(),
  department: z.string(),
});

export type SubjectSchema = z.infer<typeof subjectSchema>;

import { z } from "zod";

export const examSchema = z.object({
  code: z.string().min(2, "Exam code is required"),
  name: z.string().min(2, "Exam name is required"),
  type: z.string().min(1, "Type is required"),
  classes: z.array(z.string()).min(1, "Select at least one class"),
  subject: z.string().min(1, "Subject is required"),
  date: z.string().min(3, "Date is required"),
  time: z.string().min(3, "Time is required"),
  duration: z.string().min(1, "Duration is required"),
  totalMarks: z.coerce.number<number>().min(1, "Must be at least 1"),
  status: z.string().min(1, "Status is required"),
  students: z.coerce.number<number>().min(0, "Cannot be negative"),
});

export type ExamSchema = z.infer<typeof examSchema>;

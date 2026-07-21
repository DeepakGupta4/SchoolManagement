import { z } from "zod";

export const scheduledExamSchema = z.object({
  code: z.string().min(2, "Schedule code is required"),
  exam: z.string().min(2, "Exam is required"),
  subject: z.string().min(1, "Subject is required"),
  class: z.string().min(1, "Class is required"),
  date: z.string().min(3, "Date is required"),
  time: z.string().min(3, "Time is required"),
  duration: z.string().min(1, "Duration is required"),
  room: z.string().min(1, "Room is required"),
  invigilator: z.string().min(2, "Invigilator is required"),
  totalMarks: z.coerce.number<number>().min(1, "Must be at least 1"),
  status: z.string().min(1, "Status is required"),
});

export type ScheduledExamSchema = z.infer<typeof scheduledExamSchema>;

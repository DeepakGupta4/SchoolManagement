import { z } from "zod";

export const assignmentSchema = z
  .object({
    title: z.string().min(3, "Assignment title is required"),
    subject: z.string().min(1, "Subject is required"),
    class: z.string().min(1, "Class is required"),
    teacher: z.string().min(2, "Teacher is required"),
    given: z.string().min(1, "Given date is required"),
    due: z.string().min(1, "Due date is required"),
    totalMarks: z.coerce.number<number>().min(1, "Marks must be at least 1"),
    submitted: z.coerce.number<number>().min(0, "Cannot be negative"),
    total: z.coerce.number<number>().min(1, "Must be at least 1 student"),
    status: z.string().min(1, "Status is required"),
    type: z.string().min(1, "Type is required"),
  })
  .refine((v) => v.submitted <= v.total, {
    message: "Cannot exceed the number of students",
    path: ["submitted"],
  });

export type AssignmentSchema = z.infer<typeof assignmentSchema>;

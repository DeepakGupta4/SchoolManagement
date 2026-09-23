import { z } from "zod";

export const jobPostingSchema = z.object({
  code: z.string().trim().min(2, "Job code is required"),
  title: z.string().trim().min(2, "Job title is required"),
  dept: z.string().trim().min(1, "Department is required"),
  type: z.string().min(1, "Employment type is required"),
  posted: z.string().trim().min(3, "Posted date is required"),
  deadline: z.string().trim().min(3, "Deadline is required"),
  applicants: z.coerce.number<number>().min(0, "Cannot be negative"),
  status: z.string().min(1, "Status is required"),
});

export type JobPostingSchema = z.infer<typeof jobPostingSchema>;

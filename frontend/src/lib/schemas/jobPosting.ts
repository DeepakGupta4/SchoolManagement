import { z } from "zod";
import { isValidDateString } from "@/lib/dates";

export const jobPostingSchema = z
  .object({
    code: z.string().trim().min(2, "Job code is required"),
    title: z.string().trim().min(2, "Job title is required"),
    dept: z.string().trim().min(1, "Department is required"),
    type: z.string().min(1, "Employment type is required"),
    posted: z.string().min(1, "Posted date is required").refine(isValidDateString, "Enter a valid date"),
    deadline: z.string().min(1, "Deadline is required").refine(isValidDateString, "Enter a valid date"),
    applicants: z.coerce.number<number>().min(0, "Cannot be negative"),
    // Values come from a fixed Select; the backend enforces the enum on write.
    status: z.string().min(1, "Status is required"),
  })
  .refine((o) => o.deadline >= o.posted, {
    message: "Deadline must be on or after the posted date.",
    path: ["deadline"],
  });

export type JobPostingSchema = z.infer<typeof jobPostingSchema>;

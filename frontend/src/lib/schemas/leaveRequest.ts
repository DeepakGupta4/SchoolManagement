import { z } from "zod";
import { isValidDateString } from "@/lib/dates";

export const leaveRequestSchema = z
  .object({
    code: z.string().min(2, "Request ID is required"),
    name: z.string().min(2, "Staff member is required"),
    role: z.string().min(2, "Role is required"),
    dept: z.string().min(1, "Department is required"),
    type: z.string().min(1, "Leave type is required"),
    from: z.string().min(1, "Start date is required").refine(isValidDateString, "Enter a valid date"),
    to: z.string().min(1, "End date is required").refine(isValidDateString, "Enter a valid date"),
    days: z.coerce.number<number>().min(1, "Must be at least 1 day"),
    reason: z.string().min(3, "Reason is required"),
    // Values come from a fixed Select; the backend enforces the enum on write.
    status: z.string().min(1, "Status is required"),
  })
  .refine((o) => o.to >= o.from, {
    message: "End date must be on or after the start date.",
    path: ["to"],
  });

export type LeaveRequestSchema = z.infer<typeof leaveRequestSchema>;

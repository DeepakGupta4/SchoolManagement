import { z } from "zod";

export const leaveRequestSchema = z.object({
  code: z.string().min(2, "Request ID is required"),
  name: z.string().min(2, "Staff member is required"),
  role: z.string().min(2, "Role is required"),
  dept: z.string().min(1, "Department is required"),
  type: z.string().min(1, "Leave type is required"),
  from: z.string().min(3, "Start date is required"),
  to: z.string().min(3, "End date is required"),
  days: z.coerce.number<number>().min(1, "Must be at least 1 day"),
  reason: z.string().min(3, "Reason is required"),
  status: z.string().min(1, "Status is required"),
});

export type LeaveRequestSchema = z.infer<typeof leaveRequestSchema>;

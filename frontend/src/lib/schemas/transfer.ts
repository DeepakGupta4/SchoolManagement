import { z } from "zod";

export const transferSchema = z.object({
  name: z.string().min(2, "Student name is required"),
  studentId: z.string().min(3, "Student ID is required"),
  className: z.string().min(1, "Class is required"),
  type: z.string().min(1, "Request type is required"),
  reason: z.string().min(4, "Reason is required"),
  requestedOn: z.string().min(4, "Requested-on date is required"),
  issuedOn: z.string().min(1, "Use — when no certificate has been issued"),
  tcNo: z.string().min(1, "Use — when no certificate has been issued"),
  status: z.string().min(1, "Status is required"),
  dues: z.coerce.number<number>().min(0, "Cannot be negative"),
});

export type TransferSchema = z.infer<typeof transferSchema>;

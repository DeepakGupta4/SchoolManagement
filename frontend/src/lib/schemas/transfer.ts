import { z } from "zod";
import { isValidDateString, isWithin, MIN_RECORD_DATE, TODAY_ISO } from "@/lib/dates";

export const transferSchema = z.object({
  name: z.string().min(2, "Student name is required"),
  studentId: z.string().min(3, "Student ID is required"),
  className: z.string().min(1, "Class is required"),
  type: z.string().min(1, "Request type is required"),
  reason: z.string().min(4, "Reason is required"),
  requestedOn: z
    .string()
    .min(1, "Requested-on date is required")
    .refine(isValidDateString, "Enter a valid date")
    .refine((d) => isWithin(d, MIN_RECORD_DATE, TODAY_ISO), "Requested-on date can't be in the future"),
  // tcNo / issuedOn stay "—" until issue; the server auto-assigns them on issue.
  issuedOn: z.string().min(1, "Use — when no certificate has been issued"),
  tcNo: z.string().min(1, "Use — when no certificate has been issued"),
  status: z.string().min(1, "Status is required"),
  dues: z.coerce.number<number>().min(0, "Cannot be negative"),
});

export type TransferSchema = z.infer<typeof transferSchema>;

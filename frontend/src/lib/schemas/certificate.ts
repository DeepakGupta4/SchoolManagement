import { z } from "zod";
import { MIN_RECORD_DATE, TODAY_ISO, isValidDateString, isWithin } from "@/lib/dates";

export const certificateSchema = z.object({
  student: z.string().min(2, "Student name is required"),
  admissionNo: z.string().min(3, "Admission number is required"),
  className: z.string().min(1, "Class is required"),
  section: z.string().optional(),
  rollNo: z.string().optional(),
  studentId: z.string().optional(),
  fatherName: z.string().optional(),
  dob: z
    .string()
    .optional()
    .refine((s) => !s || isValidDateString(s), "Enter a valid date of birth"),
  session: z.string().min(1, "Academic session is required"),
  type: z.enum(["Transfer", "Bonafide", "Character", "Migration"]),
  requestedBy: z.string().min(2, "Say who raised the request"),
  requestedOn: z
    .string()
    .min(1, "Request date is required")
    .refine(isValidDateString, "Enter a valid date")
    .refine((s) => isWithin(s, MIN_RECORD_DATE, TODAY_ISO), "Request date can't be in the future"),
  status: z.enum(["pending", "in-review", "issued", "rejected"]),
});

export type CertificateSchema = z.infer<typeof certificateSchema>;

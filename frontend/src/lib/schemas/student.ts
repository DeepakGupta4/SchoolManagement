import { z } from "zod";
import { PHONE_REGEX, PHONE_MESSAGE } from "@/lib/phone";
import { isValidDateString, isWithin, MIN_STUDENT_DOB, MAX_STUDENT_DOB, MIN_RECORD_DATE, TODAY_ISO } from "@/lib/dates";

export const studentSchema = z.object({
  admissionNo: z.string().min(1, "Admission number is required"),
  rollNo: z.string().min(1, "Roll number is required"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.email("Enter a valid email address"),
  phone: z.string().regex(PHONE_REGEX, PHONE_MESSAGE),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine(isValidDateString, "Enter a valid date")
    .refine((d) => isWithin(d, MIN_STUDENT_DOB, MAX_STUDENT_DOB), "Student's age looks out of range (2–25 years)"),
  gender: z.enum(["male", "female", "other"]),
  bloodGroup: z.enum(["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]).optional(),
  className: z.string().min(1, "Class is required"),
  section: z.string().min(1, "Section is required"),
  status: z.enum(["active", "inactive", "alumni", "transferred"]),
  admissionDate: z
    .string()
    .min(1, "Admission date is required")
    .refine(isValidDateString, "Enter a valid date")
    .refine((d) => isWithin(d, MIN_RECORD_DATE, TODAY_ISO), "Admission date can't be in the future"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  guardian: z.object({
    name: z.string().min(2, "Guardian name is required"),
    relation: z.string().min(1, "Relation is required"),
    phone: z.string().regex(PHONE_REGEX, PHONE_MESSAGE),
    email: z.union([z.email("Enter a valid email address"), z.literal("")]).optional(),
    occupation: z.string().optional(),
  }),
  medicalNotes: z.string().optional(),
  /** Uploaded photo as a data URL, or empty when none. */
  avatar: z.string().optional(),
});

export type StudentSchema = z.infer<typeof studentSchema>;

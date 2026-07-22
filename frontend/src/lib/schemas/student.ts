import { z } from "zod";

const PHONE = /^[6-9]\d{9}$/;

export const studentSchema = z.object({
  admissionNo: z.string().min(1, "Admission number is required"),
  rollNo: z.string().min(1, "Roll number is required"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.email("Enter a valid email address"),
  phone: z.string().regex(PHONE, "Enter a valid 10-digit Indian mobile number"),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine((d) => new Date(d) < new Date(), "Date of birth must be in the past"),
  gender: z.enum(["male", "female", "other"]),
  bloodGroup: z.enum(["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]).optional(),
  className: z.string().min(1, "Class is required"),
  section: z.string().min(1, "Section is required"),
  status: z.enum(["active", "inactive", "alumni", "transferred"]),
  admissionDate: z.string().min(1, "Admission date is required"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  guardian: z.object({
    name: z.string().min(2, "Guardian name is required"),
    relation: z.string().min(1, "Relation is required"),
    phone: z.string().regex(PHONE, "Enter a valid 10-digit Indian mobile number"),
    email: z.union([z.email("Enter a valid email address"), z.literal("")]).optional(),
    occupation: z.string().optional(),
  }),
  medicalNotes: z.string().optional(),
  /** Uploaded photo as a data URL, or empty when none. */
  avatar: z.string().optional(),
});

export type StudentSchema = z.infer<typeof studentSchema>;

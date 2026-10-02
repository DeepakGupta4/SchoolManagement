import { z } from "zod";
import { PHONE_REGEX, PHONE_MESSAGE } from "@/lib/phone";
import { isValidDateString, isWithin, MIN_STUDENT_DOB, MAX_STUDENT_DOB, MIN_RECORD_DATE, TODAY_ISO } from "@/lib/dates";

/** Optional phone: empty is fine, but a value must be a 10-digit number. */
const optionalPhone = z
  .string()
  .optional()
  .refine((v) => !v || PHONE_REGEX.test(v), PHONE_MESSAGE);

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
  // The saved guardian is DERIVED from the chosen primary contact (father /
  // mother / other) in the form, so these stay lenient here — the form enforces
  // a valid name + 10-digit phone for whichever contact is primary.
  guardian: z.object({
    name: z.string().optional(),
    relation: z.string().optional(),
    phone: optionalPhone,
    email: z.union([z.email("Enter a valid email address"), z.literal("")]).optional(),
    occupation: z.string().optional(),
  }),
  medicalNotes: z.string().optional(),
  /** Uploaded photo as a data URL, or empty when none. */
  avatar: z.string().optional(),

  // --- Optional admission-form details (all backward-compatible) ---
  // Phone-like fields are plain strings (no 10-digit regex) so they stay
  // low-friction and accept empty values.
  fatherName: z.string().optional(),
  fatherOccupation: z.string().optional(),
  fatherPhone: optionalPhone,
  fatherEmail: z.union([z.email("Enter a valid email address"), z.literal("")]).optional(),
  motherName: z.string().optional(),
  motherOccupation: z.string().optional(),
  motherPhone: optionalPhone,
  motherEmail: z.union([z.email("Enter a valid email address"), z.literal("")]).optional(),
  nationality: z.string().optional(),
  religion: z.string().optional(),
  category: z.string().optional(),
  motherTongue: z.string().optional(),
  aadhaarNo: z.string().optional(),
  placeOfBirth: z.string().optional(),
  annualIncome: z.string().optional(),
  correspondenceAddress: z.string().optional(),
  emergencyContact: z.string().optional(),
  previousSchool: z.string().optional(),
  previousClass: z.string().optional(),
  previousBoard: z.string().optional(),
  tcNumber: z.string().optional(),
  previousResult: z.string().optional(),
  transportRequired: z.boolean().optional(),
  pickupPoint: z.string().optional(),
});

export type StudentSchema = z.infer<typeof studentSchema>;

import { z } from "zod";
import { PHONE_REGEX, PHONE_MESSAGE } from "@/lib/phone";
import { isValidDateString, isWithin, MIN_STUDENT_DOB, MAX_STUDENT_DOB, MIN_RECORD_DATE, TODAY_ISO } from "@/lib/dates";

/** Optional phone: empty is fine, but a value must be a 10-digit number. */
const optionalPhone = z
  .string()
  .optional()
  .refine((v) => !v || PHONE_REGEX.test(v), PHONE_MESSAGE);

const optionalEmail = z.union([z.email("Enter a valid email"), z.literal("")]).optional();

// NB: no `.default()` anywhere — it makes Zod's input type optional while the
// output stays required, which breaks react-hook-form's resolver typing. Optional
// fields use `.optional()` (input === output); makeEmpty() supplies the blanks.
export const admissionSchema = z.object({
  // ── Applicant ──────────────────────────────────────────────
  applicationNo: z.string().min(3, "Application number is required"),
  // `name` is DERIVED from first + last on submit (kept for the table/export).
  name: z.string().optional(),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(1, "Last name is required"),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine(isValidDateString, "Enter a valid date")
    .refine((d) => isWithin(d, MIN_STUDENT_DOB, MAX_STUDENT_DOB), "Applicant's age looks out of range (2–25 years)"),
  gender: z.string().min(1, "Select a gender"),
  classApplied: z.string().min(1, "Class applied is required"),
  bloodGroup: z.string().optional(),
  category: z.string().optional(),
  previousSchool: z.string().max(120, "Keep under 120 characters").optional(),

  // ── Parent / guardian & contact ────────────────────────────
  // The primary contact is DERIVED from father/mother/other in the form, which
  // enforces a valid name + 10-digit phone — so these stay lenient here.
  parent: z.string().optional(),
  relation: z.string().optional(),
  phone: z.string().optional(),
  email: optionalEmail,
  address: z.string().min(5, "Address is required"),

  // ── Admission process ──────────────────────────────────────
  source: z.string().min(1, "Source is required"),
  appliedOn: z
    .string()
    .min(1, "Applied-on date is required")
    .refine(isValidDateString, "Enter a valid date")
    .refine((d) => isWithin(d, MIN_RECORD_DATE, TODAY_ISO), "Applied-on date can't be in the future"),
  stage: z.string().min(1, "Stage is required"),
  score: z.coerce.number<number>().min(0, "Cannot be negative").max(100, "Cannot exceed 100"),
  notes: z.string().max(300, "Keep notes under 300 characters").optional(),

  // ── Detailed fields (mirror the student admission form) ─────
  avatar: z.string().optional(),
  medicalNotes: z.string().optional(),
  fatherName: z.string().optional(),
  fatherOccupation: z.string().optional(),
  fatherPhone: optionalPhone,
  fatherEmail: optionalEmail,
  motherName: z.string().optional(),
  motherOccupation: z.string().optional(),
  motherPhone: optionalPhone,
  motherEmail: optionalEmail,
  nationality: z.string().optional(),
  religion: z.string().optional(),
  motherTongue: z.string().optional(),
  aadhaarNo: z.string().optional().refine((v) => !v || /^\d{12}$/.test(v), "Aadhaar must be a 12-digit number"),
  placeOfBirth: z.string().optional(),
  annualIncome: z.string().optional(),
  correspondenceAddress: z.string().optional(),
  emergencyContact: z.string().optional(),
  previousClass: z.string().optional(),
  previousBoard: z.string().optional(),
  tcNumber: z.string().optional(),
  previousResult: z.string().optional(),
  transportRequired: z.boolean().optional(),
  pickupPoint: z.string().optional(),
});

export type AdmissionSchema = z.infer<typeof admissionSchema>;

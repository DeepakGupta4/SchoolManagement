import { z } from "zod";
import { PHONE_REGEX, PHONE_MESSAGE } from "@/lib/phone";

export const admissionSchema = z.object({
  // ── Applicant ──────────────────────────────────────────────
  applicationNo: z.string().min(3, "Application number is required"),
  name: z.string().min(2, "Applicant name is required"),
  dateOfBirth: z.string().min(4, "Date of birth is required"),
  gender: z.string().min(1, "Select a gender"),
  classApplied: z.string().min(1, "Class applied is required"),
  bloodGroup: z.string(),
  category: z.string(),
  previousSchool: z.string().max(120, "Keep under 120 characters"),

  // ── Parent / guardian & contact ────────────────────────────
  parent: z.string().min(2, "Parent / guardian name is required"),
  relation: z.string().min(1, "Select a relation"),
  phone: z.string().regex(PHONE_REGEX, PHONE_MESSAGE),
  email: z.union([z.email("Enter a valid email"), z.literal("")]),
  address: z.string().min(5, "Address is required"),

  // ── Admission process ──────────────────────────────────────
  source: z.string().min(1, "Source is required"),
  appliedOn: z.string().min(4, "Applied-on date is required"),
  stage: z.string().min(1, "Stage is required"),
  score: z.coerce.number<number>().min(0, "Cannot be negative").max(100, "Cannot exceed 100"),
  notes: z.string().max(300, "Keep notes under 300 characters"),
});

export type AdmissionSchema = z.infer<typeof admissionSchema>;

import { z } from "zod";

export const admissionSchema = z.object({
  applicationNo: z.string().min(3, "Application number is required"),
  name: z.string().min(2, "Applicant name is required"),
  classApplied: z.string().min(1, "Class applied is required"),
  parent: z.string().min(2, "Parent / guardian name is required"),
  phone: z.string().min(8, "Phone number is required"),
  source: z.string().min(1, "Source is required"),
  appliedOn: z.string().min(4, "Applied-on date is required"),
  stage: z.string().min(1, "Stage is required"),
  score: z.coerce.number<number>().min(0, "Cannot be negative").max(100, "Cannot exceed 100"),
  notes: z.string().max(300, "Keep notes under 300 characters"),
});

export type AdmissionSchema = z.infer<typeof admissionSchema>;

import { z } from "zod";

export const certificateSchema = z.object({
  student: z.string().min(2, "Student name is required"),
  admissionNo: z.string().min(3, "Admission number is required"),
  className: z.string().min(1, "Class & section is required"),
  type: z.enum(["Transfer", "Bonafide", "Character", "Migration"]),
  requestedBy: z.string().min(2, "Say who raised the request"),
  requestedOn: z.string().min(1, "Request date is required"),
  status: z.enum(["pending", "in-review", "issued", "rejected"]),
});

export type CertificateSchema = z.infer<typeof certificateSchema>;

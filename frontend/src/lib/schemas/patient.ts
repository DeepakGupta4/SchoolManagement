import { z } from "zod";

export const patientSchema = z.object({
  name: z.string().min(2, "Patient name is required"),
  class: z.string().min(1, "Class is required"),
  issue: z.string().min(2, "Issue is required"),
  doctor: z.string().min(1, "Doctor is required"),
  date: z.string().min(1, "Visit date is required"),
  type: z.string().min(1, "Type is required"),
  status: z.string().min(1, "Status is required"),
});

export type PatientSchema = z.infer<typeof patientSchema>;

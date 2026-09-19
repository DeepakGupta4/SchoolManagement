import { z } from "zod";
import { PHONE_REGEX, PHONE_MESSAGE } from "@/lib/phone";

export const staffSchema = z.object({
  employeeId: z.string().min(2, "Employee ID is required"),
  name: z.string().min(2, "Name is required"),
  role: z.string().min(2, "Role is required"),
  dept: z.string().min(1, "Department is required"),
  type: z.string().min(1, "Employment type is required"),
  status: z.string().min(1, "Status is required"),
  gender: z.string().min(1, "Select a gender"),
  dateOfBirth: z.string(),
  qualification: z.string().min(2, "Qualification is required"),
  experienceYears: z.coerce.number<number>().min(0, "Cannot be negative").max(60, "Looks too high"),
  phone: z.string().regex(PHONE_REGEX, PHONE_MESSAGE),
  email: z.email("Enter a valid email address"),
  address: z.string(),
  join: z.string().min(3, "Join date is required"),
  salary: z.coerce.number<number>().min(0, "Cannot be negative"),
});

export type StaffSchema = z.infer<typeof staffSchema>;

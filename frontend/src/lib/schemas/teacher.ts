import { z } from "zod";

const PHONE = /^[6-9]\d{9}$/;

export const teacherSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.email("Enter a valid email address"),
  phone: z.string().regex(PHONE, "Enter a valid 10-digit Indian mobile number"),
  gender: z.enum(["male", "female", "other"]),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine((d) => new Date(d) < new Date(), "Date of birth must be in the past"),
  joiningDate: z.string().min(1, "Joining date is required"),
  department: z.string().min(1, "Department is required"),
  subjects: z.array(z.string()).min(1, "Select at least one subject"),
  classes: z.array(z.string()),
  qualification: z.string().min(2, "Qualification is required"),
  experienceYears: z.coerce
    .number<number>()
    .min(0, "Experience cannot be negative")
    .max(60, "Experience looks too high"),
  employmentType: z.enum(["full-time", "part-time", "contract", "visiting"]),
  status: z.enum(["active", "on-leave", "inactive", "resigned"]),
  address: z.string().min(5, "Address must be at least 5 characters"),
  salary: z.coerce.number<number>().min(0, "Salary cannot be negative"),
  isClassTeacher: z.boolean(),
});

export type TeacherSchema = z.infer<typeof teacherSchema>;

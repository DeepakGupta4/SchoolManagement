import { z } from "zod";
import { PHONE_REGEX, PHONE_MESSAGE } from "@/lib/phone";
import { isValidDateString, isWithin, MIN_ADULT_DOB, MAX_ADULT_DOB, MIN_RECORD_DATE, TODAY_ISO } from "@/lib/dates";

export const teacherSchema = z.object({
  employeeId: z.string().trim().min(1, "Employee ID is required"),
  firstName: z.string().trim().min(2, "First name must be at least 2 characters"),
  lastName: z.string().trim().min(1, "Last name is required"),
  email: z.email("Enter a valid email address"),
  phone: z.string().regex(PHONE_REGEX, PHONE_MESSAGE),
  gender: z.enum(["male", "female", "other"]),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine(isValidDateString, "Enter a valid date")
    .refine((d) => isWithin(d, MIN_ADULT_DOB, MAX_ADULT_DOB), "Teacher must be between 18 and 100 years old"),
  joiningDate: z
    .string()
    .min(1, "Joining date is required")
    .refine(isValidDateString, "Enter a valid date")
    .refine((d) => isWithin(d, MIN_RECORD_DATE, TODAY_ISO), "Joining date can't be in the future"),
  department: z.string().trim().min(1, "Department is required"),
  subjects: z.array(z.string()).min(1, "Select at least one subject"),
  classes: z.array(z.string()),
  qualification: z.string().trim().min(2, "Qualification is required"),
  experienceYears: z.coerce
    .number<number>()
    .min(0, "Experience cannot be negative")
    .max(60, "Experience looks too high"),
  employmentType: z.enum(["full-time", "part-time", "contract", "visiting"]),
  status: z.enum(["active", "on-leave", "inactive", "resigned"]),
  address: z.string().trim().min(5, "Address must be at least 5 characters"),
  avatar: z.string().optional(),
  salary: z.coerce.number<number>().min(0, "Salary cannot be negative"),
  isClassTeacher: z.boolean(),
  /** When isClassTeacher, the class + section they are class teacher of. */
  classTeacherOf: z.string().optional(),
  classTeacherSection: z.string().optional(),
}).refine(
  (d) => !d.isClassTeacher || (!!d.classTeacherOf && !!d.classTeacherSection),
  { message: "Choose the class and section", path: ["classTeacherOf"] }
);

export type TeacherSchema = z.infer<typeof teacherSchema>;

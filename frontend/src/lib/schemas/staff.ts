import { z } from "zod";

export const staffSchema = z.object({
  employeeId: z.string().min(2, "Employee ID is required"),
  name: z.string().min(2, "Name is required"),
  role: z.string().min(2, "Role is required"),
  dept: z.string().min(1, "Department is required"),
  type: z.string().min(1, "Employment type is required"),
  status: z.string().min(1, "Status is required"),
  phone: z.string().min(6, "Phone number is required"),
  email: z.email("Enter a valid email address"),
  join: z.string().min(3, "Join date is required"),
  salary: z.coerce.number<number>().min(0, "Cannot be negative"),
});

export type StaffSchema = z.infer<typeof staffSchema>;

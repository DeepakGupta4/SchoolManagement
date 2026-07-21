import { z } from "zod";

export const departmentSchema = z.object({
  name: z.string().min(2, "Department name is required"),
  code: z.string().min(2, "Department code is required"),
  hod: z.string().min(2, "Head of department is required"),
  block: z.string().min(1, "Block is required"),
  teachers: z.coerce.number<number>().min(0, "Cannot be negative"),
  subjects: z.array(z.string()).min(1, "Select at least one subject"),
  budget: z.coerce.number<number>().min(0, "Cannot be negative"),
  spent: z.coerce.number<number>().min(0, "Cannot be negative"),
  status: z.string().min(1, "Status is required"),
});

export type DepartmentSchema = z.infer<typeof departmentSchema>;

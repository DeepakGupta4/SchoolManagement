import { z } from "zod";

export const allocationSchema = z.object({
  teacher: z.string().min(2, "Teacher name is required"),
  empId: z.string().min(3, "Employee ID is required"),
  dept: z.string().min(1, "Department is required"),
  subject: z.string().min(2, "Subject is required"),
  classes: z.array(z.string()).min(1, "Select at least one class"),
  periods: z.coerce.number<number>().min(0, "Cannot be negative"),
  labs: z.coerce.number<number>().min(0, "Cannot be negative"),
  room: z.string().min(1, "Room is required"),
});

export type AllocationSchema = z.infer<typeof allocationSchema>;

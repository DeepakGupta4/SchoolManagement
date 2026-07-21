import { z } from "zod";

export const hostelStudentSchema = z.object({
  studentId: z.string().min(2, "Student ID is required"),
  name: z.string().min(2, "Student name is required"),
  class: z.string().min(1, "Class is required"),
  hostel: z.string().min(1, "Hostel is required"),
  room: z.string().min(1, "Room no. is required"),
  type: z.string().min(1, "Type is required"),
  fees: z.string().min(1, "Fee status is required"),
  joinDate: z.string().min(3, "Join date is required"),
  contact: z.string().min(5, "Contact is required"),
});

export type HostelStudentSchema = z.infer<typeof hostelStudentSchema>;

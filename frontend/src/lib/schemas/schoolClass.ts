import { z } from "zod";

export const schoolClassSchema = z.object({
  name: z.string().min(2, "Class name is required"),
  sections: z.array(z.string()).min(1, "Select at least one section"),
  stream: z.string().min(1, "Stream is required"),
  classTeacher: z.string().min(2, "Class teacher is required"),
  room: z.string().min(1, "Room is required"),
  students: z.coerce.number<number>().min(0, "Cannot be negative"),
  teachers: z.coerce.number<number>().min(0, "Cannot be negative"),
});

export type SchoolClassSchema = z.infer<typeof schoolClassSchema>;

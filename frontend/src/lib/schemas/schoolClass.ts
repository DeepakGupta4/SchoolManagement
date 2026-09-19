import { z } from "zod";

export const schoolClassSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  sections: z.array(z.string()).min(1, "Select at least one section"),
  stream: z.string().min(1, "Stream is required"),
  // Optional — a class may not have a teacher or room assigned yet.
  classTeacher: z.string(),
  room: z.string(),
  // Counts are derived from real students/teachers, not typed.
  students: z.coerce.number<number>().min(0),
  teachers: z.coerce.number<number>().min(0),
});

export type SchoolClassSchema = z.infer<typeof schoolClassSchema>;

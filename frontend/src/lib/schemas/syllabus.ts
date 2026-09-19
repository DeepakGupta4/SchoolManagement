import { z } from "zod";

export const syllabusSchema = z.object({
  className: z.string().min(1, "Class is required"),
  subject: z.string().min(1, "Subject is required"),
  teacher: z.string(),
  unit: z.string().min(1, "Unit is required"),
  chapter: z.string().min(1, "Chapter name is required"),
  topics: z.coerce.number<number>().min(0, "Cannot be negative"),
  completedTopics: z.coerce.number<number>().min(0, "Cannot be negative"),
  date: z.string(),
});

export type SyllabusSchema = z.infer<typeof syllabusSchema>;

/**
 * Owner never picks the status — it follows the topic counts. A chapter is done
 * when every topic is covered, in progress once any is, and pending otherwise.
 */
export function deriveStatus(topics: number, completedTopics: number): string {
  if (topics > 0 && completedTopics >= topics) return "completed";
  if (completedTopics > 0) return "in-progress";
  return "pending";
}

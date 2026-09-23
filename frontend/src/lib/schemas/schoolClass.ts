import { z } from "zod";

/** The canonical section order. Sections must always be a prefix of this. */
export const SECTION_SEQUENCE = ["A", "B", "C", "D", "E", "F", "G", "H"] as const;

/**
 * True when `sections` is a gap-free run starting at A (A, A-B, A-B-C…).
 * Schools name sections sequentially, so a class can't have section D without
 * also having A, B and C — this rejects "A, D" and other holes.
 */
export function isContiguousFromA(sections: string[]): boolean {
  const unique = [...new Set(sections)];
  if (unique.length === 0) return false;
  const sorted = [...unique].sort();
  return sorted.every((s, i) => s === SECTION_SEQUENCE[i]);
}

export const schoolClassSchema = z.object({
  name: z.string().trim().min(1, "Class name is required"),
  sections: z
    .array(z.string())
    .min(1, "Select at least one section")
    .refine(isContiguousFromA, "Sections must run in order from A — no gaps (e.g. A, B, C)"),
  stream: z.string().trim().min(1, "Stream is required"),
  // Optional — a class may not have a teacher or room assigned yet.
  classTeacher: z.string(),
  room: z.string(),
  // Counts are derived from real students/teachers, not typed.
  students: z.coerce.number<number>().min(0),
  teachers: z.coerce.number<number>().min(0),
});

export type SchoolClassSchema = z.infer<typeof schoolClassSchema>;

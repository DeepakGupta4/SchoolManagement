import { z } from "zod";
import { isValidDateString, isWithin, MIN_RECORD_DATE, TODAY_ISO } from "@/lib/dates";

/** Builds an academic-year label, e.g. startYear 2026 -> "2026-27". */
function makeAcademicYear(startYear: number): string {
  const end = String((startYear + 1) % 100).padStart(2, "0");
  return `${startYear}-${end}`;
}

// The academic year runs April–March (India), so anything before April still
// belongs to the year that started the previous calendar year. Computed once at
// module load — not in render — so it stays React-Compiler-safe.
const NOW = new Date();
const CURRENT_START_YEAR = NOW.getMonth() >= 3 ? NOW.getFullYear() : NOW.getFullYear() - 1;

/** The current academic year, e.g. "2026-27" — the default for new chapters. */
export const CURRENT_ACADEMIC_YEAR = makeAcademicYear(CURRENT_START_YEAR);

/** Recent academic years (newest first) for the picker datalist. */
export const ACADEMIC_YEAR_OPTIONS = [1, 0, -1, -2].map((d) =>
  makeAcademicYear(CURRENT_START_YEAR + d)
);

export const syllabusSchema = z
  .object({
    className: z.string().min(1, "Class is required"),
    subject: z.string().min(1, "Subject is required"),
    teacher: z.string(),
    academicYear: z.string().min(1, "Academic year is required"),
    unit: z.string().min(1, "Unit is required"),
    chapter: z.string().min(1, "Chapter name is required"),
    // At least one topic so a chapter is always trackable/completable and the
    // progress percentage never divides by zero.
    topics: z.coerce.number<number>().min(1, "At least one topic").max(999, "Looks too high"),
    completedTopics: z.coerce.number<number>().min(0, "Cannot be negative"),
    // Optional "taught on" date: blank is allowed, but a filled value must be a
    // real 4-digit-year date, no later than today.
    date: z
      .string()
      .refine((d) => d === "" || isValidDateString(d), "Enter a valid date")
      .refine((d) => d === "" || isWithin(d, MIN_RECORD_DATE, TODAY_ISO), "Date can't be in the future"),
  })
  // Completed can never exceed the total — otherwise progress reads over 100%.
  .refine((v) => v.completedTopics <= v.topics, {
    path: ["completedTopics"],
    message: "Cannot exceed total topics",
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

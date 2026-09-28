import { z } from "zod";
import { isValidDateString, isWithin, MIN_RECORD_DATE } from "@/lib/dates";

/**
 * Sane window for any exam date. The native `<input type="date">` otherwise
 * accepts up to a 6-digit year (e.g. 44444), so both the input (min/max) and the
 * schema (below) are bounded: from the earliest sensible record date up to a few
 * years ahead. Computed once at module load — good enough, they shift by a day.
 */
export const MIN_EXAM_DATE = MIN_RECORD_DATE;
export const MAX_EXAM_DATE = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 3);
  return d.toISOString().slice(0, 10);
})();

export const examSchema = z.object({
  // Optional — auto-generated from the exam when left blank.
  code: z.string(),
  name: z.string().min(2, "Exam name is required"),
  type: z.string().min(1, "Type is required"),
  classes: z.array(z.string()).min(1, "Select at least one class"),
  subject: z.string().min(1, "Subject is required"),
  date: z
    .string()
    .min(3, "Date is required")
    .refine(isValidDateString, "Enter a valid date (YYYY-MM-DD)")
    .refine((d) => isWithin(d, MIN_EXAM_DATE, MAX_EXAM_DATE), "Exam date looks out of range"),
  time: z.string().min(3, "Time is required"),
  duration: z.string().min(1, "Duration is required"),
  totalMarks: z.coerce.number<number>().min(1, "Must be at least 1"),
  status: z.string().min(1, "Status is required"),
  students: z.coerce.number<number>().min(0, "Cannot be negative"),
});

export type ExamSchema = z.infer<typeof examSchema>;

import { z } from "zod";
import { isValidDateString, isWithin, MIN_RECORD_DATE } from "@/lib/dates";

/**
 * A few years of runway is plenty for scheduling an assignment. Combined with
 * `isValidDateString` (which requires a real 4-digit year) this rejects both
 * far-future dates and 6-digit-year garbage. Computed once at module load.
 */
export const MAX_ASSIGNMENT_DATE = `${new Date().getFullYear() + 5}-12-31`;

export const assignmentSchema = z
  .object({
    title: z.string().min(3, "Assignment title is required"),
    subject: z.string().min(1, "Subject is required"),
    class: z.string().min(1, "Class is required"),
    teacher: z.string().min(2, "Teacher is required"),
    given: z
      .string()
      .min(1, "Given date is required")
      .refine(isValidDateString, "Enter a valid date")
      .refine((d) => isWithin(d, MIN_RECORD_DATE, MAX_ASSIGNMENT_DATE), "Date looks out of range"),
    due: z
      .string()
      .min(1, "Due date is required")
      .refine(isValidDateString, "Enter a valid date")
      .refine((d) => isWithin(d, MIN_RECORD_DATE, MAX_ASSIGNMENT_DATE), "Date looks out of range"),
    totalMarks: z.coerce.number<number>().min(1, "Marks must be at least 1"),
    submitted: z.coerce.number<number>().min(0, "Cannot be negative"),
    total: z.coerce.number<number>().min(1, "Must be at least 1 student"),
    // Derived from the dates on submit (see deriveAssignmentStatus), never free-typed.
    status: z.string().min(1, "Status is required"),
    type: z.string().min(1, "Type is required"),
  })
  .refine((v) => v.submitted <= v.total, {
    message: "Cannot exceed the number of students",
    path: ["submitted"],
  })
  // Only compared once both are real dates — the field-level checks above own the
  // "invalid date" messaging, so this stays focused on the ordering.
  .refine((v) => !isValidDateString(v.given) || !isValidDateString(v.due) || v.due >= v.given, {
    message: "Due date must be on or after the given date",
    path: ["due"],
  });

export type AssignmentSchema = z.infer<typeof assignmentSchema>;

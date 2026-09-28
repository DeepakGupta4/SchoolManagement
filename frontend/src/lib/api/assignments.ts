import { createApiResource } from "./createApiResource";
import { isValidDateString, TODAY_ISO } from "@/lib/dates";

export interface Assignment {
  id: string;
  /** Human-facing assignment reference shown in the UI, e.g. "A001". The `id`
   *  is internal and must never be displayed. */
  code: string;
  title: string;
  subject: string;
  /** Class name, e.g. "Class 10". Matches the app's Classes & Sections. */
  class: string;
  teacher: string;
  /** Date the assignment was handed out, as yyyy-mm-dd. */
  given: string;
  /** Due date, as yyyy-mm-dd. */
  due: string;
  totalMarks: number;
  submitted: number;
  /** Number of students the assignment was set for (the class roster). */
  total: number;
  /** Persisted lifecycle state. Re-derived on read via `assignmentStatus` so a
   *  stale stored value can never contradict the dates. */
  status: string;
  type: string;
}

export interface AssignmentFilters {
  search?: string;
  /** Exact class name, e.g. "Class 6". Empty (or absent) means every class. */
  class?: string;
}

export type AssignmentStatus = "upcoming" | "active" | "overdue" | "completed";

export const ASSIGNMENT_STATUS_OPTIONS: AssignmentStatus[] = [
  "upcoming",
  "active",
  "overdue",
  "completed",
];

export const ASSIGNMENT_TYPE_OPTIONS = [
  "Worksheet",
  "Problem Set",
  "Essay",
  "Research",
  "Diagram",
  "Practical",
];

export const ASSIGNMENT_SUBJECT_OPTIONS = [
  "Mathematics",
  "Physics",
  "English",
  "Chemistry",
  "History",
  "Biology",
  "Comp. Sci",
];

/**
 * Status is a pure function of the dates plus whether the teacher has closed the
 * assignment — never free-typed, so the badge can never contradict the due date.
 * "completed" is the only manual, terminal state; the rest follow today's date:
 *   - upcoming: the given date is still in the future
 *   - overdue:  past the due date and not marked completed
 *   - active:   handed out and not yet past due
 */
export function deriveAssignmentStatus(
  given: string,
  due: string,
  completed: boolean
): AssignmentStatus {
  if (completed) return "completed";
  if (isValidDateString(given) && given > TODAY_ISO) return "upcoming";
  if (isValidDateString(due) && due < TODAY_ISO) return "overdue";
  return "active";
}

/** Effective status of a stored record, re-derived so a stale value can't lie. */
export function assignmentStatus(
  a: Pick<Assignment, "given" | "due" | "status">
): AssignmentStatus {
  return deriveAssignmentStatus(a.given, a.due, a.status === "completed");
}

export const assignmentsApi = createApiResource<Assignment, AssignmentFilters, "code">(
  "/api/assignments"
);

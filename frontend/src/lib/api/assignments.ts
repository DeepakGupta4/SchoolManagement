import { createApiResource } from "./createApiResource";

export interface Assignment {
  id: string;
  /** Human-facing assignment reference shown in the UI, e.g. "A001". The `id`
   *  is internal and must never be displayed. */
  code: string;
  title: string;
  subject: string;
  /** Class and section, e.g. "10-A". */
  class: string;
  teacher: string;
  /** Date the assignment was handed out, e.g. "Jul 10". */
  given: string;
  /** Due date, e.g. "Jul 17". */
  due: string;
  totalMarks: number;
  submitted: number;
  /** Number of students the assignment was set for. */
  total: number;
  status: string;
  type: string;
}

export interface AssignmentFilters {
  search?: string;
  /** "All" (or empty) means every status. */
  status?: string;
}

export const ASSIGNMENT_STATUS_OPTIONS = ["active", "upcoming", "completed", "overdue"];

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

export const assignmentsApi = createApiResource<Assignment, AssignmentFilters, "code">(
  "/api/assignments"
);

import { createResource, textMatch } from "./createResource";

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

const seed: Assignment[] = [
  { id: "asg_001", code: "A001", title: "Quadratic Equations Practice", subject: "Mathematics", class: "10-A", teacher: "Dr. Priya Sharma", given: "Jul 10", due: "Jul 17", totalMarks: 20, submitted: 38, total: 42, status: "active", type: "Worksheet" },
  { id: "asg_002", code: "A002", title: "Newton's Laws Problems", subject: "Physics", class: "11-A", teacher: "Mr. Rahul Verma", given: "Jul 12", due: "Jul 19", totalMarks: 15, submitted: 30, total: 40, status: "active", type: "Problem Set" },
  { id: "asg_003", code: "A003", title: "Essay — My Favourite Season", subject: "English", class: "8-B", teacher: "Ms. Anita Patel", given: "Jul 8", due: "Jul 15", totalMarks: 10, submitted: 44, total: 44, status: "completed", type: "Essay" },
  { id: "asg_004", code: "A004", title: "Periodic Table Elements", subject: "Chemistry", class: "9-A", teacher: "Ms. Kavita Singh", given: "Jul 14", due: "Jul 21", totalMarks: 25, submitted: 12, total: 38, status: "active", type: "Research" },
  { id: "asg_005", code: "A005", title: "World War II Summary", subject: "History", class: "10-B", teacher: "Mr. Suresh Kumar", given: "Jul 5", due: "Jul 12", totalMarks: 15, submitted: 40, total: 40, status: "completed", type: "Essay" },
  { id: "asg_006", code: "A006", title: "Cell Division Diagrams", subject: "Biology", class: "12-A", teacher: "Ms. Deepa Nair", given: "Jul 15", due: "Jul 22", totalMarks: 20, submitted: 5, total: 35, status: "active", type: "Diagram" },
  { id: "asg_007", code: "A007", title: "Python Basics Program", subject: "Comp. Sci", class: "9-B", teacher: "Mr. Amit Joshi", given: "Jul 16", due: "Jul 23", totalMarks: 30, submitted: 0, total: 36, status: "upcoming", type: "Practical" },
  { id: "asg_008", code: "A008", title: "Trigonometry Identities", subject: "Mathematics", class: "11-A", teacher: "Dr. Priya Sharma", given: "Jul 18", due: "Jul 25", totalMarks: 20, submitted: 0, total: 40, status: "upcoming", type: "Worksheet" },
];

export const assignmentsApi = createResource<Assignment, AssignmentFilters, "code">({
  idPrefix: "asg",
  seed,
  uniqueBy: { field: "title", label: "Assignment title" },
  // Reference numbers continue the seed sequence rather than restarting.
  generate: (count) => ({ code: `A${String(count + 1).padStart(3, "0")}` }),
  defaults: { submitted: 0, total: 0, totalMarks: 0, status: "upcoming" },
  matches: (row, { search, status }) => {
    if (status && status !== "All" && row.status !== status) return false;
    return textMatch(search, row.title, row.subject, row.class, row.teacher, row.code);
  },
});

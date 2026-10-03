import { createApiResource } from "./createApiResource";
import { isValidDateString, todayIso } from "@/lib/dates";

export interface Exam {
  id: string;
  /** Human-facing exam code, e.g. "EX001". Must stay unique. */
  code: string;
  name: string;
  type: string;
  /** Classes sitting this exam. ["All"] means the whole school. */
  classes: string[];
  subject: string;
  date: string;
  time: string;
  duration: string;
  totalMarks: number;
  status: string;
  students: number;
}

export interface ExamFilters {
  search?: string;
  status?: string;
}

export const EXAM_TYPE_OPTIONS = ["Unit Test", "Mid-Term", "Final", "Practical", "Class Test"];

export const EXAM_STATUS_OPTIONS = [
  { label: "Upcoming", value: "upcoming" },
  { label: "Ongoing", value: "ongoing" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

export const EXAM_CLASS_OPTIONS = [
  "All",
  "6-A",
  "7-A",
  "8-A",
  "9-A",
  "9-B",
  "10-A",
  "10-B",
  "11-A",
  "12-A",
];

export const EXAM_SUBJECT_OPTIONS = [
  "All Subjects",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "Hindi",
  "History",
  "Geography",
  "Computer Science",
];

/**
 * The exam's effective status, derived from its date so it stays truthful as
 * time passes: a past exam is "completed", today's is "ongoing", a future one
 * is "upcoming". A manually "cancelled" exam keeps that status. Falls back to
 * the stored status when the date is missing/invalid.
 */
export function examStatus(exam: Pick<Exam, "date" | "status">): string {
  if (exam.status === "cancelled") return "cancelled";
  if (!isValidDateString(exam.date)) return exam.status || "upcoming";
  const today = todayIso();
  if (exam.date > today) return "upcoming";
  if (exam.date === today) return "ongoing";
  return "completed";
}

export const examsApi = createApiResource<Exam, ExamFilters>("/api/exams");

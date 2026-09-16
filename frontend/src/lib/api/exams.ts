import { createApiResource } from "./createApiResource";

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

export const examsApi = createApiResource<Exam, ExamFilters>("/api/exams");

import { createResource, textMatch } from "./createResource";

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

const seed: Exam[] = [
  { id: "exm_001", code: "EX001", name: "Unit Test 1",    type: "Unit Test",  classes: ["10-A"], subject: "Mathematics",  date: "Jul 20, 2025", time: "9:00 AM",  duration: "1 hr",   totalMarks: 25,  status: "upcoming",  students: 42 },
  { id: "exm_002", code: "EX002", name: "Mid-Term Exam",  type: "Mid-Term",   classes: ["All"],  subject: "All Subjects", date: "Jul 28, 2025", time: "8:30 AM",  duration: "3 hrs",  totalMarks: 100, status: "upcoming",  students: 1240 },
  { id: "exm_003", code: "EX003", name: "Unit Test 1",    type: "Unit Test",  classes: ["9-B"],  subject: "Physics",      date: "Jul 15, 2025", time: "10:00 AM", duration: "1 hr",   totalMarks: 25,  status: "completed", students: 38 },
  { id: "exm_004", code: "EX004", name: "Practical Exam", type: "Practical",  classes: ["12-A"], subject: "Chemistry",    date: "Jul 10, 2025", time: "9:00 AM",  duration: "2 hrs",  totalMarks: 30,  status: "completed", students: 35 },
  { id: "exm_005", code: "EX005", name: "Class Test",     type: "Class Test", classes: ["8-A"],  subject: "English",      date: "Jul 18, 2025", time: "11:00 AM", duration: "45 min", totalMarks: 20,  status: "ongoing",   students: 44 },
  { id: "exm_006", code: "EX006", name: "Final Exam",     type: "Final",      classes: ["All"],  subject: "All Subjects", date: "Oct 15, 2025", time: "8:30 AM",  duration: "3 hrs",  totalMarks: 100, status: "upcoming",  students: 1240 },
  { id: "exm_007", code: "EX007", name: "Unit Test 2",    type: "Unit Test",  classes: ["11-A"], subject: "Biology",      date: "Jul 08, 2025", time: "9:00 AM",  duration: "1 hr",   totalMarks: 25,  status: "completed", students: 40 },
  { id: "exm_008", code: "EX008", name: "Assignment Test",type: "Class Test", classes: ["7-A"],  subject: "History",      date: "Jul 22, 2025", time: "10:30 AM", duration: "30 min", totalMarks: 15,  status: "upcoming",  students: 36 },
];

const isAll = (value?: string) => !value || value === "All";

export const examsApi = createResource<Exam, ExamFilters>({
  idPrefix: "exm",
  seed,
  uniqueBy: { field: "code", label: "Exam code" },
  defaults: { status: "upcoming", students: 0, totalMarks: 0 },
  matches: (row, { search, status }) => {
    if (!isAll(status) && row.status !== status) return false;
    return textMatch(search, row.name, row.code, row.subject, row.type, row.classes.join(" "));
  },
});

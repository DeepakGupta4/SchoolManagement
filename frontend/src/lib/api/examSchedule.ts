import { createResource, textMatch } from "./createResource";

export interface ScheduledExam {
  id: string;
  /** Human-facing schedule code, e.g. "ES001". Must stay unique. */
  code: string;
  exam: string;
  subject: string;
  class: string;
  date: string;
  time: string;
  duration: string;
  room: string;
  invigilator: string;
  totalMarks: number;
  status: string;
}

export interface ScheduleFilters {
  search?: string;
  status?: string;
}

export const SCHEDULE_EXAM_OPTIONS = [
  "Mid-Term Exam",
  "Unit Test 1",
  "Unit Test 2",
  "Class Test",
  "Practical",
  "Final Exam",
];

export const SCHEDULE_SUBJECT_OPTIONS = [
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

export const SCHEDULE_CLASS_OPTIONS = [
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

export const SCHEDULE_ROOM_OPTIONS = [
  "Hall A",
  "Hall B",
  "Room 106",
  "Room 201",
  "Room 301",
  "Chem Lab",
  "Physics Lab",
  "Computer Lab",
];

export const SCHEDULE_INVIGILATOR_OPTIONS = [
  "Dr. Priya Sharma",
  "Mr. Rahul Verma",
  "Ms. Kavita Singh",
  "Ms. Anita Patel",
  "Ms. Deepa Nair",
  "Mr. Suresh Kumar",
  "Mr. Amit Joshi",
];

export const SCHEDULE_STATUS_OPTIONS = [
  { label: "Upcoming", value: "upcoming" },
  { label: "Ongoing", value: "ongoing" },
  { label: "Completed", value: "completed" },
];

const seed: ScheduledExam[] = [
  { id: "esc_001", code: "ES001", exam: "Mid-Term Exam", subject: "Mathematics", class: "10-A", date: "Jul 28, 2025", time: "8:30 AM",  duration: "3 hrs",  room: "Hall A",   invigilator: "Dr. Priya Sharma", totalMarks: 100, status: "upcoming" },
  { id: "esc_002", code: "ES002", exam: "Mid-Term Exam", subject: "Physics",     class: "10-A", date: "Jul 29, 2025", time: "8:30 AM",  duration: "3 hrs",  room: "Hall B",   invigilator: "Mr. Rahul Verma",  totalMarks: 100, status: "upcoming" },
  { id: "esc_003", code: "ES003", exam: "Mid-Term Exam", subject: "Chemistry",   class: "10-A", date: "Jul 30, 2025", time: "8:30 AM",  duration: "3 hrs",  room: "Hall A",   invigilator: "Ms. Kavita Singh", totalMarks: 100, status: "upcoming" },
  { id: "esc_004", code: "ES004", exam: "Unit Test 1",   subject: "English",     class: "9-B",  date: "Jul 20, 2025", time: "10:00 AM", duration: "1 hr",   room: "Room 201", invigilator: "Ms. Anita Patel",  totalMarks: 25,  status: "upcoming" },
  { id: "esc_005", code: "ES005", exam: "Class Test",    subject: "Biology",     class: "11-A", date: "Jul 18, 2025", time: "11:00 AM", duration: "45 min", room: "Room 301", invigilator: "Ms. Deepa Nair",   totalMarks: 20,  status: "ongoing" },
  { id: "esc_006", code: "ES006", exam: "Unit Test 1",   subject: "History",     class: "8-A",  date: "Jul 10, 2025", time: "9:00 AM",  duration: "1 hr",   room: "Room 106", invigilator: "Mr. Suresh Kumar", totalMarks: 25,  status: "completed" },
  { id: "esc_007", code: "ES007", exam: "Practical",     subject: "Chemistry",   class: "12-A", date: "Jul 08, 2025", time: "9:00 AM",  duration: "2 hrs",  room: "Chem Lab", invigilator: "Ms. Kavita Singh", totalMarks: 30,  status: "completed" },
];

const isAll = (value?: string) => !value || value === "All";

export const examScheduleApi = createResource<ScheduledExam, ScheduleFilters>({
  idPrefix: "esc",
  seed,
  uniqueBy: { field: "code", label: "Schedule code" },
  defaults: { status: "upcoming", totalMarks: 0 },
  matches: (row, { search, status }) => {
    if (!isAll(status) && row.status !== status) return false;
    return textMatch(search, row.exam, row.code, row.subject, row.class, row.room, row.invigilator);
  },
});

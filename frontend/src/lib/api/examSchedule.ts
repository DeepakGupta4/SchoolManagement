import { createApiResource } from "./createApiResource";

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

export const examScheduleApi = createApiResource<ScheduledExam, ScheduleFilters>(
  "/api/exam-schedule"
);

import { api } from "./client";

/** One scheduled paper — the join of exam + class + subject to a date/time/room. */
export interface ScheduledExam {
  id: string;
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

/** Every scheduled paper for the school (read-open to any signed-in user). */
export const listExamSchedule = () => api<ScheduledExam[]>("/api/exam-schedule?limit=500");

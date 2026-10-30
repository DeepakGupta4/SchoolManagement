import { api } from "./client";

export interface Exam {
  id: string;
  name: string;
  date?: string;
  type?: string;
  status?: string;
}

/** Exams for the school — the name is the join key for marks. */
export const listExams = () => api<Exam[]>("/api/exams?limit=200");

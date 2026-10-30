import { api } from "./client";

export interface MarkRow {
  studentId: string;
  studentName: string;
  roll: number;
  subject: string;
  marks: number;
  maxMarks: number;
}

/** Saved marks for an exam + class + section (across all subjects). */
export const getMarks = (examName: string, className: string, section: string) =>
  api<MarkRow[]>(
    `/api/marks?examName=${encodeURIComponent(examName)}&className=${encodeURIComponent(className)}&section=${encodeURIComponent(section)}`
  );

export interface SaveMarksResult {
  saved: number;
  skipped: number;
}

/** Upsert a subject's marks. Server skips any id not on the active roster. */
export const saveMarks = (body: {
  examName: string;
  className: string;
  section: string;
  records: MarkRow[];
}) => api<SaveMarksResult>("/api/marks", { method: "POST", body });

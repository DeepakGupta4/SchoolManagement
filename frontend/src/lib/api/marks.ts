import { apiRequest } from "./client";

export interface MarkRecord {
  studentId: string;
  studentName: string;
  roll: number;
  subject: string;
  marks: number;
  maxMarks: number;
}

/** Saved marks for an exam + class + section (empty if never saved). */
export async function getMarks(
  examName: string,
  className: string,
  section: string
): Promise<MarkRecord[]> {
  return apiRequest<MarkRecord[]>("/api/marks", {
    query: { examName, className, section },
  });
}

export async function saveMarks(payload: {
  examName: string;
  className: string;
  section: string;
  records: MarkRecord[];
}): Promise<{ saved: number }> {
  return apiRequest<{ saved: number }>("/api/marks", { method: "POST", body: payload });
}

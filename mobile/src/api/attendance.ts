import { api } from "./client";

export const ATTENDANCE_STATUSES = ["present", "absent", "late", "half-day", "leave"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export interface AttendanceMark {
  studentId: string;
  studentName: string;
  roll: number;
  status: AttendanceStatus;
  /** "manual" = submitted via the marking screen; "auto" = 11:00 auto-absent sweep.
   *  Absent on an older backend that predates the field. */
  source?: "manual" | "auto";
}

/** Saved roll-call for a class+section on a date (empty if never marked). */
export const getSavedAttendance = (className: string, section: string, date: string) =>
  api<AttendanceMark[]>(
    `/api/attendance?className=${encodeURIComponent(className)}&section=${encodeURIComponent(section)}&date=${date}`
  );

export interface SaveAttendanceResult {
  saved: number;
  skipped: number;
}

/** Upsert the whole roll-call. Server skips any id not on the active roster. */
export const saveAttendance = (body: {
  className: string;
  section: string;
  date: string;
  records: AttendanceMark[];
}) => api<SaveAttendanceResult>("/api/attendance", { method: "POST", body });

export interface StudentAttendanceSummary {
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  leave: number;
  total: number;
  percent: number;
}

export interface StudentAttendance {
  student: { id: string; name: string; className: string; section: string; rollNo: string };
  summary: StudentAttendanceSummary;
  records: { date: string; status: AttendanceStatus }[]; // newest-first
}

/**
 * One student's attendance history + tally (present/absent/… counts + fair %).
 * Staff-only; a teacher is scoped to their own classes server-side. May 404 on
 * an older backend that predates this route — callers should handle that.
 */
export const getStudentAttendance = (id: string, q?: { from?: string; to?: string }) => {
  const params = new URLSearchParams();
  if (q?.from) params.set("from", q.from);
  if (q?.to) params.set("to", q.to);
  const qs = params.toString();
  return api<StudentAttendance>(`/api/attendance/student/${encodeURIComponent(id)}${qs ? `?${qs}` : ""}`);
};

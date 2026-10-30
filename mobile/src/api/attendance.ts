import { api } from "./client";

export const ATTENDANCE_STATUSES = ["present", "absent", "late", "half-day", "leave"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export interface AttendanceMark {
  studentId: string;
  studentName: string;
  roll: number;
  status: AttendanceStatus;
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

import { apiRequest } from "./client";

export type AttendanceStatus = "present" | "absent" | "late";

export interface AttendanceMark {
  studentId: string;
  studentName: string;
  roll: number;
  status: AttendanceStatus;
}

/** Saved roll-call for a class + section on a date (empty if never saved). */
export async function getAttendance(
  className: string,
  section: string,
  date: string
): Promise<AttendanceMark[]> {
  return apiRequest<AttendanceMark[]>("/api/attendance", {
    query: { className, section, date },
  });
}

export async function saveAttendance(payload: {
  className: string;
  section: string;
  date: string;
  records: AttendanceMark[];
}): Promise<{ saved: number }> {
  return apiRequest<{ saved: number }>("/api/attendance", { method: "POST", body: payload });
}

/** One active student's attendance tally over a date range (the register row). */
export interface AttendanceStudentSummary {
  studentId: string;
  studentName: string;
  roll: number;
  present: number;
  absent: number;
  late: number;
  total: number;
  /** round((present + late) / total * 100); 0 when total is 0. */
  percent: number;
}

/** Per-day roll-up across the class, for the weekly/overview charts. */
export interface AttendanceDaySummary {
  date: string;
  present: number;
  absent: number;
  late: number;
  total: number;
  /** round(present / total * 100); 0 when total is 0. */
  presentPercent: number;
}

export interface AttendanceSummary {
  students: AttendanceStudentSummary[];
  daily: AttendanceDaySummary[];
}

/**
 * Attendance register for a class + section over [from, to] (both YYYY-MM-DD).
 * Lists every currently-active student (with zeros when unmarked) plus a
 * per-day roll-up. Powers the weekly overview and the monthly report.
 */
export async function getAttendanceSummary(
  className: string,
  section: string,
  from: string,
  to: string
): Promise<AttendanceSummary> {
  return apiRequest<AttendanceSummary>("/api/attendance/summary", {
    query: { className, section, from, to },
  });
}

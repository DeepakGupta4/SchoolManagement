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

import { apiRequest } from "./client";

export type StaffAttendanceStatus = "present" | "absent" | "late" | "half-day" | "leave";

export interface StaffAttendanceMark {
  /** Which workforce the person belongs to (teachers & staff are separate). */
  type: "teacher" | "staff";
  personId: string;
  employeeId: string;
  name: string;
  role: string;
  dept: string;
  status: StaffAttendanceStatus;
}

/** Saved roll-call for a date (empty if never marked). */
export async function getStaffAttendance(date: string): Promise<StaffAttendanceMark[]> {
  return apiRequest<StaffAttendanceMark[]>("/api/staff-attendance", { query: { date } });
}

export async function saveStaffAttendance(payload: {
  date: string;
  records: StaffAttendanceMark[];
}): Promise<{ saved: number }> {
  return apiRequest<{ saved: number }>("/api/staff-attendance", { method: "POST", body: payload });
}

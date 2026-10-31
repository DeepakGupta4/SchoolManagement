import { api } from "./client";

export interface SubjectMark {
  subject: string;
  marks: number;
  maxMarks: number;
  percent: number;
  grade: string;
  gradePoint: number;
}

// ---------- Student ----------
export interface Period {
  period: number;
  time: string;
  subject: string;
  teacher: string;
  room: string;
}
export interface StudentMe {
  profile: { name: string; className: string; section: string; rollNo: string; admissionNo: string; avatar: string; status: string };
  stats: { attendancePercent: number; performancePercent: number; feeDue: number };
  todaysPeriods: Period[];
}
/** The signed-in student's snapshot (null if no student record is linked). */
export const getStudentMe = () => api<StudentMe | null>("/api/portal/me/student");

export interface StudentReport {
  profile: { name: string; className: string; section: string };
  subjects: SubjectMark[];
  gpa: number;
}
export const getStudentReport = () => api<StudentReport | null>("/api/portal/me/report");

// ---------- Parent ----------
export interface ChildSummary {
  id: string;
  name: string;
  className: string;
  section: string;
  rollNo: string;
  admissionNo: string;
  avatar: string;
  status: string;
  attendancePercent: number;
  performancePercent: number;
  feeDue: number;
}
/** The signed-in parent's children (matched by guardian/father/mother email). */
export const getChildren = () => api<ChildSummary[]>("/api/portal/children");

export interface ChildDetail {
  profile: { name: string; className: string; section: string; rollNo: string };
  stats: { attendancePercent: number; performancePercent: number; feeDue: number; gpa: number };
  subjects: SubjectMark[];
}
export const getChild = (id: string) => api<ChildDetail>(`/api/portal/children/${id}`);

// ---------- Staff / Driver ----------
export type StaffAttendanceStatus = "present" | "absent" | "late" | "half-day" | "leave";

/** The signed-in staff member's own attendance summary (self-scoped server-side). */
export interface StaffAttendanceSummary {
  marked: number;
  percent: number;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  leave: number;
  recent: { date: string; status: StaffAttendanceStatus }[];
}
export interface StaffMe {
  profile: { name: string; role: string; dept: string; employeeId: string; status: string; avatar: string };
  /** Added later on the backend — absent on an older deploy. */
  attendance?: StaffAttendanceSummary;
}
export const getStaffMe = () => api<StaffMe | null>("/api/portal/me/staff");

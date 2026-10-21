import { apiRequest } from "./client";

/** A child shown in the parent portal — only the child's own summary, no school-wide data. */
export interface PortalChild {
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

/** The signed-in parent's own children (matched by their login email). */
export async function getMyChildren(): Promise<PortalChild[]> {
  return apiRequest<PortalChild[]>("/api/portal/children");
}

/* ---------- one child in detail (subject-wise marks) ---------- */
export interface ChildSubject {
  subject: string;
  marks: number;
  maxMarks: number;
  percent: number;
}
export interface ChildDetail {
  profile: { name: string; className: string; section: string; rollNo: string };
  stats: { attendancePercent: number; performancePercent: number; feeDue: number };
  subjects: ChildSubject[];
}
/** One of the parent's own children in detail — guarded server-side to their kids. */
export async function getChildDetail(id: string): Promise<ChildDetail> {
  return apiRequest<ChildDetail>(`/api/portal/children/${id}`);
}

/* ---------- student self-service ---------- */
export interface StudentPeriod {
  period: number;
  time: string;
  subject: string;
  teacher: string;
  room: string;
}
export interface StudentPortal {
  profile: {
    name: string;
    className: string;
    section: string;
    rollNo: string;
    admissionNo: string;
    avatar: string;
    status: string;
  };
  stats: { attendancePercent: number; performancePercent: number; feeDue: number };
  todaysPeriods: StudentPeriod[];
}
/** The signed-in student's own snapshot (matched by login email), or null. */
export async function getMyStudent(): Promise<StudentPortal | null> {
  return apiRequest<StudentPortal | null>("/api/portal/me/student");
}

/* ---------- driver self-service ---------- */
export interface DriverRoute {
  id: string;
  code: string;
  name: string;
  stops: string[];
  students: number;
  bus: string;
  departure: string;
  arrival: string;
  status: string;
}
export interface DriverPortal {
  driverName: string;
  routes: DriverRoute[];
}
/** The signed-in driver's assigned route(s) (best-effort name match). */
export async function getMyDriver(): Promise<DriverPortal> {
  return apiRequest<DriverPortal>("/api/portal/me/driver");
}

/* ---------- non-teaching staff self-service ---------- */
export interface StaffPortal {
  profile: { name: string; role: string; dept: string; employeeId: string; status: string; avatar: string };
}
/** The signed-in staff member's own record (matched by login email), or null. */
export async function getMyStaff(): Promise<StaffPortal | null> {
  return apiRequest<StaffPortal | null>("/api/portal/me/staff");
}

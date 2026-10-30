import { api } from "./client";

export interface Teacher {
  id?: string;
  employeeId?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  department?: string;
  qualification?: string;
  joiningDate?: string;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
  experienceYears?: number;
  employmentType?: string;
  status?: string;
  classes?: string[];
  subjects?: string[];
  isClassTeacher?: boolean;
  classTeacherOf?: string;
  classTeacherSection?: string;
  avatar?: string;
}

export interface TimetableEntry {
  id: string;
  day: string;
  period: number;
  className: string;
  section?: string;
  subject: string;
  teacher: string;
  room?: string;
}

/** The signed-in teacher's own record (scoped server-side to their account). */
export const getMyTeacher = () => api<Teacher>("/api/teachers/me");

/** Timetable rows. Pass a teacher name so the server scopes it (avoids the 500-row cap). */
export const getTimetable = (teacher?: string) =>
  api<TimetableEntry[]>(`/api/timetable?limit=500${teacher ? `&teacher=${encodeURIComponent(teacher)}` : ""}`);

export function teacherName(t?: Teacher | null): string {
  if (!t) return "";
  return t.name || `${t.firstName ?? ""} ${t.lastName ?? ""}`.trim();
}

/** Normalize a name for matching: trim, collapse inner spaces, lowercase. */
export const normName = (s?: string) => (s ?? "").trim().replace(/\s+/g, " ").toLowerCase();

/** Timetable stores the teacher by name — the one place that decides "is this my period?". */
export const isTaughtBy = (e: TimetableEntry, who: string) => normName(e.teacher) === normName(who);

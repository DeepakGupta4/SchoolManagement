import { api } from "./client";

export interface Teacher {
  id?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
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
export const getTimetable = () => api<TimetableEntry[]>("/api/timetable?limit=500");

export function teacherName(t?: Teacher | null): string {
  if (!t) return "";
  return t.name || `${t.firstName ?? ""} ${t.lastName ?? ""}`.trim();
}

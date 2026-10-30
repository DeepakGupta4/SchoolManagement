import { api } from "./client";

/** One cover duty: a substitute teacher standing in for an absent colleague. */
export interface Substitution {
  id: string;
  date: string;
  day: string;
  period: number;
  time: string;
  className: string;
  subject: string;
  room: string;
  absentTeacher: string;
  absentEmpId: string;
  substituteTeacher: string;
  substituteEmpId: string;
  substituteEmail: string;
  status: "assigned" | "cancelled";
  note: string;
}

/** Assigned cover duties for the school (read-only on mobile). */
export const listSubstitutions = () =>
  api<Substitution[]>("/api/substitutions?status=assigned&limit=500");

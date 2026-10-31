import { api } from "./client";

export interface Guardian {
  name: string;
  relation: string;
  phone: string;
  email?: string;
  occupation?: string;
}

export interface Student {
  id?: string;
  admissionNo: string;
  rollNo: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  className: string;
  section: string;
  admissionDate: string;
  address: string;
  guardian: Guardian;
  avatar?: string;
  status?: string;
}

/** The class teacher's roster. className/section come from their own class. */
export function listStudents(
  params: { className?: string; section?: string; search?: string; status?: string } = {}
) {
  const q = new URLSearchParams({ limit: "500" });
  if (params.className) q.set("className", params.className);
  if (params.section) q.set("section", params.section);
  if (params.search) q.set("search", params.search);
  if (params.status) q.set("status", params.status);
  return api<Student[]>(`/api/students?${q.toString()}`);
}

export const getStudent = (id: string) => api<Student>(`/api/students/${id}`);

// className/section are also FORCED server-side to the teacher's own class.
export const createStudent = (body: Partial<Student>) => api<Student>("/api/students", { method: "POST", body });
export const updateStudent = (id: string, body: Partial<Student>) =>
  api<Student>(`/api/students/${id}`, { method: "PUT", body });

/** Re-sequence a class+section's roll numbers A–Z by name (teacher-scoped to the
 *  caller's own class on the server). Returns how many rolls changed. */
export const renumberRoll = (className: string, section: string) =>
  api<{ updated: number; groups: number }>("/api/students/renumber", {
    method: "POST",
    body: { className, section },
  });

export const studentFullName = (s: Student) => `${s.firstName} ${s.lastName}`.trim();

import { apiRequest, apiList } from "./client";
import type { Teacher, TeacherFormValues } from "@/types/teacher";

/**
 * Teachers API — backed by the real server.
 *
 * Function signatures are unchanged from the previous in-memory version, so
 * every page that consumed them keeps working untouched.
 */

export const SUBJECT_OPTIONS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "Hindi",
  "History",
  "Geography",
  "Computer Science",
  "Physical Education",
];

export const DEPARTMENT_OPTIONS = [
  "Science",
  "Mathematics",
  "Languages",
  "Social Studies",
  "Computer Science",
  "Sports",
];

export const TEACHER_CLASS_OPTIONS = ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"];

export interface TeacherFilters {
  search?: string;
  subject?: string;
  status?: string;
  employmentType?: string;
}

export interface TeacherPage {
  data: Teacher[];
  meta: { total: number; page: number; limit: number; pages: number };
}

/** One page of teachers, keeping `meta` (total/pages). `subject` is a real server
 *  filter now (Mongo matches array membership on the `subjects` field). */
export async function listTeachersPage(
  filters: TeacherFilters & { page?: number; limit?: number } = {}
): Promise<TeacherPage> {
  return apiList<Teacher>("/api/teachers", {
    query: {
      search: filters.search,
      status: filters.status,
      employmentType: filters.employmentType,
      subjects: filters.subject,
      page: filters.page,
      limit: filters.limit ?? 200,
    },
  });
}

export async function listTeachers(filters: TeacherFilters = {}): Promise<Teacher[]> {
  const { data } = await listTeachersPage({ ...filters, limit: 200 });
  return data;
}

/** EVERY matching teacher across all pages — for complete browse/export/dup-checks. */
export async function fetchAllTeachers(filters: TeacherFilters = {}): Promise<Teacher[]> {
  const first = await listTeachersPage({ ...filters, page: 1, limit: 500 });
  const byId = new Map<string, Teacher>();
  for (const t of first.data) byId.set(t.id, t);
  const rawPages = first.meta?.pages ?? 1;
  const pages = Number.isFinite(rawPages) && rawPages > 1 ? Math.floor(rawPages) : 1;
  for (let p = 2; p <= pages; p++) {
    const next = await listTeachersPage({ ...filters, page: p, limit: 500 });
    for (const t of next.data) byId.set(t.id, t);
  }
  return [...byId.values()];
}

/** Server-side COUNT matching the filters (reads meta.total) — for stat tiles. */
export async function countTeachers(filters: TeacherFilters = {}): Promise<number> {
  const result = await listTeachersPage({ ...filters, limit: 1 });
  return result.meta?.total ?? result.data.length;
}

export async function getTeacher(id: string): Promise<Teacher | null> {
  try {
    return await apiRequest<Teacher>(`/api/teachers/${id}`);
  } catch (e) {
    // A missing record is an expected outcome here, not an error to surface.
    if (e instanceof Error && "status" in e && (e as { status: number }).status === 404) {
      return null;
    }
    throw e;
  }
}

export async function createTeacher(values: TeacherFormValues): Promise<Teacher> {
  return apiRequest<Teacher>("/api/teachers", { method: "POST", body: values });
}

export async function updateTeacher(id: string, values: TeacherFormValues): Promise<Teacher> {
  return apiRequest<Teacher>(`/api/teachers/${id}`, { method: "PUT", body: values });
}

export async function deleteTeacher(id: string): Promise<void> {
  await apiRequest<void>(`/api/teachers/${id}`, { method: "DELETE" });
}

export interface TeacherReviewResult {
  id: string;
  rating: number;
  reviewNote: string;
  reviewedAt: string;
  reviewedBy: string;
}

/** Persist a performance review (rating 0–5 + note). Rating is otherwise read-only. */
export async function reviewTeacher(
  id: string,
  input: { rating: number; note: string }
): Promise<TeacherReviewResult> {
  return apiRequest<TeacherReviewResult>(`/api/teachers/${id}/review`, {
    method: "POST",
    body: input,
  });
}

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

export async function listTeachers(filters: TeacherFilters = {}): Promise<Teacher[]> {
  const result = await apiList<Teacher>("/api/teachers", {
    query: {
      search: filters.search,
      status: filters.status,
      employmentType: filters.employmentType,
      limit: 200,
    },
  });

  // `subjects` is an array, so it isn't an exact-match server filter — narrow
  // it here rather than adding a bespoke endpoint for one control.
  if (filters.subject) {
    return result.data.filter((t) => t.subjects.includes(filters.subject!));
  }
  return result.data;
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

import { apiRequest, apiList } from "./client";
import type { Student, StudentFormValues } from "@/types/student";

/**
 * Students API — now backed by the real server.
 *
 * The exported function signatures are unchanged from the previous in-memory
 * version, so every page that consumed them keeps working untouched.
 */

export const CLASS_OPTIONS = ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"];
export const SECTION_OPTIONS = ["A", "B", "C", "D"];

export interface StudentFilters {
  search?: string;
  className?: string;
  status?: string;
}

export async function listStudents(filters: StudentFilters = {}): Promise<Student[]> {
  const result = await apiList<Student>("/api/students", {
    query: {
      search: filters.search,
      className: filters.className,
      status: filters.status,
      // The UI pages, filter and paginate client-side, so pull a full page.
      limit: 200,
    },
  });
  return result.data;
}

export async function getStudent(id: string): Promise<Student | null> {
  try {
    return await apiRequest<Student>(`/api/students/${id}`);
  } catch (e) {
    // A missing record is an expected outcome here, not an error to surface.
    if (e instanceof Error && "status" in e && (e as { status: number }).status === 404) {
      return null;
    }
    throw e;
  }
}

export async function createStudent(values: StudentFormValues): Promise<Student> {
  return apiRequest<Student>("/api/students", { method: "POST", body: values });
}

export async function updateStudent(id: string, values: StudentFormValues): Promise<Student> {
  return apiRequest<Student>(`/api/students/${id}`, { method: "PUT", body: values });
}

export async function deleteStudent(id: string): Promise<void> {
  await apiRequest<void>(`/api/students/${id}`, { method: "DELETE" });
}

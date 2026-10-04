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

export interface StudentPage {
  data: Student[];
  meta: { total: number; page: number; limit: number; pages: number };
}

/** One page of students, keeping the `meta` (total/pages) the list UI needs. */
export async function listStudentsPage(
  filters: StudentFilters & { page?: number; limit?: number } = {}
): Promise<StudentPage> {
  return apiList<Student>("/api/students", {
    query: {
      search: filters.search,
      className: filters.className,
      status: filters.status,
      page: filters.page,
      // Server caps at 500; default page size matches the old behaviour.
      limit: filters.limit ?? 200,
    },
  });
}

export async function listStudents(filters: StudentFilters = {}): Promise<Student[]> {
  const { data } = await listStudentsPage({ ...filters, limit: 200 });
  return data;
}

/**
 * EVERY matching student across all pages — for exports and ID/roll numbering
 * where a complete, uncapped set matters (not just the first page). Loops at the
 * server's max page size.
 */
export async function fetchAllStudents(filters: StudentFilters = {}): Promise<Student[]> {
  const first = await listStudentsPage({ ...filters, page: 1, limit: 500 });
  // Dedupe by id. Offset pagination runs each page as a separate query, so a
  // record churn between requests can make the same student span a page boundary
  // (appearing twice) — harmful for the callers this exists for: PDF export
  // (double-listed) and bulk numbering (a duplicate skews the next roll/adm no.).
  // A stable server sort (_id tiebreaker) keeps ties deterministic; this Map
  // guarantees uniqueness regardless.
  const byId = new Map<string, Student>();
  for (const s of first.data) byId.set(s.id, s);
  const rawPages = first.meta?.pages ?? 1;
  const pages = Number.isFinite(rawPages) && rawPages > 1 ? Math.floor(rawPages) : 1;
  for (let p = 2; p <= pages; p++) {
    const next = await listStudentsPage({ ...filters, page: p, limit: 500 });
    for (const s of next.data) byId.set(s.id, s);
  }
  return [...byId.values()];
}

/**
 * Server-side COUNT of students matching the filters, read from the list meta
 * (not the rows) — never truncated by a page limit. Used where only a total is
 * needed (stat cards, teacher dashboard tallies).
 */
export async function countStudents(filters: StudentFilters = {}): Promise<number> {
  const result = await listStudentsPage({ ...filters, limit: 1 });
  return result.meta?.total ?? result.data.length;
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

export type PromotionAction = "promote" | "retain" | "graduate";

export interface PromotionDecision {
  studentId: string;
  action: PromotionAction;
  /** Required when action === "promote": the class to move the student into. */
  toClass?: string;
}

export interface PromotionResult {
  promoted: number;
  retained: number;
  graduated: number;
  /** Requested students that were skipped (already promoted this session, not active, or not found). */
  skipped: number;
}

export async function promoteStudents(
  promotions: PromotionDecision[],
  session: string
): Promise<PromotionResult> {
  return apiRequest<PromotionResult>("/api/students/promote", {
    method: "POST",
    body: { session, promotions },
  });
}

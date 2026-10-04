"use client";

import { useCallback } from "react";
import { listStudentsPage, type StudentFilters } from "@/lib/api/students";
import type { Student } from "@/types/student";
import { useAsyncList } from "./useAsyncList";

/** Rows the browse view loads at once — the server's hard page cap. */
export const STUDENT_BROWSE_LIMIT = 500;

export function useStudents(filters: StudentFilters) {
  const { search, className, status } = filters;

  // Browse page size raised to the server max (500) so the roster, stat quick
  // filters and client-side pagination see far more than one 200-row page. The
  // authoritative total still comes from the server aggregate on the page.
  const fetcher = useCallback(
    () => listStudentsPage({ search, className, status, limit: STUDENT_BROWSE_LIMIT }).then((r) => r.data),
    [search, className, status]
  );

  const { items, loading, error, refetch } = useAsyncList<Student>(fetcher);
  // True when the fetch filled the whole page — i.e. MORE students match the
  // current filter than are loaded here, so this on-screen set is incomplete.
  // This is about THIS filtered query hitting the cap, not the whole-school
  // total, so it never fires just because a class filter narrows the list.
  const capped = items.length >= STUDENT_BROWSE_LIMIT;
  return { students: items, loading, error, refetch, capped };
}

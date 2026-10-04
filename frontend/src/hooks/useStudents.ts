"use client";

import { useCallback } from "react";
import { listStudentsPage, type StudentFilters } from "@/lib/api/students";
import type { Student } from "@/types/student";
import { useAsyncList } from "./useAsyncList";

export function useStudents(filters: StudentFilters) {
  const { search, className, status } = filters;

  // Browse page size raised to the server max (500) so the roster, stat quick
  // filters and client-side pagination see far more than one 200-row page. The
  // authoritative total still comes from the server aggregate on the page.
  const fetcher = useCallback(
    () => listStudentsPage({ search, className, status, limit: 500 }).then((r) => r.data),
    [search, className, status]
  );

  const { items, loading, error, refetch } = useAsyncList<Student>(fetcher);
  return { students: items, loading, error, refetch };
}

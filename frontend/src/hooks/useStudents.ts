"use client";

import { useCallback } from "react";
import { listStudents, type StudentFilters } from "@/lib/api/students";
import type { Student } from "@/types/student";
import { useAsyncList } from "./useAsyncList";

export function useStudents(filters: StudentFilters) {
  const { search, className, status } = filters;

  const fetcher = useCallback(
    () => listStudents({ search, className, status }),
    [search, className, status]
  );

  const { items, loading, error, refetch } = useAsyncList<Student>(fetcher);
  return { students: items, loading, error, refetch };
}

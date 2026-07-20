"use client";

import { useCallback } from "react";
import { listTeachers, type TeacherFilters } from "@/lib/api/teachers";
import type { Teacher } from "@/types/teacher";
import { useAsyncList } from "./useAsyncList";

export function useTeachers(filters: TeacherFilters) {
  const { search, subject, status, employmentType } = filters;

  const fetcher = useCallback(
    () => listTeachers({ search, subject, status, employmentType }),
    [search, subject, status, employmentType]
  );

  const { items, loading, error, refetch } = useAsyncList<Teacher>(fetcher);
  return { teachers: items, loading, error, refetch };
}

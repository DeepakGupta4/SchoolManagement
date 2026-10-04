"use client";

import { useCallback } from "react";
import { fetchAllTeachers, type TeacherFilters } from "@/lib/api/teachers";
import type { Teacher } from "@/types/teacher";
import { useAsyncList } from "./useAsyncList";

export function useTeachers(filters: TeacherFilters) {
  const { search, subject, status, employmentType } = filters;

  // Complete filtered set (all pages) so the browse view, counts and sort aren't
  // truncated at one 200-row page; filters (incl. subject) are applied server-side.
  const fetcher = useCallback(
    () => fetchAllTeachers({ search, subject, status, employmentType }),
    [search, subject, status, employmentType]
  );

  const { items, loading, error, refetch } = useAsyncList<Teacher>(fetcher);
  return { teachers: items, loading, error, refetch };
}

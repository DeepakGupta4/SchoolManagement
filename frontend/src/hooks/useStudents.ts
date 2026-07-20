"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { listStudents, type StudentFilters } from "@/lib/api/students";
import type { Student } from "@/types/student";

/**
 * Fetches the student list and re-fetches whenever filters change.
 * Stale responses are discarded so fast typing can't render old results.
 */
export function useStudents(filters: StudentFilters) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const { search, className, status } = filters;

  const fetchStudents = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const data = await listStudents({ search, className, status });
      if (id !== requestId.current) return; // a newer request already won
      setStudents(data);
    } catch (e) {
      if (id !== requestId.current) return;
      setError(e instanceof Error ? e.message : "Failed to load students.");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [search, className, status]);

  useEffect(() => {
    // Debounce so each keystroke in the search box isn't a request.
    const timer = setTimeout(fetchStudents, 250);
    return () => clearTimeout(timer);
  }, [fetchStudents]);

  return { students, loading, error, refetch: fetchStudents };
}

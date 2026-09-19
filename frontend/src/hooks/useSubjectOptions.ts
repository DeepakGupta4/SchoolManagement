"use client";

import { useEffect, useMemo, useState } from "react";
import { subjectsApi, type SchoolSubject } from "@/lib/api/subjects";

export interface SubjectOptionsResult {
  /** Raw subject records from the Subjects module. */
  subjects: SchoolSubject[];
  /** Subject names, e.g. ["Mathematics", "Physics"]. Empty until the user adds any. */
  subjectNames: string[];
  /** Ready-to-use <Select> options for subject pickers. */
  subjectOptions: { label: string; value: string }[];
  loading: boolean;
}

// Module-level cache so navigating between pages doesn't flash an empty list
// while the subjects refetch. Refreshed on every mount so newly-added subjects
// appear without a reload.
let cache: SchoolSubject[] | null = null;

/**
 * Single source of truth for subject dropdowns across the app. Reads the
 * subjects the school has created in "Subjects" so every module stays in sync —
 * add a subject once and it appears everywhere.
 */
export function useSubjectOptions(): SubjectOptionsResult {
  const [subjects, setSubjects] = useState<SchoolSubject[]>(cache ?? []);
  const [loading, setLoading] = useState(cache === null);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      subjectsApi
        .list()
        .then((all) => {
          if (cancelled) return;
          cache = all;
          setSubjects(all);
          setLoading(false);
        })
        .catch(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);

  return useMemo(() => {
    const subjectNames = subjects.map((s) => s.name);

    return {
      subjects,
      subjectNames,
      subjectOptions: subjectNames.map((s) => ({ label: s, value: s })),
      loading,
    };
  }, [subjects, loading]);
}

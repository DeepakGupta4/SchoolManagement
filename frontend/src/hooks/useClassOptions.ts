"use client";

import { useEffect, useMemo, useState } from "react";
import { classesApi, type SchoolClass } from "@/lib/api/classes";

/** Sections used when a class defines none of its own, so a dropdown is never empty. */
const DEFAULT_SECTIONS = ["A", "B", "C", "D"];

export interface ClassOptionsResult {
  /** Raw class records from the Classes & Sections module. */
  classes: SchoolClass[];
  /** Class names, e.g. ["Class 6", "Class 7"]. Empty until the user adds any. */
  classNames: string[];
  /** Ready-to-use <Select> options for class pickers. */
  classOptions: { label: string; value: string }[];
  /** Distinct sections across all classes (falls back to A–D when none exist). */
  sections: string[];
  /** Ready-to-use <Select> options for section pickers. */
  sectionOptions: { label: string; value: string }[];
  /** Sections declared on a specific class, or the distinct fallback. */
  sectionsFor: (className: string) => string[];
  loading: boolean;
}

// Module-level cache so navigating between pages doesn't flash an empty list
// while the classes refetch. Refreshed on every mount so newly-added classes
// appear without a reload.
let cache: SchoolClass[] | null = null;

/**
 * Single source of truth for class/section dropdowns across the app. Reads the
 * classes the school has created in "Classes & Sections" so every module stays
 * in sync — add a class once and it appears everywhere.
 */
export function useClassOptions(): ClassOptionsResult {
  const [classes, setClasses] = useState<SchoolClass[]>(cache ?? []);
  const [loading, setLoading] = useState(cache === null);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      classesApi
        .list()
        .then((all) => {
          if (cancelled) return;
          cache = all;
          setClasses(all);
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
    const classNames = classes.map((c) => c.name);
    const sectionSet = new Set<string>();
    classes.forEach((c) => (c.sections ?? []).forEach((s) => sectionSet.add(s)));
    const sections = sectionSet.size > 0 ? [...sectionSet].sort() : DEFAULT_SECTIONS;

    const sectionsFor = (className: string) => {
      const found = classes.find((c) => c.name === className);
      return found && found.sections?.length ? found.sections : sections;
    };

    return {
      classes,
      classNames,
      classOptions: classNames.map((c) => ({ label: c, value: c })),
      sections,
      sectionOptions: sections.map((s) => ({ label: s, value: s })),
      sectionsFor,
      loading,
    };
  }, [classes, loading]);
}

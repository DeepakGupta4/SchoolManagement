// Orders class names into real academic sequence regardless of the order they
// were created in. Pre-primary grades rank below Class 1; numbered grades sort
// by their number; anything unrecognised sinks to the end.
const GRADE_PREFIX: Record<string, number> = { nursery: -3, lkg: -2, ukg: -1, kg: -1, prep: -1 };

export function classRank(name: string): number {
  const lower = name.toLowerCase().trim();
  for (const key of Object.keys(GRADE_PREFIX)) {
    if (lower.includes(key)) return GRADE_PREFIX[key];
  }
  const m = name.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 999;
}

/** Class names sorted into academic order (Nursery → Class 12). */
export function sortClasses(names: string[]): string[] {
  return [...names].sort((a, b) => classRank(a) - classRank(b));
}

/**
 * Whether a fee structure's class covers a student's class. A structure may be a
 * single class ("Class 6") or a BAND ("Nursery-UKG", "Class 1-5") — a band covers
 * any class whose academic rank falls between its two endpoints. Mirrors the
 * backend `classMatchesStructure`, so the admission form shows exactly the
 * structures the server would bill the student from.
 */
export function classMatchesStructure(structureClass: string, studentClass: string): boolean {
  const sc = (structureClass ?? "").trim();
  const st = (studentClass ?? "").trim();
  if (!sc || !st) return false;
  if (sc.toLowerCase() === st.toLowerCase()) return true; // exact
  const dash = sc.indexOf("-");
  if (dash > 0) {
    const loR = classRank(sc.slice(0, dash));
    const hiR = classRank(sc.slice(dash + 1));
    // Only a band when BOTH endpoints are real grades, so a custom hyphenated name
    // (e.g. "Pre-Primary") can't accidentally match a range.
    if (loR !== 999 && hiR !== 999) {
      const stR = classRank(st);
      if (stR >= Math.min(loR, hiR) && stR <= Math.max(loR, hiR)) return true;
    }
  }
  return false;
}

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

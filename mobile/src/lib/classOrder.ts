/** Academic ordering for class names — Pre-Nursery → Nursery → LKG → UKG → 1…12.
 *  Plain alphabetical sorts "Class 10" before "Class 2" and "LKG" before
 *  "Nursery", so selectors use this key to read bottom-up like a real school. */

const PRE: Record<string, number> = {
  playgroup: -6,
  pg: -6,
  "pre-nursery": -5,
  prenursery: -5,
  "pre nursery": -5,
  nursery: -4,
  "pre-kg": -4,
  lkg: -3,
  "kg1": -3,
  ukg: -2,
  "kg2": -2,
  kg: -2,
};

/** Lower = earlier (Nursery before Class 1 before Class 12). */
export function classSortKey(name: string): number {
  const s = (name || "").replace(/^class\s*/i, "").trim().toLowerCase();
  if (s in PRE) return PRE[s];
  const n = parseInt(s, 10);
  if (!Number.isNaN(n)) return n; // "1".."12" (and "10-A" → 10)
  return 1000 + (s.charCodeAt(0) || 0); // unknown labels sort last, alpha-ish
}

/** Sort class-name strings bottom-up. */
export const sortClassNames = (names: string[]): string[] =>
  [...names].sort((a, b) => classSortKey(a) - classSortKey(b) || a.localeCompare(b));

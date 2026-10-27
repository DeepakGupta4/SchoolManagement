/**
 * The SINGLE source of grade truth. Grades are never stored — they are derived
 * from a percentage against the school's own grading scheme at read/render time,
 * so re-configuring the scheme instantly re-grades historical marks.
 *
 * The frontend mirrors this file exactly (frontend/src/lib/grading.ts); keep the
 * default and the resolver identical in both so a card and a list never disagree.
 */

export interface GradeBand {
  grade: string;
  minPercent: number;
  maxPercent: number;
  gradePoint: number;
  remark: string;
}

export interface GradingScheme {
  enabled: boolean;
  passPercent: number;
  bands: GradeBand[];
}

/** CBSE-style default, used until a school configures its own. */
export const DEFAULT_GRADING_SCHEME: GradingScheme = {
  enabled: true,
  passPercent: 33,
  bands: [
    { grade: "A1", minPercent: 91, maxPercent: 100, gradePoint: 10, remark: "Outstanding" },
    { grade: "A2", minPercent: 81, maxPercent: 90, gradePoint: 9, remark: "Excellent" },
    { grade: "B1", minPercent: 71, maxPercent: 80, gradePoint: 8, remark: "Very Good" },
    { grade: "B2", minPercent: 61, maxPercent: 70, gradePoint: 7, remark: "Good" },
    { grade: "C1", minPercent: 51, maxPercent: 60, gradePoint: 6, remark: "Fair" },
    { grade: "C2", minPercent: 41, maxPercent: 50, gradePoint: 5, remark: "Satisfactory" },
    { grade: "D", minPercent: 33, maxPercent: 40, gradePoint: 4, remark: "Needs Improvement" },
    { grade: "E", minPercent: 0, maxPercent: 32, gradePoint: 0, remark: "Unsatisfactory" },
  ],
};

/** A usable scheme: the given one if it has bands, else the default. */
export function effectiveScheme(scheme?: Partial<GradingScheme> | null): GradingScheme {
  if (scheme && Array.isArray(scheme.bands) && scheme.bands.length > 0) {
    return {
      enabled: scheme.enabled !== false,
      passPercent: typeof scheme.passPercent === "number" ? scheme.passPercent : DEFAULT_GRADING_SCHEME.passPercent,
      bands: scheme.bands as GradeBand[],
    };
  }
  return DEFAULT_GRADING_SCHEME;
}

/** The band a percentage falls into → {grade, gradePoint, remark}. Never throws. */
export function gradeForPercent(
  scheme: Partial<GradingScheme> | null | undefined,
  pct: number
): { grade: string; gradePoint: number; remark: string } {
  const s = effectiveScheme(scheme);
  const p = Math.max(0, Math.min(100, Math.round(Number.isFinite(pct) ? pct : 0)));
  const hit = s.bands.find((b) => p >= b.minPercent && p <= b.maxPercent);
  const band = hit ?? [...s.bands].sort((a, b) => a.minPercent - b.minPercent)[0];
  if (!band) return { grade: "", gradePoint: 0, remark: "" };
  return { grade: band.grade, gradePoint: band.gradePoint, remark: band.remark };
}

/** The pass cut-off percent for a scheme. */
export function passPercentOf(scheme?: Partial<GradingScheme> | null): number {
  return scheme && typeof scheme.passPercent === "number" ? scheme.passPercent : DEFAULT_GRADING_SCHEME.passPercent;
}

/**
 * Bands must be valid and cover 0–100 with no gaps or overlaps (integer cut-offs):
 * each 0≤min≤max≤100, gradePoint≥0, the lowest band starts at 0, the highest ends
 * at 100, and each band starts one percent above the previous band's max.
 */
export function validateGradingScheme(bands: unknown): boolean {
  if (!Array.isArray(bands) || bands.length === 0) return false;
  const list = bands as GradeBand[];
  for (const b of list) {
    if (typeof b.minPercent !== "number" || typeof b.maxPercent !== "number") return false;
    if (b.minPercent > b.maxPercent) return false;
    if (b.minPercent < 0 || b.maxPercent > 100) return false;
    if (typeof b.gradePoint !== "number" || b.gradePoint < 0) return false;
    if (typeof b.grade !== "string" || b.grade.trim().length === 0) return false;
  }
  const sorted = [...list].sort((a, b) => a.minPercent - b.minPercent);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (!first || !last) return false;
  if (first.minPercent !== 0 || last.maxPercent !== 100) return false;
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]!;
    const cur = sorted[i]!;
    if (cur.minPercent !== prev.maxPercent + 1) return false;
  }
  return true;
}

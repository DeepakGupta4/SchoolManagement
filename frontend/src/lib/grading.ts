/**
 * Grade resolver — MIRRORS backend/src/utils/grading.ts exactly. Grades are
 * derived from a percentage against the school's scheme, so every page (mark
 * entry, report card, merit list, portal) shows the same letter and point.
 * Keep the default and gradeForPercent identical to the backend copy.
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

export function passPercentOf(scheme?: Partial<GradingScheme> | null): number {
  return scheme && typeof scheme.passPercent === "number" ? scheme.passPercent : DEFAULT_GRADING_SCHEME.passPercent;
}

/** Whether a percentage is a pass under the scheme. */
export function isPass(scheme: Partial<GradingScheme> | null | undefined, pct: number): boolean {
  return pct >= passPercentOf(scheme);
}

/** Same gap-free 0–100 validation as the backend, for the Settings editor. */
export function validateGradingScheme(bands: GradeBand[]): boolean {
  if (!Array.isArray(bands) || bands.length === 0) return false;
  for (const b of bands) {
    if (typeof b.minPercent !== "number" || typeof b.maxPercent !== "number") return false;
    if (b.minPercent > b.maxPercent) return false;
    if (b.minPercent < 0 || b.maxPercent > 100) return false;
    if (typeof b.gradePoint !== "number" || b.gradePoint < 0) return false;
    if (!b.grade || !b.grade.trim()) return false;
  }
  const sorted = [...bands].sort((a, b) => a.minPercent - b.minPercent);
  if (sorted[0].minPercent !== 0 || sorted[sorted.length - 1].maxPercent !== 100) return false;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].minPercent !== sorted[i - 1].maxPercent + 1) return false;
  }
  return true;
}

/** Semantic-token chip classes for list pages (pass/fail + how high the grade). */
export function gradeToneClass(gradePoint: number, passed: boolean): string {
  if (!passed) return "bg-danger-soft text-danger-text";
  if (gradePoint >= 9) return "bg-success-soft text-success-text";
  if (gradePoint >= 7) return "bg-info-soft text-info-text";
  if (gradePoint >= 5) return "bg-warning-soft text-warning-text";
  return "bg-surface-hover text-muted";
}

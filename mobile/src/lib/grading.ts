import type { GradingScheme, GradingBand } from "@/api/schools";

/** CBSE-style fallback scale, used when the school hasn't set up its own. */
export const DEFAULT_GRADING_SCHEME: GradingScheme = {
  enabled: true,
  passPercent: 33,
  bands: [
    { grade: "A1", minPercent: 91, maxPercent: 100, gradePoint: 10, remark: "Outstanding" },
    { grade: "A2", minPercent: 81, maxPercent: 90, gradePoint: 9, remark: "Excellent" },
    { grade: "B1", minPercent: 71, maxPercent: 80, gradePoint: 8, remark: "Very good" },
    { grade: "B2", minPercent: 61, maxPercent: 70, gradePoint: 7, remark: "Good" },
    { grade: "C1", minPercent: 51, maxPercent: 60, gradePoint: 6, remark: "Fair" },
    { grade: "C2", minPercent: 41, maxPercent: 50, gradePoint: 5, remark: "Satisfactory" },
    { grade: "D", minPercent: 33, maxPercent: 40, gradePoint: 4, remark: "Needs improvement" },
    { grade: "E", minPercent: 0, maxPercent: 32, gradePoint: 0, remark: "Unsatisfactory" },
  ],
};

/** Band whose range contains `pct` (clamped 0–100); last band is the safe fallback. */
export function gradeForPercent(scheme: GradingScheme, pct: number): GradingBand {
  const p = Math.max(0, Math.min(100, Math.round(pct)));
  const bands = scheme.bands?.length ? scheme.bands : DEFAULT_GRADING_SCHEME.bands;
  return bands.find((b) => p >= b.minPercent && p <= b.maxPercent) ?? bands[bands.length - 1];
}

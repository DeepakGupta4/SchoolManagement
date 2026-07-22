import type { Student } from "@/types/student";

/**
 * Rule-based student risk scoring.
 *
 * This is NOT an AI/LLM model — it is a transparent weighted formula over
 * attendance, academic performance and fee status. It exists to demonstrate
 * the "risk score" concept from the product vision with numbers a school can
 * actually reason about. Swap in a trained model later behind the same shape.
 */

export type RiskLevel = "low" | "medium" | "high";

export interface RiskAssessment {
  /** 0-100. Higher = more at risk. */
  score: number;
  level: RiskLevel;
  /** Human-readable drivers, most significant first. */
  factors: string[];
  /** One-line recommended action, or null when nothing is flagged. */
  recommendation: string | null;
}

export function assessStudent(student: Student): RiskAssessment {
  const factors: string[] = [];
  let score = 0;

  // Attendance — the strongest predictor a school watches.
  if (student.attendancePercent < 60) {
    score += 45;
    factors.push(`Attendance critically low at ${student.attendancePercent}%`);
  } else if (student.attendancePercent < 75) {
    score += 28;
    factors.push(`Attendance below the 75% threshold (${student.attendancePercent}%)`);
  } else if (student.attendancePercent < 85) {
    score += 12;
    factors.push(`Attendance slipping (${student.attendancePercent}%)`);
  }

  // Academic performance.
  if (student.performancePercent < 40) {
    score += 35;
    factors.push(`Failing average at ${student.performancePercent}%`);
  } else if (student.performancePercent < 55) {
    score += 20;
    factors.push(`Academic performance weak (${student.performancePercent}%)`);
  } else if (student.performancePercent < 65) {
    score += 8;
    factors.push(`Performance below class expectation (${student.performancePercent}%)`);
  }

  // Fee dues can signal disengagement or hardship worth a conversation.
  if (student.feeDue > 8000) {
    score += 20;
    factors.push(`Significant fee dues (₹${student.feeDue.toLocaleString("en-IN")})`);
  } else if (student.feeDue > 0) {
    score += 8;
    factors.push(`Outstanding fees of ₹${student.feeDue.toLocaleString("en-IN")}`);
  }

  score = Math.min(100, score);

  const level: RiskLevel = score >= 55 ? "high" : score >= 30 ? "medium" : "low";

  const recommendation =
    level === "high"
      ? "Parent meeting recommended — flag to class teacher and counsellor."
      : level === "medium"
        ? "Monitor closely; a check-in with the guardian would help."
        : null;

  return { score, level, factors, recommendation };
}

export const RISK_META: Record<RiskLevel, { label: string; variant: "danger" | "warning" | "success" }> = {
  high: { label: "High risk", variant: "danger" },
  medium: { label: "Needs attention", variant: "warning" },
  low: { label: "On track", variant: "success" },
};

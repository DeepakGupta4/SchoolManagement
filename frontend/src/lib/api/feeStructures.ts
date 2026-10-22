import { createApiResource } from "./createApiResource";

/** How often a fee head is charged. */
export type FeeFrequency = "monthly" | "one-time" | "per-exam";

export const FREQUENCY_LABELS: Record<FeeFrequency, string> = {
  monthly: "Monthly",
  "one-time": "One-time",
  "per-exam": "Per-exam",
};

export interface FeeHead {
  name: string;
  amount: number;
  frequency: FeeFrequency;
}

export interface FeeStructure {
  id: string;
  /** Human-facing structure code, e.g. "FS001". Must stay unique. */
  code: string;
  class: string;
  /** The school's chosen fee heads (name + amount + frequency) — the source of truth. */
  heads: FeeHead[];
  /** Months a monthly head recurs over a session (installments), and exams/year. */
  monthsPerYear?: number;
  examsPerYear?: number;
  // Legacy fixed columns — present only on structures created before `heads`
  // existed; read via structureHeads() as a fallback.
  tuition?: number;
  transport?: number;
  lab?: number;
  library?: number;
  sports?: number;
  misc?: number;
}

/** Billing cadence defaults when a structure predates these fields. */
export const DEFAULT_MONTHS_PER_YEAR = 12;
export const DEFAULT_EXAMS_PER_YEAR = 3;

export interface FeeStructureFilters {
  search?: string;
}

/** Legacy fixed heads — used only to read structures created before flexible `heads`. */
export const FEE_HEADS: {
  key: "tuition" | "transport" | "lab" | "library" | "sports" | "misc";
  header: string;
  label: string;
}[] = [
  { key: "tuition", header: "Tuition (₹)", label: "Tuition" },
  { key: "transport", header: "Transport (₹)", label: "Transport" },
  { key: "lab", header: "Lab (₹)", label: "Lab" },
  { key: "library", header: "Library (₹)", label: "Library" },
  { key: "sports", header: "Sports (₹)", label: "Sports" },
  { key: "misc", header: "Misc (₹)", label: "Misc" },
];

/**
 * A sensible default frequency for a head name — tuition/transport recur monthly,
 * exams are per-exam, everything else is one-time. Used for preset defaults, for
 * custom heads, and to classify legacy structures that have no stored frequency.
 */
export function defaultFrequencyFor(name: string): FeeFrequency {
  const n = name.trim().toLowerCase();
  if (n.includes("tuition") || n.includes("transport")) return "monthly";
  // Exam fee and report-card fee are separate heads, both charged per exam/term.
  if (n.includes("exam") || n.includes("report card")) return "per-exam";
  return "one-time";
}

/**
 * Common fee heads a school can one-tap add in the structure form (they can also
 * type a custom one), each with its usual frequency. "Transport" is a flat
 * fallback — real transport is billed per student from their bus route's fee.
 */
export const COMMON_FEE_HEADS: { name: string; frequency: FeeFrequency }[] = [
  { name: "Tuition", frequency: "monthly" },
  { name: "Admission", frequency: "one-time" },
  { name: "Exam Fee", frequency: "per-exam" },
  { name: "Computer", frequency: "monthly" },
  { name: "Lab", frequency: "one-time" },
  { name: "Library", frequency: "one-time" },
  { name: "Sports", frequency: "one-time" },
  { name: "Activity", frequency: "one-time" },
  { name: "Smart Class", frequency: "monthly" },
  { name: "ID Card", frequency: "one-time" },
  { name: "Report Card", frequency: "per-exam" },
  { name: "Diary", frequency: "one-time" },
  { name: "Uniform (Tie & Belt)", frequency: "one-time" },
  { name: "Development", frequency: "one-time" },
  { name: "Maintenance", frequency: "one-time" },
  { name: "Transport", frequency: "monthly" },
  { name: "Misc", frequency: "one-time" },
];

/**
 * The structure's heads, normalised: the flexible `heads` array when it bills
 * something, otherwise synthesised from the legacy fixed columns. Every head
 * carries a frequency (defaulted by name when missing — e.g. legacy data).
 */
export function structureHeads(row: FeeStructure): FeeHead[] {
  if (row.heads && row.heads.length > 0) {
    const flex = row.heads
      .filter((h) => h.name?.trim() && Number(h.amount) > 0)
      .map((h) => ({
        name: h.name,
        amount: Number(h.amount),
        frequency: (h.frequency as FeeFrequency) || defaultFrequencyFor(h.name),
      }));
    if (flex.length > 0) return flex;
  }
  // Legacy fixed columns were ALWAYS billed once as the stored amount — never a
  // per-period unit. Keep them one-time so they aren't retroactively annualised
  // (×12) when read, which mirrors the backend and avoids a silent 12× over-bill.
  // Migrate to flexible heads for true monthly instalments.
  return FEE_HEADS.map((h) => ({
    name: h.label,
    amount: Number(row[h.key] ?? 0),
    frequency: "one-time" as FeeFrequency,
  })).filter((h) => h.amount > 0);
}

/** Sum of every head's amount (the raw per-period figures). */
export const feeTotal = (row: FeeStructure) =>
  structureHeads(row).reduce((sum, h) => sum + (Number(h.amount) || 0), 0);

/** Fee split by frequency, so totals are shown honestly (not everything as "monthly"). */
export function feeBreakdown(heads: FeeHead[]): { monthly: number; oneTime: number; perExam: number } {
  const sumOf = (f: FeeFrequency) =>
    heads.filter((h) => h.frequency === f).reduce((s, h) => s + (Number(h.amount) || 0), 0);
  return { monthly: sumOf("monthly"), oneTime: sumOf("one-time"), perExam: sumOf("per-exam") };
}

/** How many times a frequency is charged across a session. Mirrors the backend. */
export function periodsFor(
  frequency: FeeFrequency,
  monthsPerYear: number,
  examsPerYear: number
): number {
  return frequency === "monthly" ? monthsPerYear : frequency === "per-exam" ? examsPerYear : 1;
}

/**
 * The full session (annual) bill — every head's per-period amount multiplied by
 * how many times it recurs (monthly × months, per-exam × exams, one-time × 1).
 * This is what the student is actually billed; it's then collected in instalments.
 */
export function annualTotal(
  heads: FeeHead[],
  monthsPerYear = DEFAULT_MONTHS_PER_YEAR,
  examsPerYear = DEFAULT_EXAMS_PER_YEAR
): number {
  return heads.reduce(
    (sum, h) => sum + (Number(h.amount) || 0) * periodsFor(h.frequency, monthsPerYear, examsPerYear),
    0
  );
}

export const feeStructuresApi = createApiResource<FeeStructure, FeeStructureFilters>(
  "/api/fee-structures"
);

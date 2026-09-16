import { createApiResource } from "./createApiResource";

export interface Allocation {
  id: string;
  teacher: string;
  /** Employee ID, e.g. "TCH-1041". Must stay unique. */
  empId: string;
  dept: string;
  subject: string;
  classes: string[];
  periods: number;
  labs: number;
  room: string;
}

export interface AllocationFilters {
  search?: string;
  dept?: string;
  klass?: string;
  load?: string;
}

/** Periods a full-time teacher is contracted for in a week. */
export const MAX_PERIODS = 36;

export type LoadBand = "Overloaded" | "Optimal" | "Moderate" | "Under-used";

export const LOAD_BAND_OPTIONS: LoadBand[] = [
  "Overloaded",
  "Optimal",
  "Moderate",
  "Under-used",
];

/** Under 45% is under-used, 90% and over is an overload risk. */
export function loadPercent(periods: number) {
  return Math.min(100, Math.round((periods / MAX_PERIODS) * 100));
}

export function loadBandLabel(periods: number): LoadBand {
  const pct = loadPercent(periods);
  if (pct >= 90) return "Overloaded";
  if (pct >= 70) return "Optimal";
  if (pct >= 45) return "Moderate";
  return "Under-used";
}

export const ALLOCATION_DEPT_OPTIONS = [
  "Commerce",
  "Computer Science",
  "English",
  "Fine Arts",
  "Foreign Languages",
  "Hindi",
  "Mathematics",
  "Music & Dance",
  "Physical Education",
  "Sanskrit",
  "Science",
  "Social Science",
  "Special Education",
  "Vocational Studies",
];

export const ALLOCATION_CLASS_OPTIONS = [
  "VI-A",
  "VI-B",
  "VII-A",
  "VII-B",
  "VIII-A",
  "VIII-B",
  "IX-A",
  "IX-B",
  "X-A",
  "X-B",
  "X-C",
  "XI-A",
  "XI-B",
  "XI-C",
  "XII-A",
  "XII-B",
  "XII-C",
];

export const allocationsApi = createApiResource<Allocation, AllocationFilters>("/api/allocations");

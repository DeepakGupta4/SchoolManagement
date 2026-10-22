import { createApiResource } from "./createApiResource";

export interface FeeHead {
  name: string;
  amount: number;
}

export interface FeeStructure {
  id: string;
  /** Human-facing structure code, e.g. "FS001". Must stay unique. */
  code: string;
  class: string;
  /** The school's chosen fee heads (name + monthly amount) — the source of truth. */
  heads: FeeHead[];
  // Legacy fixed columns — present only on structures created before `heads`
  // existed; read via structureHeads() as a fallback.
  tuition?: number;
  transport?: number;
  lab?: number;
  library?: number;
  sports?: number;
  misc?: number;
}

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
 * Common fee heads a school can one-tap add in the structure form (they can also
 * type a custom one). "Transport" is only a flat fallback — real transport is
 * billed per student from their assigned bus route's fee.
 */
export const COMMON_FEE_HEADS = [
  "Tuition",
  "Admission",
  "Examination",
  "Computer",
  "Lab",
  "Library",
  "Sports",
  "Activity",
  "Smart Class",
  "ID Card",
  "Report Card",
  "Diary",
  "Uniform (Tie & Belt)",
  "Development",
  "Maintenance",
  "Transport",
  "Misc",
];

/**
 * The structure's heads, normalised: the flexible `heads` array when present,
 * otherwise synthesised from the legacy fixed columns. Non-positive heads dropped.
 */
export function structureHeads(row: FeeStructure): FeeHead[] {
  if (row.heads && row.heads.length > 0) {
    return row.heads.filter((h) => h.name?.trim() && Number(h.amount) > 0);
  }
  return FEE_HEADS.map((h) => ({ name: h.label, amount: Number(row[h.key] ?? 0) })).filter(
    (h) => h.amount > 0
  );
}

/** Monthly total — always derived from the heads so it can never go stale. */
export const feeTotal = (row: FeeStructure) =>
  structureHeads(row).reduce((sum, h) => sum + (Number(h.amount) || 0), 0);

export const feeStructuresApi = createApiResource<FeeStructure, FeeStructureFilters>(
  "/api/fee-structures"
);

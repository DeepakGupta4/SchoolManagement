import { createApiResource } from "./createApiResource";

export interface FeeStructure {
  id: string;
  /** Human-facing structure code, e.g. "FS001". Must stay unique. */
  code: string;
  class: string;
  tuition: number;
  transport: number;
  lab: number;
  library: number;
  sports: number;
  misc: number;
}

export interface FeeStructureFilters {
  search?: string;
}

/** Every fee head that makes up a structure's monthly total. */
export const FEE_HEADS: { key: keyof FeeStructure & string; header: string; label: string }[] = [
  { key: "tuition", header: "Tuition (₹)", label: "Tuition" },
  { key: "transport", header: "Transport (₹)", label: "Transport" },
  { key: "lab", header: "Lab (₹)", label: "Lab" },
  { key: "library", header: "Library (₹)", label: "Library" },
  { key: "sports", header: "Sports (₹)", label: "Sports" },
  { key: "misc", header: "Misc (₹)", label: "Misc" },
];

/** Total is always derived so an edited fee head can never leave it stale. */
export const feeTotal = (row: FeeStructure) =>
  FEE_HEADS.reduce((sum, head) => sum + (row[head.key] as number), 0);

export const feeStructuresApi = createApiResource<FeeStructure, FeeStructureFilters>(
  "/api/fee-structures"
);

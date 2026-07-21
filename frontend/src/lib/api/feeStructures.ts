import { createResource, textMatch } from "./createResource";

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

const seed: FeeStructure[] = [
  { id: "fst_001", code: "FS001", class: "Class 1-5",                 tuition: 4000, transport: 1500, lab: 0,    library: 300, sports: 500, misc: 200 },
  { id: "fst_002", code: "FS002", class: "Class 6-8",                 tuition: 5500, transport: 1500, lab: 500,  library: 400, sports: 600, misc: 300 },
  { id: "fst_003", code: "FS003", class: "Class 9-10",                tuition: 7000, transport: 1500, lab: 800,  library: 500, sports: 700, misc: 400 },
  { id: "fst_004", code: "FS004", class: "Class 11-12 (Science)",     tuition: 9000, transport: 1500, lab: 1500, library: 600, sports: 700, misc: 500 },
  { id: "fst_005", code: "FS005", class: "Class 11-12 (Commerce)",    tuition: 8000, transport: 1500, lab: 500,  library: 600, sports: 700, misc: 500 },
  { id: "fst_006", code: "FS006", class: "Class 11-12 (Arts)",        tuition: 7500, transport: 1500, lab: 0,    library: 600, sports: 700, misc: 500 },
];

export const feeStructuresApi = createResource<FeeStructure, FeeStructureFilters>({
  idPrefix: "fst",
  seed,
  uniqueBy: { field: "class", label: "Class" },
  defaults: { tuition: 0, transport: 0, lab: 0, library: 0, sports: 0, misc: 0 },
  matches: (row, { search }) => textMatch(search, row.class, row.code),
});

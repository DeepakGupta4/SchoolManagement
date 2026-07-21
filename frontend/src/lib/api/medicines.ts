import { createResource, textMatch } from "./createResource";

export interface Medicine {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  expiry: string;
  status: string;
}

export interface MedicineFilters {
  search?: string;
  status?: string;
}

export const MEDICINE_CATEGORY_OPTIONS = [
  "Analgesic",
  "Antibiotic",
  "Electrolyte",
  "Antacid",
  "First Aid",
];

export const MEDICINE_UNIT_OPTIONS = [
  "Tablets",
  "Capsules",
  "Sachets",
  "Bottles",
  "Rolls",
  "Tubes",
];

export const MEDICINE_STOCK_STATUS_OPTIONS = ["In Stock", "Low Stock", "Out of Stock"];

const seed: Medicine[] = [
  { id: "med_001", name: "Paracetamol 500mg", category: "Analgesic", stock: 240, unit: "Tablets", expiry: "Dec 2026", status: "In Stock" },
  { id: "med_002", name: "Amoxicillin 250mg", category: "Antibiotic", stock: 80, unit: "Capsules", expiry: "Jun 2026", status: "In Stock" },
  { id: "med_003", name: "ORS Sachets", category: "Electrolyte", stock: 12, unit: "Sachets", expiry: "Mar 2026", status: "Low Stock" },
  { id: "med_004", name: "Ibuprofen 400mg", category: "Analgesic", stock: 0, unit: "Tablets", expiry: "Sep 2026", status: "Out of Stock" },
  { id: "med_005", name: "Antacid Syrup", category: "Antacid", stock: 6, unit: "Bottles", expiry: "Nov 2025", status: "Low Stock" },
  { id: "med_006", name: "Bandages", category: "First Aid", stock: 50, unit: "Rolls", expiry: "—", status: "In Stock" },
  { id: "med_007", name: "Antiseptic Cream", category: "First Aid", stock: 18, unit: "Tubes", expiry: "Aug 2026", status: "In Stock" },
];

export const medicinesApi = createResource<Medicine, MedicineFilters>({
  idPrefix: "med",
  seed,
  uniqueBy: { field: "name", label: "Medicine name" },
  defaults: { stock: 0, status: "In Stock", expiry: "—" },
  matches: (row, { search, status }) => {
    if (status && status !== "All" && row.status !== status) return false;
    return textMatch(search, row.name, row.category);
  },
});

import { createApiResource } from "./createApiResource";

export interface Medicine {
  id: string;
  /** Human-facing stock reference shown in the UI, e.g. "MD-001". The `id` is
   *  internal and must never be displayed. */
  code: string;
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

export const medicinesApi = createApiResource<Medicine, MedicineFilters, "code">("/api/medicines");

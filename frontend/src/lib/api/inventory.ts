import { createApiResource } from "./createApiResource";

export interface InventoryItem {
  id: string;
  /** Human-facing item code shown in the UI, e.g. "INV-001". The `id` is
   *  internal and must never be displayed. */
  code: string;
  name: string;
  category: string;
  qty: number;
  minQty: number;
  unit: string;
  unitPrice: number;
  supplier: string;
  lastUpdated: string;
  status: string;
}

export interface InventoryFilters {
  search?: string;
  /** "All" or one of CATEGORY_OPTIONS. */
  category?: string;
  /** "All" or one of TAB_OPTIONS. */
  tab?: string;
}

export const CATEGORY_OPTIONS = [
  "Stationery",
  "Electronics",
  "Furniture",
  "Housekeeping",
  "Sports",
  "Lab",
  "Medical",
];

export const UNIT_OPTIONS = ["Reams", "Boxes", "Pcs", "Kits", "Sets"];

export const STATUS_OPTIONS = [
  { label: "In stock", value: "in-stock" },
  { label: "Low stock", value: "low-stock" },
  { label: "Out of stock", value: "out-of-stock" },
];

/** Stock-status tab label -> stored status value. */
export const TAB_TO_STATUS: Record<string, string> = {
  "In Stock": "in-stock",
  "Low Stock": "low-stock",
  "Out of Stock": "out-of-stock",
};

export const inventoryApi = createApiResource<InventoryItem, InventoryFilters, "code">(
  "/api/inventory"
);

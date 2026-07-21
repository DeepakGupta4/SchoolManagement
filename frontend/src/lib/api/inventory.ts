import { createResource, textMatch } from "./createResource";

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

const seed: InventoryItem[] = [
  { id: "inv_001", code: "INV-001", name: "A4 Paper Reams",         category: "Stationery",   qty: 120, minQty: 50,  unit: "Reams", unitPrice: 280,   supplier: "Paper World",   lastUpdated: "Jul 15, 2025", status: "in-stock" },
  { id: "inv_002", code: "INV-002", name: "Whiteboard Markers",     category: "Stationery",   qty: 45,  minQty: 30,  unit: "Boxes", unitPrice: 150,   supplier: "Office Mart",   lastUpdated: "Jul 12, 2025", status: "in-stock" },
  { id: "inv_003", code: "INV-003", name: "Printer Ink Cartridges", category: "Electronics",  qty: 8,   minQty: 10,  unit: "Pcs",   unitPrice: 1200,  supplier: "Tech Supplies", lastUpdated: "Jul 10, 2025", status: "low-stock" },
  { id: "inv_004", code: "INV-004", name: "Classroom Chairs",       category: "Furniture",    qty: 240, minQty: 200, unit: "Pcs",   unitPrice: 2500,  supplier: "Furniture Hub", lastUpdated: "Jun 20, 2025", status: "in-stock" },
  { id: "inv_005", code: "INV-005", name: "Projector Bulbs",        category: "Electronics",  qty: 3,   minQty: 5,   unit: "Pcs",   unitPrice: 3500,  supplier: "Tech Supplies", lastUpdated: "Jul 08, 2025", status: "low-stock" },
  { id: "inv_006", code: "INV-006", name: "Cleaning Supplies Kit",  category: "Housekeeping", qty: 60,  minQty: 20,  unit: "Kits",  unitPrice: 450,   supplier: "Clean Pro",     lastUpdated: "Jul 14, 2025", status: "in-stock" },
  { id: "inv_007", code: "INV-007", name: "Sports Balls (Football)",category: "Sports",       qty: 0,   minQty: 5,   unit: "Pcs",   unitPrice: 800,   supplier: "Sports World",  lastUpdated: "Jun 28, 2025", status: "out-of-stock" },
  { id: "inv_008", code: "INV-008", name: "Lab Chemicals Set",      category: "Lab",          qty: 15,  minQty: 10,  unit: "Sets",  unitPrice: 5500,  supplier: "Science Depot", lastUpdated: "Jul 05, 2025", status: "in-stock" },
  { id: "inv_009", code: "INV-009", name: "Notebooks (200 pages)",  category: "Stationery",   qty: 500, minQty: 100, unit: "Pcs",   unitPrice: 60,    supplier: "Paper World",   lastUpdated: "Jul 16, 2025", status: "in-stock" },
  { id: "inv_010", code: "INV-010", name: "First Aid Kits",         category: "Medical",      qty: 4,   minQty: 5,   unit: "Kits",  unitPrice: 1800,  supplier: "MedSupply Co.", lastUpdated: "Jul 01, 2025", status: "low-stock" },
  { id: "inv_011", code: "INV-011", name: "Desktops / PCs",         category: "Electronics",  qty: 42,  minQty: 40,  unit: "Pcs",   unitPrice: 35000, supplier: "Tech Supplies", lastUpdated: "Apr 10, 2025", status: "in-stock" },
  { id: "inv_012", code: "INV-012", name: "Badminton Rackets",      category: "Sports",       qty: 12,  minQty: 8,   unit: "Pcs",   unitPrice: 600,   supplier: "Sports World",  lastUpdated: "Jun 15, 2025", status: "in-stock" },
];

export const inventoryApi = createResource<InventoryItem, InventoryFilters, "code">({
  idPrefix: "inv",
  seed,
  uniqueBy: { field: "name", label: "Item name" },
  // Item codes continue the seed sequence rather than restarting.
  generate: (count) => ({ code: `INV-${String(count + 1).padStart(3, "0")}` }),
  defaults: { qty: 0, minQty: 0, unitPrice: 0, status: "in-stock" },
  matches: (row, { search, category, tab }) => {
    if (tab && tab !== "All" && row.status !== TAB_TO_STATUS[tab]) return false;
    if (category && category !== "All" && row.category !== category) return false;
    return textMatch(search, row.name, row.code, row.supplier);
  },
});

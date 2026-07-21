import { createResource, textMatch } from "./createResource";

export interface MenuItem {
  id: string;
  /** Human-facing menu code shown in the UI, e.g. "MI-001". The `id` is
   *  internal and must never be displayed. */
  code: string;
  name: string;
  category: string;
  price: number;
  available: boolean;
  sold: number;
  emoji: string;
}

export interface MenuItemFilters {
  search?: string;
  /** "All" (or empty) means every category. */
  category?: string;
  /** "true" / "false" as strings so the value survives a <select>. */
  availability?: string;
}

export const CATEGORY_OPTIONS = ["Meals", "Snacks", "Drinks", "Healthy"];

export const AVAILABILITY_OPTIONS = [
  { label: "Available", value: "true" },
  { label: "Unavailable", value: "false" },
];

const seed: MenuItem[] = [
  { id: "mi_001", code: "MI-001", name: "Veg Thali",       category: "Meals",   price: 45, available: true,  sold: 120, emoji: "🍱" },
  { id: "mi_002", code: "MI-002", name: "Chicken Biryani", category: "Meals",   price: 70, available: true,  sold: 85,  emoji: "🍛" },
  { id: "mi_003", code: "MI-003", name: "Paneer Sandwich", category: "Snacks",  price: 30, available: true,  sold: 200, emoji: "🥪" },
  { id: "mi_004", code: "MI-004", name: "Cold Coffee",     category: "Drinks",  price: 25, available: true,  sold: 310, emoji: "☕" },
  { id: "mi_005", code: "MI-005", name: "Samosa (2 pcs)",  category: "Snacks",  price: 15, available: true,  sold: 450, emoji: "🥟" },
  { id: "mi_006", code: "MI-006", name: "Fresh Lime Soda", category: "Drinks",  price: 20, available: false, sold: 95,  emoji: "🍋" },
  { id: "mi_007", code: "MI-007", name: "Chole Bhature",   category: "Meals",   price: 55, available: true,  sold: 60,  emoji: "🫓" },
  { id: "mi_008", code: "MI-008", name: "Fruit Bowl",      category: "Healthy", price: 40, available: true,  sold: 75,  emoji: "🍎" },
  { id: "mi_009", code: "MI-009", name: "Maggi Noodles",   category: "Snacks",  price: 25, available: true,  sold: 380, emoji: "🍜" },
  { id: "mi_010", code: "MI-010", name: "Lassi",           category: "Drinks",  price: 30, available: true,  sold: 140, emoji: "🥛" },
];

export const menuItemsApi = createResource<MenuItem, MenuItemFilters, "code">({
  idPrefix: "mi",
  seed,
  uniqueBy: { field: "name", label: "Item name" },
  // Menu codes continue the seed sequence rather than restarting.
  generate: (count) => ({ code: `MI-${String(count + 1).padStart(3, "0")}` }),
  defaults: { sold: 0, available: true, emoji: "🍽️" },
  matches: (row, { search, category, availability }) => {
    if (category && category !== "All" && row.category !== category) return false;
    if (availability && availability !== "All" && String(row.available) !== availability) {
      return false;
    }
    return textMatch(search, row.name, row.category, row.code);
  },
});

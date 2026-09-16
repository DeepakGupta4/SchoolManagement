import { createApiResource } from "./createApiResource";

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

export const menuItemsApi = createApiResource<MenuItem, MenuItemFilters, "code">("/api/menu-items");

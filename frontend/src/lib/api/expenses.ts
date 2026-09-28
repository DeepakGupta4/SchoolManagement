import { createApiResource } from "./createApiResource";

export interface Expense {
  id: string;
  voucherNo: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  paidTo: string;
  method: string;
  status: string;
  recurring: boolean;
  notes: string;
}

export interface ExpenseFilters {
  search?: string;
  status?: string;
  category?: string;
}

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

export const categoryStyles: Record<string, { variant: BadgeVariant; tile: string; emoji: string }> = {
  Utilities:   { variant: "info",    tile: "bg-info-soft text-info-text",       emoji: "⚡" },
  Equipment:   { variant: "default", tile: "bg-primary-soft text-primary-text", emoji: "🔧" },
  Supplies:    { variant: "success", tile: "bg-success-soft text-success-text", emoji: "📦" },
  Maintenance: { variant: "warning", tile: "bg-warning-soft text-warning-text", emoji: "🏗️" },
  Canteen:     { variant: "danger",  tile: "bg-danger-soft text-danger-text",   emoji: "🍽️" },
  Services:    { variant: "info",    tile: "bg-info-soft text-info-text",       emoji: "🛡️" },
  Technology:  { variant: "default", tile: "bg-primary-soft text-primary-text", emoji: "💻" },
};

export const fallbackCategory = {
  variant: "default" as BadgeVariant,
  tile: "bg-surface-hover text-muted",
  emoji: "📌",
};

export const CATEGORY_OPTIONS = Object.keys(categoryStyles);

export const METHOD_OPTIONS = ["Online", "Cheque", "Cash", "UPI", "NEFT"];

export const STATUS_OPTIONS = [
  { label: "Paid", value: "paid" },
  { label: "Pending", value: "pending" },
];

/** Short month labels, index 0 = Jan. */
export const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Resolves an expense date to a sortable month bucket. Handles both the native
 * `yyyy-mm-dd` inputs the form now writes and any legacy `"Mmm dd, yyyy"` rows,
 * so the trend chart and the month filter stay correct across old and new
 * records. Returns null for an unparseable date. `new Date(date)` is a
 * deterministic parse of a given string — not a clock read — so it is safe.
 */
export function expenseMonthBucket(
  date: string
): { key: string; year: number; month: number } | null {
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (iso) {
    const year = Number(iso[1]);
    const month = Number(iso[2]) - 1;
    if (month < 0 || month > 11) return null;
    return { key: `${iso[1]}-${iso[2]}`, year, month };
  }
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;
  const year = parsed.getFullYear();
  const month = parsed.getMonth();
  return { key: `${year}-${String(month + 1).padStart(2, "0")}`, year, month };
}

export const expensesApi = createApiResource<Expense, ExpenseFilters>("/api/expenses");

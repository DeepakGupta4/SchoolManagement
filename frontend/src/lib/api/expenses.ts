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

/** Chronological month order, used to sort the derived trend chart. */
export const MONTH_ORDER = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Closed months carried over from the previous ledger. Live months are computed
 * from the expense rows themselves so the trend reacts to new entries.
 */
export const MONTHLY_BASELINE = [
  { month: "Feb", amount: 180000 },
  { month: "Mar", amount: 210000 },
  { month: "Apr", amount: 195000 },
  { month: "May", amount: 225000 },
];

export const expensesApi = createApiResource<Expense, ExpenseFilters>("/api/expenses");

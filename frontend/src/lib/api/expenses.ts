import { createResource, textMatch } from "./createResource";

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

const seed: Expense[] = [
  { id: "EXP001", voucherNo: "EXP001", title: "Electricity Bill",        category: "Utilities",   amount: 18500, date: "Jul 15, 2025", paidTo: "BSES Rajdhani",        method: "Online", status: "paid",    recurring: true,  notes: "Monthly bill for the main block." },
  { id: "EXP002", voucherNo: "EXP002", title: "Lab Equipment Purchase",  category: "Equipment",   amount: 45000, date: "Jul 12, 2025", paidTo: "Science Supplies Co.", method: "Cheque", status: "paid",    recurring: false, notes: "Microscopes and glassware for the physics lab." },
  { id: "EXP003", voucherNo: "EXP003", title: "Water Bill",              category: "Utilities",   amount: 4200,  date: "Jul 10, 2025", paidTo: "Delhi Jal Board",      method: "Online", status: "paid",    recurring: true,  notes: "Quarterly water charges." },
  { id: "EXP004", voucherNo: "EXP004", title: "Stationery & Supplies",   category: "Supplies",    amount: 12800, date: "Jul 08, 2025", paidTo: "Office Mart",          method: "Cash",   status: "paid",    recurring: false, notes: "Registers, chalk and printer paper." },
  { id: "EXP005", voucherNo: "EXP005", title: "Internet & Broadband",    category: "Utilities",   amount: 6500,  date: "Jul 05, 2025", paidTo: "Airtel Business",      method: "Online", status: "paid",    recurring: true,  notes: "200 Mbps leased line for the campus." },
  { id: "EXP006", voucherNo: "EXP006", title: "Building Maintenance",    category: "Maintenance", amount: 32000, date: "Jul 03, 2025", paidTo: "FixIt Services",       method: "Cheque", status: "paid",    recurring: false, notes: "Terrace waterproofing before the monsoon." },
  { id: "EXP007", voucherNo: "EXP007", title: "Sports Equipment",        category: "Equipment",   amount: 28000, date: "Jun 28, 2025", paidTo: "Sports World",         method: "Online", status: "paid",    recurring: false, notes: "Cricket kits and basketballs." },
  { id: "EXP008", voucherNo: "EXP008", title: "Canteen Raw Materials",   category: "Canteen",     amount: 22000, date: "Jun 25, 2025", paidTo: "Fresh Mart",           method: "Cash",   status: "paid",    recurring: true,  notes: "Fortnightly grocery restock." },
  { id: "EXP009", voucherNo: "EXP009", title: "Security Services",       category: "Services",    amount: 15000, date: "Jul 18, 2025", paidTo: "SecureGuard Pvt Ltd",  method: "Online", status: "pending", recurring: true,  notes: "Four guards on a two-shift roster." },
  { id: "EXP010", voucherNo: "EXP010", title: "Annual Software License", category: "Technology",  amount: 85000, date: "Jul 20, 2025", paidTo: "EduSoft Solutions",    method: "Online", status: "pending", recurring: true,  notes: "School ERP renewal for the academic year." },
];

export const expensesApi = createResource<Expense, ExpenseFilters>({
  idPrefix: "exp",
  seed,
  uniqueBy: { field: "voucherNo", label: "Voucher number" },
  defaults: { status: "pending", recurring: false, notes: "" },
  matches: (row, { search, status, category }) => {
    if (status && row.status !== status) return false;
    if (category && row.category !== category) return false;
    return textMatch(search, row.title, row.paidTo, row.voucherNo, row.category);
  },
});

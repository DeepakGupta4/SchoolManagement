"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle,
  Clock,
  Download,
  Eye,
  ListChecks,
  Pencil,
  Plus,
  Repeat,
  Search,
  Trash2,
  Wallet,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  ConfirmDialog,
  EmptyState,
  Input,
  PageHeader,
  Select,
  StatCard,
  Table,
  useToast,
  type Column,
} from "@/components/ui";
import { exportToCsv } from "@/lib/exportCsv";
import { useResource } from "@/hooks/useResource";
import {
  categoryStyles,
  expenseMonthBucket,
  expensesApi,
  fallbackCategory,
  MONTHS_SHORT,
  type Expense,
} from "@/lib/api/expenses";
import type { ExpenseSchema } from "@/lib/schemas/expense";
import { useChartTheme, toneClass, type ChartTone } from "@/hooks/useChartTheme";
import { cn } from "@/lib/utils";
import { DetailModal } from "@/components/DetailModal";
import { ExpenseFormModal } from "./ExpenseFormModal";

/** Cycled across the category breakdown — keeps the pie and its legend matched. */
const tonePalette: ChartTone[] = ["primary", "info", "success", "warning", "danger", "violet"];

const tabs = ["All", "Paid", "Pending"];

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** Compact y-axis ticks: whole rupees under 1k, otherwise "₹12k". */
const formatAxisMoney = (v: number) => (v >= 1000 ? `₹${Math.round(v / 1000)}k` : `₹${v}`);

export default function ExpensesPage() {
  const t = useChartTheme();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [catFilter, setCatFilter] = useState("All");
  // Month is filtered on the client (the stored date is a string, so the CRUD
  // router can't range-match it) against the same rows the table already holds.
  const [monthFilter, setMonthFilter] = useState("");

  const filters = useMemo(
    () => ({
      search,
      status: activeTab === "All" ? "" : activeTab.toLowerCase(),
      category: catFilter === "All" ? "" : catFilter,
    }),
    [search, activeTab, catFilter]
  );

  const { items, loading, error, refetch, save, remove, saving, deleting } = useResource(
    expensesApi,
    filters,
    { label: "expense", describe: (e) => e.title }
  );

  // Months that actually have records (newest first), for the filter dropdown.
  const monthOptions = useMemo(() => {
    const seen = new Map<string, { key: string; year: number; month: number }>();
    for (const e of items) {
      const b = expenseMonthBucket(e.date);
      if (b && !seen.has(b.key)) seen.set(b.key, b);
    }
    return [...seen.values()]
      .sort((a, b) => b.key.localeCompare(a.key))
      .map((b) => ({ label: `${MONTHS_SHORT[b.month]} ${b.year}`, value: b.key }));
  }, [items]);

  // If the chosen month is no longer represented (filters/data changed), drop it
  // so the select can't get stuck on a value it no longer offers. Deferred so no
  // setState runs synchronously inside the effect.
  useEffect(() => {
    if (!monthFilter || monthOptions.some((o) => o.value === monthFilter)) return;
    const id = setTimeout(() => setMonthFilter(""), 0);
    return () => clearTimeout(id);
  }, [monthFilter, monthOptions]);

  // Rows shown in the table + summarised in the stats/pie: the fetched set,
  // narrowed to the selected month. The trend below stays full-range on purpose.
  const visibleItems = useMemo(
    () =>
      monthFilter
        ? items.filter((e) => expenseMonthBucket(e.date)?.key === monthFilter)
        : items,
    [items, monthFilter]
  );

  const selectedMonthLabel = monthOptions.find((o) => o.value === monthFilter)?.label;

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [viewing, setViewing] = useState<Expense | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Expense | null>(null);
  const { toast } = useToast();

  const handleExport = () => {
    if (visibleItems.length === 0) {
      toast({
        title: "Nothing to export",
        description: "No expenses match the current filters.",
        variant: "warning",
      });
      return;
    }
    exportToCsv<Expense>(
      "expenses",
      [
        { header: "Voucher No", value: (e) => e.voucherNo },
        { header: "Title", value: (e) => e.title },
        { header: "Category", value: (e) => e.category },
        { header: "Amount (INR)", value: (e) => e.amount },
        { header: "Date", value: (e) => e.date },
        { header: "Paid To", value: (e) => e.paidTo },
        { header: "Method", value: (e) => e.method },
        { header: "Status", value: (e) => e.status },
        { header: "Recurring", value: (e) => (e.recurring ? "Yes" : "No") },
        { header: "Notes", value: (e) => e.notes },
      ],
      visibleItems
    );
    toast({
      title: "Export ready",
      description: `${visibleItems.length} expense${visibleItems.length === 1 ? "" : "s"} exported to CSV.`,
    });
  };

  // Totals reflect exactly what the table shows (the month-narrowed set), so the
  // cards, the footer total and the rows can never disagree.
  const stats = useMemo(() => {
    const sum = (rows: Expense[]) => rows.reduce((s, e) => s + e.amount, 0);
    return {
      total: sum(visibleItems),
      paid: sum(visibleItems.filter((e) => e.status === "paid")),
      pending: sum(visibleItems.filter((e) => e.status === "pending")),
      count: visibleItems.length,
    };
  }, [visibleItems]);

  // Trend is derived purely from real records — one bar per month that actually
  // has expenses, chronologically ordered, y-axis auto-scaled to the true max.
  // Labels carry the year only when the data spans more than one.
  const monthlyData = useMemo(() => {
    const buckets = new Map<string, { key: string; year: number; month: number; amount: number }>();
    for (const e of items) {
      const b = expenseMonthBucket(e.date);
      if (!b) continue;
      const prev = buckets.get(b.key);
      if (prev) prev.amount += e.amount;
      else buckets.set(b.key, { key: b.key, year: b.year, month: b.month, amount: e.amount });
    }
    const rows = [...buckets.values()].sort((a, b) => a.key.localeCompare(b.key));
    const multiYear = new Set(rows.map((r) => r.year)).size > 1;
    return rows.map((r) => ({
      key: r.key,
      month: multiYear ? `${MONTHS_SHORT[r.month]} '${String(r.year).slice(2)}` : MONTHS_SHORT[r.month],
      amount: r.amount,
    }));
  }, [items]);

  // `color` feeds recharts only; `tone` is what the DOM legend swatch classes off.
  const pieData = useMemo(() => {
    const totals = new Map<string, number>();
    for (const e of visibleItems) totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount);
    return [...totals.entries()].map(([name, value], i) => {
      const tone = tonePalette[i % tonePalette.length];
      return { name, value, tone, color: t.series[tone] };
    });
  }, [visibleItems, t]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  // The form models recurrence as a yes/no select; the record stores a boolean.
  const handleSubmit = async (values: ExpenseSchema) => {
    const ok = await save({ ...values, recurring: values.recurring === "yes" }, editing);
    if (ok) {
      setFormOpen(false);
      setEditing(null);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    const ok = await remove(pendingDelete);
    if (ok) setPendingDelete(null);
  };

  const filtersActive =
    Boolean(search) || activeTab !== "All" || catFilter !== "All" || Boolean(monthFilter);

  const columns: Column<Expense>[] = [
    {
      key: "title",
      header: "Expense",
      sortable: true,
      render: (e) => {
        const cc = categoryStyles[e.category] ?? fallbackCategory;
        return (
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex size-9 shrink-0 items-center justify-center rounded-md text-base",
                cc.tile
              )}
            >
              <span aria-hidden>{cc.emoji}</span>
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-text">{e.title}</p>
              <p className="truncate text-xs text-subtle">{e.voucherNo}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      render: (e) => (
        <Badge variant={(categoryStyles[e.category] ?? fallbackCategory).variant}>
          {e.category}
        </Badge>
      ),
    },
    {
      key: "paidTo",
      header: "Paid To",
      sortable: true,
      render: (e) => <span className="whitespace-nowrap text-muted">{e.paidTo}</span>,
    },
    {
      key: "date",
      header: "Date",
      sortable: true,
      render: (e) => <span className="whitespace-nowrap text-muted">{e.date}</span>,
    },
    {
      key: "method",
      header: "Method",
      render: (e) => <Badge variant="outline">{e.method}</Badge>,
    },
    {
      key: "recurring",
      header: "Recurring",
      sortable: true,
      sortValue: (e) => (e.recurring ? 1 : 0),
      render: (e) =>
        e.recurring ? (
          <Badge variant="info" className="gap-1.5">
            <Repeat className="size-3" />
            Yes
          </Badge>
        ) : (
          <span className="text-subtle">—</span>
        ),
    },
    {
      key: "amount",
      header: "Amount",
      sortable: true,
      align: "right",
      render: (e) => (
        <span className="whitespace-nowrap font-semibold text-text">{inr.format(e.amount)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (e) =>
        e.status === "paid" ? (
          <Badge variant="success" className="gap-1.5">
            <CheckCircle className="size-3" />
            Paid
          </Badge>
        ) : (
          <Badge variant="warning" className="gap-1.5">
            <Clock className="size-3" />
            Pending
          </Badge>
        ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (e) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => setViewing(e)}
            aria-label={`View ${e.title}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Eye className="size-4" />
          </button>
          <button
            onClick={() => {
              setEditing(e);
              setFormOpen(true);
            }}
            aria-label={`Edit ${e.title}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Pencil className="size-4" />
          </button>
          <button
            onClick={() => setPendingDelete(e)}
            aria-label={`Delete ${e.title}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-danger-soft hover:text-danger"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Expenses"
        description="Track and manage all school expenditures"
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download className="size-4" />
              Export
            </Button>
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Add Expense
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={selectedMonthLabel ? `Total · ${selectedMonthLabel}` : "Total Expenses"}
          value={inr.format(stats.total)}
          icon={Wallet}
          tone="indigo"
        />
        <StatCard label="Paid" value={inr.format(stats.paid)} icon={CheckCircle} tone="emerald" />
        <StatCard label="Pending" value={inr.format(stats.pending)} icon={Clock} tone="amber" />
        <StatCard label="Transactions" value={stats.count} icon={ListChecks} tone="violet" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Monthly Trend */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text">Monthly Expense Trend</p>
              <p className="mt-0.5 text-xs text-muted">Total expenditure per month</p>
            </div>
          </CardHeader>
          <CardContent>
            {monthlyData.length === 0 ? (
              <EmptyState
                title="No expense data available"
                description="The monthly trend appears once expenses are recorded."
              />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12, fill: t.axis }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: t.axis }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={formatAxisMoney}
                  />
                  <Tooltip
                    contentStyle={t.tooltip}
                    cursor={{ fill: t.cursor, radius: 6 }}
                    formatter={(v) => [`₹${Number(v).toLocaleString("en-IN")}`, "Amount"]}
                  />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]} name="Amount">
                    {monthlyData.map((d) => (
                      <Cell
                        key={d.key}
                        fill={t.series.primary}
                        fillOpacity={monthFilter && d.key !== monthFilter ? 0.3 : 1}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text">By Category</p>
              <p className="mt-0.5 text-xs text-muted">
                {selectedMonthLabel ? `${selectedMonthLabel} breakdown` : "Breakdown by category"}
              </p>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3">
            {pieData.length === 0 ? (
              <EmptyState
                title="No expenses to break down"
                description="Category totals appear once expenses are recorded."
              />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={t.tooltip}
                      formatter={(v) => [`₹${Number(v).toLocaleString("en-IN")}`, ""]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex w-full flex-col gap-1.5">
                  {pieData.map((c) => (
                    <div key={c.name} className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-1.5 text-xs text-muted">
                        <span className={cn("size-2 rounded-sm", toneClass[c.tone])} />
                        {c.name}
                      </span>
                      <span className="text-xs font-semibold text-text">{inr.format(c.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-md bg-surface-sunken p-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              aria-pressed={activeTab === tab}
              className={cn(
                "focus-ring rounded-sm px-3.5 py-1.5 text-xs font-medium transition-colors",
                activeTab === tab
                  ? "bg-surface-raised text-text shadow-sm"
                  : "text-muted hover:text-text"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="w-48">
          <Select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            options={[
              { label: "All Categories", value: "All" },
              ...Object.keys(categoryStyles).map((c) => ({ label: c, value: c })),
            ]}
            aria-label="Filter by category"
          />
        </div>

        <div className="w-44">
          <Select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            options={[{ label: "All Months", value: "" }, ...monthOptions]}
            aria-label="Filter by month"
          />
        </div>

        <div className="min-w-60 flex-1">
          <Input
            type="search"
            placeholder="Search expenses…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search expenses"
          />
        </div>
        <p className="text-xs text-muted">{visibleItems.length} records</p>
      </div>

      {error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm font-medium text-danger">{error}</p>
            <Button variant="outline" onClick={refetch}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Table
            columns={columns}
            rows={visibleItems}
            rowKey={(e) => e.id}
            loading={loading}
            emptyTitle="No expenses found"
            emptyDescription={
              filtersActive
                ? "Try adjusting your filters."
                : "Record your first expense to get started."
            }
            emptyAction={
              <Button variant="outline" onClick={openCreate}>
                <Plus className="size-4" />
                Add Expense
              </Button>
            }
          />

          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <p className="text-xs text-muted">
              Showing <span className="font-medium text-text">{visibleItems.length}</span>{" "}
              {visibleItems.length === 1 ? "expense" : "expenses"}
            </p>
            <p className="text-sm font-semibold text-text">
              Total: <span className="text-primary">{inr.format(stats.total)}</span>
            </p>
          </div>
        </>
      )}

      <ExpenseFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        record={editing}
        saving={saving}
        onSubmit={handleSubmit}
      />

      <DetailModal
        open={Boolean(viewing)}
        onOpenChange={(o) => !o && setViewing(null)}
        title={viewing?.title ?? "Expense"}
        description={viewing ? `${viewing.voucherNo} · ${viewing.category}` : ""}
        rows={
          viewing
            ? [
                { label: "Voucher no", value: viewing.voucherNo },
                { label: "Title", value: viewing.title },
                { label: "Category", value: viewing.category },
                { label: "Amount", value: inr.format(viewing.amount) },
                { label: "Date", value: viewing.date },
                { label: "Paid to", value: viewing.paidTo },
                { label: "Method", value: viewing.method },
                { label: "Status", value: viewing.status === "paid" ? "Paid" : "Pending" },
                { label: "Recurring", value: viewing.recurring ? "Yes" : "No" },
                { label: "Notes", value: viewing.notes, full: true },
              ]
            : []
        }
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete expense?"
        description={
          pendingDelete
            ? `${pendingDelete.title} (${pendingDelete.voucherNo}) worth ${inr.format(pendingDelete.amount)} will be permanently removed. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}

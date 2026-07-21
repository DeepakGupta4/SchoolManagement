"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle,
  Clock,
  Download,
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
  expensesApi,
  fallbackCategory,
  MONTH_ORDER,
  MONTHLY_BASELINE,
  type Expense,
} from "@/lib/api/expenses";
import type { ExpenseSchema } from "@/lib/schemas/expense";
import { useChartTheme, toneClass, type ChartTone } from "@/hooks/useChartTheme";
import { cn } from "@/lib/utils";
import { ExpenseFormModal } from "./ExpenseFormModal";

/** Cycled across the category breakdown — keeps the pie and its legend matched. */
const tonePalette: ChartTone[] = ["primary", "info", "success", "warning", "danger", "violet"];

const tabs = ["All", "Paid", "Pending"];

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function ExpensesPage() {
  const t = useChartTheme();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [catFilter, setCatFilter] = useState("All");

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

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Expense | null>(null);
  const { toast } = useToast();

  const handleExport = () => {
    if (items.length === 0) {
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
      items
    );
    toast({
      title: "Export ready",
      description: `${items.length} expense${items.length === 1 ? "" : "s"} exported to CSV.`,
    });
  };

  const stats = useMemo(() => {
    const sum = (rows: Expense[]) => rows.reduce((s, e) => s + e.amount, 0);
    return {
      total: sum(items),
      paid: sum(items.filter((e) => e.status === "paid")),
      pending: sum(items.filter((e) => e.status === "pending")),
      count: items.length,
    };
  }, [items]);

  // Live months come from the rows themselves; closed months fall back to the
  // carried-over baseline, so the trend reacts to every new voucher.
  const monthlyData = useMemo(() => {
    const live = new Map<string, number>();
    for (const e of items) {
      const month = e.date.slice(0, 3);
      live.set(month, (live.get(month) ?? 0) + e.amount);
    }
    for (const { month, amount } of MONTHLY_BASELINE) {
      if (!live.has(month)) live.set(month, amount);
    }
    return [...live.entries()]
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => MONTH_ORDER.indexOf(a.month) - MONTH_ORDER.indexOf(b.month));
  }, [items]);

  // `color` feeds recharts only; `tone` is what the DOM legend swatch classes off.
  const pieData = useMemo(() => {
    const totals = new Map<string, number>();
    for (const e of items) totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount);
    return [...totals.entries()].map(([name, value], i) => {
      const tone = tonePalette[i % tonePalette.length];
      return { name, value, tone, color: t.series[tone] };
    });
  }, [items, t.series]);

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
        <StatCard label="Total This Month" value={inr.format(stats.total)} icon={Wallet} tone="indigo" />
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
                  tick={{ fontSize: 11, fill: t.axis }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={t.tooltip}
                  cursor={{ fill: t.cursor, radius: 6 }}
                  formatter={(v) => [`₹${Number(v).toLocaleString("en-IN")}`, "Amount"]}
                />
                <Bar dataKey="amount" fill={t.series.primary} radius={[6, 6, 0, 0]} name="Amount" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text">By Category</p>
              <p className="mt-0.5 text-xs text-muted">Current month breakdown</p>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3">
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
        <p className="text-xs text-muted">{items.length} records</p>
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
            rows={items}
            rowKey={(e) => e.id}
            loading={loading}
            emptyTitle="No expenses found"
            emptyDescription={
              search || activeTab !== "All" || catFilter !== "All"
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
              Showing <span className="font-medium text-text">{items.length}</span>{" "}
              {items.length === 1 ? "expense" : "expenses"}
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

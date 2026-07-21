"use client";

import React, { useState } from "react";
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
  Input,
  PageHeader,
  Select,
  StatCard,
  Table,
  type Column,
} from "@/components/ui";
import { useChartTheme, toneClass, type ChartTone } from "@/hooks/useChartTheme";
import { cn } from "@/lib/utils";

const expenses = [
  { id: "EXP001", title: "Electricity Bill",        category: "Utilities",   amount: 18500,  date: "Jul 15, 2025", paidTo: "BSES Rajdhani",       method: "Online",  status: "paid",    recurring: true  },
  { id: "EXP002", title: "Lab Equipment Purchase",  category: "Equipment",   amount: 45000,  date: "Jul 12, 2025", paidTo: "Science Supplies Co.", method: "Cheque",  status: "paid",    recurring: false },
  { id: "EXP003", title: "Water Bill",              category: "Utilities",   amount: 4200,   date: "Jul 10, 2025", paidTo: "Delhi Jal Board",      method: "Online",  status: "paid",    recurring: true  },
  { id: "EXP004", title: "Stationery & Supplies",   category: "Supplies",    amount: 12800,  date: "Jul 08, 2025", paidTo: "Office Mart",          method: "Cash",    status: "paid",    recurring: false },
  { id: "EXP005", title: "Internet & Broadband",    category: "Utilities",   amount: 6500,   date: "Jul 05, 2025", paidTo: "Airtel Business",      method: "Online",  status: "paid",    recurring: true  },
  { id: "EXP006", title: "Building Maintenance",    category: "Maintenance", amount: 32000,  date: "Jul 03, 2025", paidTo: "FixIt Services",       method: "Cheque",  status: "paid",    recurring: false },
  { id: "EXP007", title: "Sports Equipment",        category: "Equipment",   amount: 28000,  date: "Jun 28, 2025", paidTo: "Sports World",         method: "Online",  status: "paid",    recurring: false },
  { id: "EXP008", title: "Canteen Raw Materials",   category: "Canteen",     amount: 22000,  date: "Jun 25, 2025", paidTo: "Fresh Mart",           method: "Cash",    status: "paid",    recurring: true  },
  { id: "EXP009", title: "Security Services",       category: "Services",    amount: 15000,  date: "Jul 18, 2025", paidTo: "SecureGuard Pvt Ltd",  method: "Online",  status: "pending", recurring: true  },
  { id: "EXP010", title: "Annual Software License", category: "Technology",  amount: 85000,  date: "Jul 20, 2025", paidTo: "EduSoft Solutions",    method: "Online",  status: "pending", recurring: true  },
];

type Expense = (typeof expenses)[number];

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

const categoryStyles: Record<string, { variant: BadgeVariant; tile: string; emoji: string }> = {
  Utilities:   { variant: "info",    tile: "bg-info-soft text-info-text",       emoji: "⚡" },
  Equipment:   { variant: "default", tile: "bg-primary-soft text-primary-text", emoji: "🔧" },
  Supplies:    { variant: "success", tile: "bg-success-soft text-success-text", emoji: "📦" },
  Maintenance: { variant: "warning", tile: "bg-warning-soft text-warning-text", emoji: "🏗️" },
  Canteen:     { variant: "danger",  tile: "bg-danger-soft text-danger-text",   emoji: "🍽️" },
  Services:    { variant: "info",    tile: "bg-info-soft text-info-text",       emoji: "🛡️" },
  Technology:  { variant: "default", tile: "bg-primary-soft text-primary-text", emoji: "💻" },
};

const fallbackCategory = { variant: "default" as BadgeVariant, tile: "bg-surface-hover text-muted", emoji: "📌" };

const monthlyData = [
  { month: "Feb", amount: 180000 },
  { month: "Mar", amount: 210000 },
  { month: "Apr", amount: 195000 },
  { month: "May", amount: 225000 },
  { month: "Jun", amount: 198000 },
  { month: "Jul", amount: 269000 },
];

const categoryBreakdown = Object.entries(
  expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>)
).map(([name, value]) => ({ name, value }));

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

  // `color` feeds recharts only; `tone` is what the DOM legend swatch classes off.
  const pieData = categoryBreakdown.map((c, i) => {
    const tone = tonePalette[i % tonePalette.length];
    return { ...c, tone, color: t.series[tone] };
  });

  const filtered = expenses.filter((e) => {
    const matchTab = activeTab === "All" || e.status === activeTab.toLowerCase();
    const matchCat = catFilter === "All" || e.category === catFilter;
    const matchSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.paidTo.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchCat && matchSearch;
  });

  const totalPaid = expenses.filter((e) => e.status === "paid").reduce((s, e) => s + e.amount, 0);
  const totalPending = expenses
    .filter((e) => e.status === "pending")
    .reduce((s, e) => s + e.amount, 0);
  const thisMonth = expenses.reduce((s, e) => s + e.amount, 0);

  const columns: Column<Expense>[] = [
    {
      key: "title",
      header: "Expense",
      sortable: true,
      render: (e) => {
        const cc = categoryStyles[e.category] ?? fallbackCategory;
        return (
          <div className="flex items-center gap-3">
            <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-md text-base", cc.tile)}>
              <span aria-hidden>{cc.emoji}</span>
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-text">{e.title}</p>
              <p className="truncate text-xs text-subtle">{e.id}</p>
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
        <Badge variant={(categoryStyles[e.category] ?? fallbackCategory).variant}>{e.category}</Badge>
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
            title="Edit"
            aria-label={`Edit ${e.title}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Pencil className="size-4" />
          </button>
          <button
            title="Delete"
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
            <Button variant="outline">
              <Download className="size-4" />
              Export
            </Button>
            <Button>
              <Plus className="size-4" />
              Add Expense
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total This Month" value={inr.format(thisMonth)} icon={Wallet} tone="indigo" />
        <StatCard label="Paid" value={inr.format(totalPaid)} icon={CheckCircle} tone="emerald" />
        <StatCard label="Pending" value={inr.format(totalPending)} icon={Clock} tone="amber" />
        <StatCard label="Transactions" value={expenses.length} icon={ListChecks} tone="violet" />
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
        <p className="text-xs text-muted">{filtered.length} records</p>
      </div>

      <Table
        columns={columns}
        rows={filtered}
        rowKey={(e) => e.id}
        emptyTitle="No expenses found"
        emptyDescription="Try adjusting your filters."
      />

      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <p className="text-xs text-muted">
          Showing <span className="font-medium text-text">{filtered.length}</span> of{" "}
          <span className="font-medium text-text">{expenses.length}</span> expenses
        </p>
        <p className="text-sm font-semibold text-text">
          Total:{" "}
          <span className="text-primary">
            {inr.format(filtered.reduce((s, e) => s + e.amount, 0))}
          </span>
        </p>
      </div>
    </div>
  );
}

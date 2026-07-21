"use client";

import React, { useState } from "react";
import {
  Plus,
  Search,
  Download,
  Pencil,
  Trash2,
  Wallet,
  ReceiptText,
  CheckCircle,
  UtensilsCrossed,
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
import { useChartTheme } from "@/hooks/useChartTheme";
import { cn } from "@/lib/utils";

const menuItems = [
  { id: "M001", name: "Veg Thali",        category: "Meals",    price: 45,  available: true,  sold: 120, emoji: "🍱" },
  { id: "M002", name: "Chicken Biryani",  category: "Meals",    price: 70,  available: true,  sold: 85,  emoji: "🍛" },
  { id: "M003", name: "Paneer Sandwich",  category: "Snacks",   price: 30,  available: true,  sold: 200, emoji: "🥪" },
  { id: "M004", name: "Cold Coffee",      category: "Drinks",   price: 25,  available: true,  sold: 310, emoji: "☕" },
  { id: "M005", name: "Samosa (2 pcs)",   category: "Snacks",   price: 15,  available: true,  sold: 450, emoji: "🥟" },
  { id: "M006", name: "Fresh Lime Soda",  category: "Drinks",   price: 20,  available: false, sold: 95,  emoji: "🍋" },
  { id: "M007", name: "Chole Bhature",    category: "Meals",    price: 55,  available: true,  sold: 60,  emoji: "🫓" },
  { id: "M008", name: "Fruit Bowl",       category: "Healthy",  price: 40,  available: true,  sold: 75,  emoji: "🍎" },
  { id: "M009", name: "Maggi Noodles",    category: "Snacks",   price: 25,  available: true,  sold: 380, emoji: "🍜" },
  { id: "M010", name: "Lassi",            category: "Drinks",   price: 30,  available: true,  sold: 140, emoji: "🥛" },
];

const orders = [
  { id: "ORD001", customer: "Rahul Sharma",   class: "10-A", items: "Veg Thali, Cold Coffee",    total: 70,  time: "12:05 PM", status: "delivered" },
  { id: "ORD002", customer: "Priya Singh",    class: "9-B",  items: "Samosa, Fresh Lime Soda",   total: 35,  time: "12:10 PM", status: "delivered" },
  { id: "ORD003", customer: "Amit Verma",     class: "11-C", items: "Chicken Biryani",           total: 70,  time: "12:15 PM", status: "preparing" },
  { id: "ORD004", customer: "Sneha Patel",    class: "8-A",  items: "Paneer Sandwich, Lassi",    total: 60,  time: "12:18 PM", status: "preparing" },
  { id: "ORD005", customer: "Karan Mehta",    class: "12-B", items: "Chole Bhature, Cold Coffee",total: 80,  time: "12:22 PM", status: "pending"   },
  { id: "ORD006", customer: "Divya Nair",     class: "7-C",  items: "Fruit Bowl, Lassi",         total: 70,  time: "12:25 PM", status: "pending"   },
  { id: "ORD007", customer: "Rohan Gupta",    class: "10-B", items: "Maggi Noodles",             total: 25,  time: "12:30 PM", status: "delivered" },
  { id: "ORD008", customer: "Ananya Joshi",   class: "9-A",  items: "Veg Thali",                 total: 45,  time: "12:35 PM", status: "cancelled" },
];

const salesData = [
  { day: "Mon", revenue: 4200 },
  { day: "Tue", revenue: 5800 },
  { day: "Wed", revenue: 4900 },
  { day: "Thu", revenue: 6300 },
  { day: "Fri", revenue: 7100 },
  { day: "Sat", revenue: 3200 },
];

type MenuItem = (typeof menuItems)[number];
type Order = (typeof orders)[number];

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

const categories = ["Meals", "Snacks", "Drinks", "Healthy"];

const categoryVariant: Record<string, BadgeVariant> = {
  Meals: "warning",
  Snacks: "default",
  Drinks: "info",
  Healthy: "success",
};

/** Which `useChartTheme().series` key paints each category in the pie. */
const categorySeries: Record<string, "warning" | "violet" | "info" | "success"> = {
  Meals: "warning",
  Snacks: "violet",
  Drinks: "info",
  Healthy: "success",
};

const statusConfig: Record<string, { variant: BadgeVariant; label: string }> = {
  delivered: { variant: "success", label: "✓ Delivered" },
  preparing: { variant: "warning", label: "🔥 Preparing" },
  pending:   { variant: "info",    label: "⏳ Pending"   },
  cancelled: { variant: "danger",  label: "✕ Cancelled"  },
};

/** Units sold per category — colours are attached at render time from the theme. */
const catSales = Object.entries(
  menuItems.reduce(
    (acc, m) => {
      acc[m.category] = (acc[m.category] || 0) + m.sold;
      return acc;
    },
    {} as Record<string, number>
  )
).map(([name, value]) => ({ name, value }));

const sections = ["Menu", "Orders"];
const tabs = ["All", "Delivered", "Preparing", "Pending", "Cancelled"];

function Segmented({
  options,
  value,
  onChange,
  size = "sm",
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  size?: "sm" | "md";
}) {
  return (
    <div className="inline-flex gap-1 rounded-md bg-surface-sunken p-1">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={cn(
            "focus-ring whitespace-nowrap rounded-sm font-semibold transition-colors",
            size === "md" ? "px-5 py-2 text-sm" : "px-3.5 py-1.5 text-xs",
            value === o ? "bg-surface-raised text-text shadow-sm" : "text-muted hover:text-text"
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export default function CanteenPage() {
  const t = useChartTheme();

  const [section, setSection] = useState("Menu");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [catFilter, setCatFilter] = useState("All");

  const pieData = catSales.map((c) => ({
    ...c,
    color: t.series[categorySeries[c.name] ?? "primary"],
  }));

  const filteredMenu = menuItems.filter(
    (m) =>
      (catFilter === "All" || m.category === catFilter) &&
      m.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredOrders = orders.filter((o) => {
    const matchTab = activeTab === "All" || o.status === activeTab.toLowerCase();
    const matchSearch =
      o.customer.toLowerCase().includes(search.toLowerCase()) ||
      o.items.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const todayRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + o.total, 0);
  const totalOrders = orders.length;
  const delivered = orders.filter((o) => o.status === "delivered").length;
  const activeItems = menuItems.filter((m) => m.available).length;

  const menuColumns: Column<MenuItem>[] = [
    {
      key: "name",
      header: "Item",
      sortable: true,
      render: (m) => (
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-surface-sunken text-base">
            {m.emoji}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{m.name}</p>
            <p className="truncate text-xs text-subtle">{m.id}</p>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      render: (m) => <Badge variant={categoryVariant[m.category] ?? "default"}>{m.category}</Badge>,
    },
    {
      key: "price",
      header: "Price",
      sortable: true,
      align: "right",
      render: (m) => <span className="font-semibold text-text">₹{m.price}</span>,
    },
    {
      key: "sold",
      header: "Sold today",
      sortable: true,
      align: "right",
      render: (m) => <span className="font-medium text-muted">{m.sold}</span>,
    },
    {
      key: "available",
      header: "Status",
      sortable: true,
      render: (m) => (
        <Badge variant={m.available ? "success" : "danger"}>
          {m.available ? "✓ Available" : "✕ Unavailable"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (m) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" className="px-2" aria-label={`Edit ${m.name}`}>
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="px-2 hover:bg-danger-soft hover:text-danger"
            aria-label={`Delete ${m.name}`}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  const orderColumns: Column<Order>[] = [
    {
      key: "id",
      header: "Order ID",
      sortable: true,
      render: (o) => <span className="text-xs font-semibold text-primary-text">{o.id}</span>,
    },
    {
      key: "customer",
      header: "Customer",
      sortable: true,
      render: (o) => <span className="whitespace-nowrap font-medium text-text">{o.customer}</span>,
    },
    {
      key: "class",
      header: "Class",
      sortable: true,
      render: (o) => <Badge variant="info">{o.class}</Badge>,
    },
    {
      key: "items",
      header: "Items",
      render: (o) => <span className="block max-w-56 truncate text-muted">{o.items}</span>,
    },
    {
      key: "time",
      header: "Time",
      render: (o) => <span className="whitespace-nowrap text-muted">{o.time}</span>,
    },
    {
      key: "total",
      header: "Total",
      sortable: true,
      align: "right",
      render: (o) => <span className="font-semibold text-text">₹{o.total}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (o) => (
        <Badge variant={statusConfig[o.status].variant}>{statusConfig[o.status].label}</Badge>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Canteen"
        description="Manage menu, orders and daily sales."
        actions={
          <>
            <Button variant="outline">
              <Download className="size-4" />
              Export
            </Button>
            <Button>
              <Plus className="size-4" />
              Add item
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Today's revenue"
          value={`₹${todayRevenue.toLocaleString()}`}
          icon={Wallet}
          tone="indigo"
        />
        <StatCard label="Total orders" value={totalOrders} icon={ReceiptText} tone="emerald" />
        <StatCard label="Delivered" value={delivered} icon={CheckCircle} tone="cyan" />
        <StatCard label="Active menu items" value={activeItems} icon={UtensilsCrossed} tone="amber" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text">Weekly revenue</p>
              <p className="mt-0.5 text-xs text-muted">Daily canteen sales this week</p>
            </div>
            <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted">
              <span className="size-2.5 rounded-sm" style={{ background: t.series.success }} />
              Revenue
            </span>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={salesData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 12, fill: t.axis }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: t.axis }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(1)}k`}
                />
                <Tooltip
                  contentStyle={t.tooltip}
                  cursor={{ fill: t.cursor, radius: 6 }}
                  formatter={(v) => [`₹${Number(v).toLocaleString("en-IN")}`, "Revenue"]}
                />
                <Bar dataKey="revenue" fill={t.series.success} radius={[6, 6, 0, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text">Sales by category</p>
              <p className="mt-0.5 text-xs text-muted">Items sold per category</p>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3">
            <ResponsiveContainer width="100%" height={150}>
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
                <Tooltip contentStyle={t.tooltip} formatter={(v) => [`${v} sold`, ""]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex w-full flex-col gap-1.5">
              {pieData.map((c) => (
                <div key={c.name} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-xs text-muted">
                    <span className="size-2.5 rounded-sm" style={{ background: c.color }} />
                    {c.name}
                  </span>
                  <span className="text-xs font-semibold text-text">{c.value} sold</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Segmented
        options={sections}
        value={section}
        onChange={(v) => {
          setSection(v);
          setSearch("");
          setActiveTab("All");
          setCatFilter("All");
        }}
        size="md"
      />

      {section === "Menu" && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-48">
              <Select
                value={catFilter}
                onChange={(e) => setCatFilter(e.target.value)}
                aria-label="Filter by category"
                options={[
                  { label: "All categories", value: "All" },
                  ...categories.map((c) => ({ label: c, value: c })),
                ]}
              />
            </div>
            <div className="min-w-60 flex-1">
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search menu…"
                icon={<Search className="size-4" />}
                aria-label="Search menu"
              />
            </div>
            <p className="text-xs text-muted">{filteredMenu.length} items</p>
          </div>

          <Table
            columns={menuColumns}
            rows={filteredMenu}
            rowKey={(m) => m.id}
            emptyTitle="No menu items found"
            emptyDescription="Try adjusting your category filter or search."
          />
        </>
      )}

      {section === "Orders" && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <Segmented options={tabs} value={activeTab} onChange={setActiveTab} />
            <div className="min-w-60 flex-1">
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search orders…"
                icon={<Search className="size-4" />}
                aria-label="Search orders"
              />
            </div>
            <p className="text-xs text-muted">{filteredOrders.length} orders</p>
          </div>

          <Table
            columns={orderColumns}
            rows={filteredOrders}
            rowKey={(o) => o.id}
            emptyTitle="No orders found"
            emptyDescription="Try a different tab or search term."
          />

          <div className="flex flex-wrap items-center justify-between gap-3 px-1">
            <p className="text-xs text-muted">
              Showing <span className="font-medium text-text">{filteredOrders.length}</span> of{" "}
              <span className="font-medium text-text">{orders.length}</span> orders
            </p>
            <p className="text-sm font-semibold text-text">
              Total:{" "}
              <span className="text-success">
                ₹
                {filteredOrders
                  .filter((o) => o.status !== "cancelled")
                  .reduce((s, o) => s + o.total, 0)
                  .toLocaleString()}
              </span>
            </p>
          </div>
        </>
      )}
    </div>
  );
}

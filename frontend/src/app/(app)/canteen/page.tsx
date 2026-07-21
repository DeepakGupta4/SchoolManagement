"use client";

import { useMemo, useState } from "react";
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
  ConfirmDialog,
  Input,
  PageHeader,
  Select,
  StatCard,
  Table,
  type Column,
} from "@/components/ui";
import { useChartTheme, toneClass, type ChartTone } from "@/hooks/useChartTheme";
import { useResource } from "@/hooks/useResource";
import {
  menuItemsApi,
  CATEGORY_OPTIONS,
  AVAILABILITY_OPTIONS,
  type MenuItem,
} from "@/lib/api/menuItems";
import type { MenuItemSchema } from "@/lib/schemas/menuItem";
import { cn } from "@/lib/utils";
import { MenuItemFormModal } from "./MenuItemFormModal";

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

type Order = (typeof orders)[number];

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

const categoryVariant: Record<string, BadgeVariant> = {
  Meals: "warning",
  Snacks: "default",
  Drinks: "info",
  Healthy: "success",
};

/** Tone per category — drives both the pie Cell fill and the legend swatch class. */
const categorySeries: Record<string, ChartTone> = {
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
  const [availFilter, setAvailFilter] = useState("All");

  // The search box is shared with the orders section, so only feed it to the
  // menu query while the menu is on screen.
  const filters = useMemo(
    () => ({
      search: section === "Menu" ? search : "",
      category: catFilter,
      availability: availFilter,
    }),
    [section, search, catFilter, availFilter]
  );

  const { items, loading, error, refetch, save, remove, saving, deleting } = useResource(
    menuItemsApi,
    filters,
    { label: "menu item", describe: (m) => m.name }
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<MenuItem | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleSubmit = async (values: MenuItemSchema) => {
    const ok = await save({ ...values, available: values.available === "true" }, editing);
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

  /** Units sold per category — colours are attached from the theme at render time. */
  const pieData = useMemo(() => {
    const totals = items.reduce<Record<string, number>>((acc, m) => {
      acc[m.category] = (acc[m.category] || 0) + m.sold;
      return acc;
    }, {});
    return Object.entries(totals).map(([name, value]) => {
      const tone = categorySeries[name] ?? "primary";
      // `color` is for recharts only; `tone` is what the DOM swatch uses.
      return { name, value, tone, color: t.series[tone] };
    });
  }, [items, t]);

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
  const activeItems = items.filter((m) => m.available).length;

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
          <button
            onClick={() => {
              setEditing(m);
              setFormOpen(true);
            }}
            aria-label={`Edit ${m.name}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Pencil className="size-4" />
          </button>
          <button
            onClick={() => setPendingDelete(m)}
            aria-label={`Delete ${m.name}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-danger-soft hover:text-danger"
          >
            <Trash2 className="size-4" />
          </button>
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
            <Button onClick={openCreate}>
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
              <span className={cn("size-2.5 rounded-sm", toneClass.success)} />
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
                    <span className={cn("size-2.5 rounded-sm", toneClass[c.tone])} />
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
          setAvailFilter("All");
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
                  ...CATEGORY_OPTIONS.map((c) => ({ label: c, value: c })),
                ]}
              />
            </div>
            <div className="w-44">
              <Select
                value={availFilter}
                onChange={(e) => setAvailFilter(e.target.value)}
                aria-label="Filter by availability"
                options={[{ label: "All statuses", value: "All" }, ...AVAILABILITY_OPTIONS]}
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
            <p className="text-xs text-muted">{items.length} items</p>
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
            <Table
              columns={menuColumns}
              rows={items}
              rowKey={(m) => m.id}
              loading={loading}
              emptyTitle="No menu items found"
              emptyDescription={
                search || catFilter !== "All" || availFilter !== "All"
                  ? "Try adjusting your category filter or search."
                  : "Add your first menu item to get started."
              }
              emptyAction={
                <Button variant="outline" onClick={openCreate}>
                  <Plus className="size-4" />
                  Add item
                </Button>
              }
            />
          )}
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

      <MenuItemFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        record={editing}
        saving={saving}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete menu item?"
        description={
          pendingDelete
            ? `${pendingDelete.name} will be permanently removed from the canteen menu. This cannot be undone.`
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

"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  Download,
  Eye,
  Pencil,
  Trash2,
  Wallet,
  ReceiptText,
  CheckCircle,
  UtensilsCrossed,
} from "lucide-react";
import {
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
import { DetailModal } from "@/components/DetailModal";
import { MenuItemFormModal } from "./MenuItemFormModal";

type Order = {
  id: string;
  customer: string;
  class: string;
  items: string;
  total: number;
  time: string;
  status: "delivered" | "preparing" | "pending" | "cancelled";
};

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

const sections = ["Menu", "Orders"];

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
  const { toast } = useToast();

  const [section, setSection] = useState("Menu");
  const [search, setSearch] = useState("");
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
  const [viewing, setViewing] = useState<MenuItem | null>(null);
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

  // Orders have no backend yet — the pipeline renders an empty state.
  const filteredOrders: Order[] = [];

  const todayRevenue = 0;
  const totalOrders = 0;
  const delivered = 0;
  const activeItems = items.filter((m) => m.available).length;

  /** Exports whichever section is on screen, matching what the user can see. */
  const handleExport = () => {
    const onMenu = section === "Menu";
    const count = onMenu ? items.length : filteredOrders.length;
    if (count === 0) {
      toast({
        title: "Nothing to export",
        description: `No ${onMenu ? "menu items" : "orders"} match the current filters.`,
        variant: "warning",
      });
      return;
    }
    if (onMenu) {
      exportToCsv<MenuItem>(
        "canteen-menu",
        [
          { header: "Code", value: (m) => m.code },
          { header: "Item", value: (m) => m.name },
          { header: "Category", value: (m) => m.category },
          { header: "Price (INR)", value: (m) => m.price },
          { header: "Available", value: (m) => (m.available ? "Yes" : "No") },
          { header: "Units Sold", value: (m) => m.sold },
        ],
        items
      );
    } else {
      exportToCsv<Order>(
        "canteen-orders",
        [
          { header: "Order ID", value: (o) => o.id },
          { header: "Customer", value: (o) => o.customer },
          { header: "Class", value: (o) => o.class },
          { header: "Items", value: (o) => o.items },
          { header: "Total (INR)", value: (o) => o.total },
          { header: "Time", value: (o) => o.time },
          // Badge labels carry a decorative glyph; the CSV wants the plain word.
          { header: "Status", value: (o) => o.status.charAt(0).toUpperCase() + o.status.slice(1) },
        ],
        filteredOrders
      );
    }
    toast({
      title: "Export ready",
      description: `${count} ${onMenu ? "menu item" : "order"}${count === 1 ? "" : "s"} exported to CSV.`,
    });
  };

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
            <p className="truncate text-xs text-subtle">{m.code}</p>
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
            onClick={() => setViewing(m)}
            aria-label={`View ${m.name}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Eye className="size-4" />
          </button>
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

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Canteen"
        description="Manage menu, orders and daily sales."
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
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
            <EmptyState
              icon={<Wallet className="size-5" />}
              title="No sales data yet"
              description="Daily canteen revenue will appear here once orders come in."
            />
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
        <Card>
          <EmptyState
            icon={<ReceiptText className="size-5" />}
            title="No orders yet"
            description="Canteen orders will show up here once students start ordering."
          />
        </Card>
      )}

      <MenuItemFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        record={editing}
        saving={saving}
        onSubmit={handleSubmit}
      />

      <DetailModal
        open={Boolean(viewing)}
        onOpenChange={(o) => !o && setViewing(null)}
        title={viewing ? `${viewing.emoji} ${viewing.name}` : "Menu Item"}
        description={viewing ? `${viewing.code} · ${viewing.category}` : ""}
        rows={
          viewing
            ? [
                { label: "Code", value: viewing.code },
                { label: "Item", value: viewing.name },
                { label: "Category", value: viewing.category },
                { label: "Price", value: `₹${viewing.price}` },
                { label: "Availability", value: viewing.available ? "Available" : "Unavailable" },
                { label: "Sold today", value: viewing.sold },
              ]
            : []
        }
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

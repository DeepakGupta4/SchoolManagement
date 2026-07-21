"use client";

import React, { useMemo, useState } from "react";
import {
  Search,
  Plus,
  Download,
  Pencil,
  Trash2,
  AlertTriangle,
  Package,
  PackageX,
  Wallet,
  CheckCircle,
  Clock,
  type LucideIcon,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  ConfirmDialog,
  Input,
  PageHeader,
  Select,
  StatCard,
  Table,
  useToast,
  type Column,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { exportToCsv } from "@/lib/exportCsv";
import { useResource } from "@/hooks/useResource";
import {
  inventoryApi,
  CATEGORY_OPTIONS,
  TAB_TO_STATUS,
  type InventoryItem,
} from "@/lib/api/inventory";
import type { InventoryItemSchema } from "@/lib/schemas/inventoryItem";
import { InventoryFormModal } from "./InventoryFormModal";

const purchases = [
  { id: "PO001", item: "A4 Paper Reams",        qty: 100, amount: 28000,  date: "Jul 15, 2025", supplier: "Paper World",   status: "received" },
  { id: "PO002", item: "Printer Ink Cartridges",qty: 10,  amount: 12000,  date: "Jul 18, 2025", supplier: "Tech Supplies", status: "ordered"  },
  { id: "PO003", item: "Sports Balls",          qty: 10,  amount: 8000,   date: "Jul 20, 2025", supplier: "Sports World",  status: "ordered"  },
  { id: "PO004", item: "First Aid Kits",        qty: 5,   amount: 9000,   date: "Jul 17, 2025", supplier: "MedSupply Co.", status: "received" },
  { id: "PO005", item: "Whiteboard Markers",    qty: 20,  amount: 3000,   date: "Jul 12, 2025", supplier: "Office Mart",   status: "received" },
];

type Purchase = (typeof purchases)[number];

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

const categoryStyles: Record<string, { variant: BadgeVariant; emoji: string }> = {
  Stationery:   { variant: "info",    emoji: "✏️" },
  Electronics:  { variant: "default", emoji: "💻" },
  Furniture:    { variant: "warning", emoji: "🪑" },
  Housekeeping: { variant: "success", emoji: "🧹" },
  Sports:       { variant: "danger",  emoji: "⚽" },
  Lab:          { variant: "info",    emoji: "🧪" },
  Medical:      { variant: "default", emoji: "🏥" },
};

const statusConfig: Record<string, { variant: BadgeVariant; label: string; bar: string }> = {
  "in-stock":     { variant: "success", label: "In stock",     bar: "bg-success" },
  "low-stock":    { variant: "warning", label: "Low stock",    bar: "bg-warning" },
  "out-of-stock": { variant: "danger",  label: "Out of stock", bar: "bg-danger"  },
};

const fallbackStatus = { variant: "default" as BadgeVariant, label: "Unknown", bar: "bg-primary" };

const poStatus: Record<string, { variant: BadgeVariant; icon: LucideIcon }> = {
  received: { variant: "success", icon: CheckCircle },
  ordered:  { variant: "warning", icon: Clock },
};

const tabs = ["All", "In Stock", "Low Stock", "Out of Stock"];
const sections = ["Inventory", "Purchase Orders"];

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

export default function InventoryPage() {
  const [activeSection, setActiveSection] = useState("Inventory");
  const [activeTab, setActiveTab] = useState("All");
  const [catFilter, setCatFilter] = useState("All");
  const [search, setSearch] = useState("");

  // The stock-status tab is deliberately left out of the server filters: the
  // stat cards need per-status counts across the whole (otherwise filtered)
  // set, so the tab narrowing is applied during render instead.
  const filters = useMemo(() => ({ search, category: catFilter }), [search, catFilter]);

  const { items, loading, error, refetch, save, remove, saving, deleting } = useResource(
    inventoryApi,
    filters,
    { label: "item", describe: (i) => i.name }
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<InventoryItem | null>(null);
  const { toast } = useToast();

  // Rows for the table only — stat cards keep counting the full `items`.
  const visible = useMemo(
    () =>
      activeTab === "All"
        ? items
        : items.filter((i) => i.status === TAB_TO_STATUS[activeTab]),
    [items, activeTab]
  );

  const handleExport = () => {
    if (visible.length === 0) {
      toast({
        title: "Nothing to export",
        description: "No inventory items match the current filters.",
        variant: "warning",
      });
      return;
    }
    exportToCsv<InventoryItem>(
      "inventory",
      [
        { header: "Code", value: (i) => i.code },
        { header: "Item", value: (i) => i.name },
        { header: "Category", value: (i) => i.category },
        { header: "Quantity", value: (i) => i.qty },
        { header: "Min Quantity", value: (i) => i.minQty },
        { header: "Unit", value: (i) => i.unit },
        { header: "Unit Price (INR)", value: (i) => i.unitPrice },
        { header: "Stock Value (INR)", value: (i) => i.qty * i.unitPrice },
        { header: "Supplier", value: (i) => i.supplier },
        { header: "Last Updated", value: (i) => i.lastUpdated },
        { header: "Status", value: (i) => i.status },
      ],
      visible
    );
    toast({
      title: "Export ready",
      description: `${visible.length} item${visible.length === 1 ? "" : "s"} exported to CSV.`,
    });
  };

  const stats = useMemo(
    () => ({
      total: items.length,
      lowStock: items.filter((i) => i.status === "low-stock").length,
      outOfStock: items.filter((i) => i.status === "out-of-stock").length,
      totalValue: items.reduce((s, i) => s + i.qty * i.unitPrice, 0),
    }),
    [items]
  );

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleSubmit = async (values: InventoryItemSchema) => {
    const ok = await save(values, editing);
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

  const itemColumns: Column<InventoryItem>[] = [
    {
      key: "name",
      header: "Item",
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-surface-sunken text-base">
            {categoryStyles[item.category]?.emoji ?? "📌"}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{item.name}</p>
            <p className="truncate text-xs text-subtle">{item.code}</p>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      render: (item) => (
        <Badge variant={categoryStyles[item.category]?.variant ?? "default"}>{item.category}</Badge>
      ),
    },
    {
      key: "qty",
      header: "Qty",
      sortable: true,
      render: (item) => {
        const sc = statusConfig[item.status] ?? fallbackStatus;
        const stockPct = item.minQty
          ? Math.min(Math.round((item.qty / (item.minQty * 2)) * 100), 100)
          : 100;
        return (
          <div className="flex flex-col gap-1">
            <span
              className={cn(
                "text-sm font-semibold",
                item.status === "out-of-stock"
                  ? "text-danger"
                  : item.status === "low-stock"
                    ? "text-warning"
                    : "text-success"
              )}
            >
              {item.qty}
            </span>
            <div className="h-1 w-16 overflow-hidden rounded-full bg-surface-hover">
              <div className={cn("h-full rounded-full", sc.bar)} style={{ width: `${stockPct}%` }} />
            </div>
          </div>
        );
      },
    },
    {
      key: "minQty",
      header: "Min qty",
      sortable: true,
      align: "right",
      render: (item) => <span className="text-muted">{item.minQty}</span>,
    },
    {
      key: "unit",
      header: "Unit",
      render: (item) => <span className="text-muted">{item.unit}</span>,
    },
    {
      key: "unitPrice",
      header: "Unit price",
      sortable: true,
      align: "right",
      render: (item) => (
        <span className="whitespace-nowrap text-muted">₹{item.unitPrice.toLocaleString()}</span>
      ),
    },
    {
      key: "totalValue",
      header: "Total value",
      sortable: true,
      align: "right",
      sortValue: (item) => item.qty * item.unitPrice,
      render: (item) => (
        <span className="whitespace-nowrap font-semibold text-text">
          ₹{(item.qty * item.unitPrice).toLocaleString()}
        </span>
      ),
    },
    {
      key: "supplier",
      header: "Supplier",
      sortable: true,
      render: (item) => <span className="whitespace-nowrap text-muted">{item.supplier}</span>,
    },
    {
      key: "lastUpdated",
      header: "Last updated",
      render: (item) => <span className="whitespace-nowrap text-subtle">{item.lastUpdated}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (item) => {
        const sc = statusConfig[item.status] ?? fallbackStatus;
        return <Badge variant={sc.variant}>{sc.label}</Badge>;
      },
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => {
              setEditing(item);
              setFormOpen(true);
            }}
            aria-label={`Edit ${item.name}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Pencil className="size-4" />
          </button>
          <button
            onClick={() => setPendingDelete(item)}
            aria-label={`Delete ${item.name}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-danger-soft hover:text-danger"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ),
    },
  ];

  const poColumns: Column<Purchase>[] = [
    {
      key: "id",
      header: "PO ID",
      sortable: true,
      render: (po) => <span className="text-xs font-semibold text-primary-text">{po.id}</span>,
    },
    {
      key: "item",
      header: "Item",
      sortable: true,
      render: (po) => (
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-primary-soft text-primary-text">
            <Package className="size-3.5" />
          </div>
          <span className="font-medium text-text">{po.item}</span>
        </div>
      ),
    },
    {
      key: "qty",
      header: "Quantity",
      sortable: true,
      align: "right",
      render: (po) => <span className="whitespace-nowrap font-medium text-muted">{po.qty} units</span>,
    },
    {
      key: "amount",
      header: "Amount",
      sortable: true,
      align: "right",
      render: (po) => (
        <span className="whitespace-nowrap font-semibold text-text">
          ₹{po.amount.toLocaleString()}
        </span>
      ),
    },
    {
      key: "supplier",
      header: "Supplier",
      sortable: true,
      render: (po) => <span className="whitespace-nowrap text-muted">{po.supplier}</span>,
    },
    {
      key: "date",
      header: "Order date",
      render: (po) => <span className="whitespace-nowrap text-muted">{po.date}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (po) => {
        const ps = poStatus[po.status];
        const StatusIcon = ps.icon;
        return (
          <Badge variant={ps.variant} className="gap-1 capitalize">
            <StatusIcon className="size-3" />
            {po.status}
          </Badge>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Inventory"
        description="Track school assets, stock levels and purchase orders."
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
        <StatCard label="Total items" value={stats.total} icon={Package} tone="indigo" />
        <StatCard label="Low stock" value={stats.lowStock} icon={AlertTriangle} tone="amber" />
        <StatCard label="Out of stock" value={stats.outOfStock} icon={PackageX} tone="rose" />
        <StatCard
          label="Total value"
          value={`₹${(stats.totalValue / 100000).toFixed(1)}L`}
          icon={Wallet}
          tone="emerald"
        />
      </div>

      {(stats.lowStock > 0 || stats.outOfStock > 0) && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-warning bg-warning-soft px-5 py-3.5">
          <AlertTriangle className="size-4.5 shrink-0 text-warning" />
          <p className="text-sm font-semibold text-warning-text">
            {stats.outOfStock > 0 && (
              <span className="text-danger-text">{stats.outOfStock} item(s) out of stock</span>
            )}
            {stats.outOfStock > 0 && stats.lowStock > 0 && <span className="mx-2 text-subtle">·</span>}
            {stats.lowStock > 0 && <span>{stats.lowStock} item(s) running low</span>}
            <span className="ml-2 font-normal text-muted">— Consider placing purchase orders</span>
          </p>
        </div>
      )}

      <Segmented
        options={sections}
        value={activeSection}
        onChange={(v) => {
          setActiveSection(v);
          setSearch("");
        }}
        size="md"
      />

      {activeSection === "Inventory" && (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <Segmented options={tabs} value={activeTab} onChange={setActiveTab} />
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
            <div className="min-w-60 flex-1">
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search items, suppliers…"
                icon={<Search className="size-4" />}
                aria-label="Search inventory"
              />
            </div>
            <p className="text-xs text-muted">{visible.length} items</p>
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
              columns={itemColumns}
              rows={visible}
              rowKey={(i) => i.id}
              loading={loading}
              emptyTitle="No items found"
              emptyDescription={
                search || catFilter !== "All" || activeTab !== "All"
                  ? "Try adjusting your filters or search."
                  : "Add your first item to get started."
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

      {activeSection === "Purchase Orders" && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-text">Recent purchase orders</p>
            <Button size="sm">
              <Plus className="size-3.5" />
              New order
            </Button>
          </div>

          <Table
            columns={poColumns}
            rows={purchases}
            rowKey={(p) => p.id}
            emptyTitle="No purchase orders"
            emptyDescription="Raise a new order to get started."
          />
        </>
      )}

      <InventoryFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        record={editing}
        saving={saving}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete item?"
        description={
          pendingDelete
            ? `${pendingDelete.name} will be permanently removed from inventory. This cannot be undone.`
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

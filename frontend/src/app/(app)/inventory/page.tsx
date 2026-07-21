"use client";

import React, { useState } from "react";
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
  Input,
  PageHeader,
  Select,
  StatCard,
  Table,
  type Column,
} from "@/components/ui";
import { cn } from "@/lib/utils";

const inventory = [
  { id: "INV001", name: "A4 Paper Reams",         category: "Stationery",  qty: 120, minQty: 50,  unit: "Reams",  unitPrice: 280,   supplier: "Paper World",      lastUpdated: "Jul 15, 2025", status: "in-stock"   },
  { id: "INV002", name: "Whiteboard Markers",      category: "Stationery",  qty: 45,  minQty: 30,  unit: "Boxes",  unitPrice: 150,   supplier: "Office Mart",      lastUpdated: "Jul 12, 2025", status: "in-stock"   },
  { id: "INV003", name: "Printer Ink Cartridges",  category: "Electronics", qty: 8,   minQty: 10,  unit: "Pcs",    unitPrice: 1200,  supplier: "Tech Supplies",    lastUpdated: "Jul 10, 2025", status: "low-stock"  },
  { id: "INV004", name: "Classroom Chairs",        category: "Furniture",   qty: 240, minQty: 200, unit: "Pcs",    unitPrice: 2500,  supplier: "Furniture Hub",    lastUpdated: "Jun 20, 2025", status: "in-stock"   },
  { id: "INV005", name: "Projector Bulbs",         category: "Electronics", qty: 3,   minQty: 5,   unit: "Pcs",    unitPrice: 3500,  supplier: "Tech Supplies",    lastUpdated: "Jul 08, 2025", status: "low-stock"  },
  { id: "INV006", name: "Cleaning Supplies Kit",   category: "Housekeeping",qty: 60,  minQty: 20,  unit: "Kits",   unitPrice: 450,   supplier: "Clean Pro",        lastUpdated: "Jul 14, 2025", status: "in-stock"   },
  { id: "INV007", name: "Sports Balls (Football)", category: "Sports",      qty: 0,   minQty: 5,   unit: "Pcs",    unitPrice: 800,   supplier: "Sports World",     lastUpdated: "Jun 28, 2025", status: "out-of-stock"},
  { id: "INV008", name: "Lab Chemicals Set",       category: "Lab",         qty: 15,  minQty: 10,  unit: "Sets",   unitPrice: 5500,  supplier: "Science Depot",    lastUpdated: "Jul 05, 2025", status: "in-stock"   },
  { id: "INV009", name: "Notebooks (200 pages)",   category: "Stationery",  qty: 500, minQty: 100, unit: "Pcs",    unitPrice: 60,    supplier: "Paper World",      lastUpdated: "Jul 16, 2025", status: "in-stock"   },
  { id: "INV010", name: "First Aid Kits",          category: "Medical",     qty: 4,   minQty: 5,   unit: "Kits",   unitPrice: 1800,  supplier: "MedSupply Co.",    lastUpdated: "Jul 01, 2025", status: "low-stock"  },
  { id: "INV011", name: "Desktops / PCs",          category: "Electronics", qty: 42,  minQty: 40,  unit: "Pcs",    unitPrice: 35000, supplier: "Tech Supplies",    lastUpdated: "Apr 10, 2025", status: "in-stock"   },
  { id: "INV012", name: "Badminton Rackets",       category: "Sports",      qty: 12,  minQty: 8,   unit: "Pcs",    unitPrice: 600,   supplier: "Sports World",     lastUpdated: "Jun 15, 2025", status: "in-stock"   },
];

const purchases = [
  { id: "PO001", item: "A4 Paper Reams",        qty: 100, amount: 28000,  date: "Jul 15, 2025", supplier: "Paper World",   status: "received" },
  { id: "PO002", item: "Printer Ink Cartridges",qty: 10,  amount: 12000,  date: "Jul 18, 2025", supplier: "Tech Supplies", status: "ordered"  },
  { id: "PO003", item: "Sports Balls",          qty: 10,  amount: 8000,   date: "Jul 20, 2025", supplier: "Sports World",  status: "ordered"  },
  { id: "PO004", item: "First Aid Kits",        qty: 5,   amount: 9000,   date: "Jul 17, 2025", supplier: "MedSupply Co.", status: "received" },
  { id: "PO005", item: "Whiteboard Markers",    qty: 20,  amount: 3000,   date: "Jul 12, 2025", supplier: "Office Mart",   status: "received" },
];

type Item = (typeof inventory)[number];
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

  const filtered = inventory.filter((item) => {
    const tabMap: Record<string, string> = {
      "In Stock": "in-stock",
      "Low Stock": "low-stock",
      "Out of Stock": "out-of-stock",
    };
    const matchTab = activeTab === "All" || item.status === tabMap[activeTab];
    const matchCat = catFilter === "All" || item.category === catFilter;
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.id.toLowerCase().includes(search.toLowerCase()) ||
      item.supplier.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchCat && matchSearch;
  });

  const lowStockItems = inventory.filter((i) => i.status === "low-stock").length;
  const outOfStock = inventory.filter((i) => i.status === "out-of-stock").length;
  const totalValue = inventory.reduce((s, i) => s + i.qty * i.unitPrice, 0);

  const itemColumns: Column<Item>[] = [
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
            <p className="truncate text-xs text-subtle">{item.id}</p>
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
        const sc = statusConfig[item.status];
        const stockPct = Math.min(Math.round((item.qty / (item.minQty * 2)) * 100), 100);
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
      render: (item) => (
        <Badge variant={statusConfig[item.status].variant}>{statusConfig[item.status].label}</Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" className="px-2" aria-label={`Edit ${item.name}`}>
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="px-2 hover:bg-danger-soft hover:text-danger"
            aria-label={`Delete ${item.name}`}
          >
            <Trash2 className="size-4" />
          </Button>
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
        <StatCard label="Total items" value={inventory.length} icon={Package} tone="indigo" />
        <StatCard label="Low stock" value={lowStockItems} icon={AlertTriangle} tone="amber" />
        <StatCard label="Out of stock" value={outOfStock} icon={PackageX} tone="rose" />
        <StatCard
          label="Total value"
          value={`₹${(totalValue / 100000).toFixed(1)}L`}
          icon={Wallet}
          tone="emerald"
        />
      </div>

      {(lowStockItems > 0 || outOfStock > 0) && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-warning bg-warning-soft px-5 py-3.5">
          <AlertTriangle className="size-4.5 shrink-0 text-warning" />
          <p className="text-sm font-semibold text-warning-text">
            {outOfStock > 0 && <span className="text-danger-text">{outOfStock} item(s) out of stock</span>}
            {outOfStock > 0 && lowStockItems > 0 && <span className="mx-2 text-subtle">·</span>}
            {lowStockItems > 0 && <span>{lowStockItems} item(s) running low</span>}
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
                  ...Object.keys(categoryStyles).map((c) => ({ label: c, value: c })),
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
            <p className="text-xs text-muted">{filtered.length} items</p>
          </div>

          <Table
            columns={itemColumns}
            rows={filtered}
            rowKey={(i) => i.id}
            emptyTitle="No items found"
            emptyDescription="Try adjusting your filters or search."
          />
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
    </div>
  );
}

"use client";

import React, { useMemo, useState } from "react";
import {
  BookOpen,
  Download,
  Eye,
  Layers,
  Pencil,
  Plus,
  Search,
  TrendingDown,
  TrendingUp,
  Trash2,
  Wallet,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  ConfirmDialog,
  Input,
  PageHeader,
  StatCard,
  Table,
  useToast,
  type Column,
} from "@/components/ui";
import { exportToCsv } from "@/lib/exportCsv";
import { useResource } from "@/hooks/useResource";
import {
  feeStructuresApi,
  feeTotal,
  structureHeads,
  type FeeStructure,
} from "@/lib/api/feeStructures";
import type { FeeStructureSchema } from "@/lib/schemas/feeStructure";
import { DetailModal } from "@/components/DetailModal";
import { FeeStructureFormModal } from "./FeeStructureFormModal";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function FeeStructurePage() {
  const [search, setSearch] = useState("");

  const filters = useMemo(() => ({ search }), [search]);

  const { items, loading, error, refetch, save, remove, saving, deleting } = useResource(
    feeStructuresApi,
    filters,
    { label: "fee structure", describe: (f) => f.class }
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FeeStructure | null>(null);
  const [viewing, setViewing] = useState<FeeStructure | null>(null);
  const [pendingDelete, setPendingDelete] = useState<FeeStructure | null>(null);
  const { toast } = useToast();

  const handleExport = () => {
    if (items.length === 0) {
      toast({
        title: "Nothing to export",
        description: "No fee structures match the current search.",
        variant: "warning",
      });
      return;
    }
    exportToCsv<FeeStructure>(
      "fee-structure",
      [
        { header: "Code", value: (f) => f.code },
        { header: "Class", value: (f) => f.class },
        { header: "Monthly Total (INR)", value: (f) => feeTotal(f) },
        // Fixed-width regardless of head count: all heads collapsed into one cell.
        {
          header: "Heads",
          value: (f) =>
            structureHeads(f)
              .map((h) => `${h.name}: ₹${h.amount}`)
              .join("; "),
        },
      ],
      items
    );
    toast({
      title: "Export ready",
      description: `${items.length} fee structure${items.length === 1 ? "" : "s"} exported to CSV.`,
    });
  };

  const stats = useMemo(() => {
    const totals = items.map(feeTotal);
    const sum = totals.reduce((a, b) => a + b, 0);
    return {
      categories: items.length,
      lowest: totals.length ? Math.min(...totals) : 0,
      highest: totals.length ? Math.max(...totals) : 0,
      average: totals.length ? Math.round(sum / totals.length) : 0,
    };
  }, [items]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleSubmit = async (values: FeeStructureSchema) => {
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

  const columns: Column<FeeStructure>[] = [
    {
      key: "class",
      header: "Class",
      sortable: true,
      render: (f) => (
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary-text">
            <BookOpen className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{f.class}</p>
            <p className="truncate text-xs text-subtle">{f.code}</p>
          </div>
        </div>
      ),
    },
    {
      key: "total",
      header: "Total",
      align: "right",
      sortable: true,
      render: (f) => (
        <span className="whitespace-nowrap font-semibold text-primary">
          {inr.format(feeTotal(f))}
        </span>
      ),
    },
    {
      key: "heads",
      header: "Fee heads",
      render: (f) => {
        const heads = structureHeads(f);
        if (heads.length === 0) return <span className="text-subtle">—</span>;
        const names = heads.map((h) => h.name).join(", ");
        return (
          <div className="min-w-0">
            <p className="font-medium text-text">
              {heads.length} {heads.length === 1 ? "head" : "heads"}
            </p>
            <p className="max-w-56 truncate text-xs text-subtle" title={names}>
              {names}
            </p>
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (f) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => setViewing(f)}
            aria-label={`View ${f.class} fee structure`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Eye className="size-4" />
          </button>
          <button
            onClick={() => {
              setEditing(f);
              setFormOpen(true);
            }}
            aria-label={`Edit ${f.class} fee structure`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Pencil className="size-4" />
          </button>
          <button
            onClick={() => setPendingDelete(f)}
            aria-label={`Delete ${f.class} fee structure`}
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
        title="Fee Structure"
        description="Define and manage class-wise fee heads"
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download className="size-4" />
              Export
            </Button>
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Add Structure
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Fee Categories" value={stats.categories} icon={Layers} tone="indigo" />
        <StatCard label="Lowest Fee" value={inr.format(stats.lowest)} icon={TrendingDown} tone="emerald" />
        <StatCard label="Highest Fee" value={inr.format(stats.highest)} icon={TrendingUp} tone="rose" />
        <StatCard label="Average Fee" value={inr.format(stats.average)} icon={Wallet} tone="violet" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-60 flex-1">
          <Input
            type="search"
            placeholder="Search class…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search fee structures"
          />
        </div>
        <p className="text-xs text-muted">{items.length} structures</p>
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
          columns={columns}
          rows={items}
          rowKey={(f) => f.id}
          loading={loading}
          emptyTitle="No fee structures found"
          emptyDescription={
            search
              ? "Try clearing your search to see more results."
              : "Add your first fee structure to get started."
          }
          emptyAction={
            <Button variant="outline" onClick={openCreate}>
              <Plus className="size-4" />
              Add Structure
            </Button>
          }
        />
      )}

      <FeeStructureFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        record={editing}
        existing={items}
        saving={saving}
        onSubmit={handleSubmit}
      />

      <DetailModal
        open={Boolean(viewing)}
        onOpenChange={(o) => !o && setViewing(null)}
        title={viewing ? `Class ${viewing.class}` : "Fee Structure"}
        description={viewing ? `${viewing.code} · ${inr.format(feeTotal(viewing))} / month` : ""}
        rows={
          viewing
            ? [
                { label: "Code", value: viewing.code },
                { label: "Class", value: viewing.class },
                ...structureHeads(viewing).map((head) => ({
                  label: head.name,
                  value: inr.format(head.amount),
                })),
                { label: "Monthly total", value: inr.format(feeTotal(viewing)) },
              ]
            : []
        }
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete fee structure?"
        description={
          pendingDelete
            ? `The fee structure for ${pendingDelete.class} (${pendingDelete.code}) will be permanently removed. This cannot be undone.`
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

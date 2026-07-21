"use client";

import React, { useMemo, useState } from "react";
import {
  BookOpen,
  Download,
  Layers,
  Pencil,
  Plus,
  Search,
  TrendingDown,
  TrendingUp,
  Trash2,
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
import { FEE_HEADS, feeStructuresApi, feeTotal, type FeeStructure } from "@/lib/api/feeStructures";
import type { FeeStructureSchema } from "@/lib/schemas/feeStructure";
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
        // One column per fee head, in the same order the table shows them.
        ...FEE_HEADS.map((head) => ({
          header: `${head.label} (INR)`,
          value: (f: FeeStructure) => f[head.key] as number,
        })),
        { header: "Monthly Total (INR)", value: (f) => feeTotal(f) },
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
    return {
      categories: items.length,
      lowest: totals.length ? Math.min(...totals) : 0,
      highest: totals.length ? Math.max(...totals) : 0,
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
    ...FEE_HEADS.map<Column<FeeStructure>>(({ key, header }) => ({
      key,
      header,
      align: "right",
      sortable: true,
      render: (f) => {
        const value = f[key] as number;
        return value === 0 ? (
          <span className="text-subtle">—</span>
        ) : (
          <span className="whitespace-nowrap text-muted">{value.toLocaleString("en-IN")}</span>
        );
      },
    })),
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
      key: "actions",
      header: "",
      align: "right",
      render: (f) => (
        <div className="flex items-center justify-end gap-1">
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
        <StatCard label="Fee Heads" value={FEE_HEADS.length} icon={BookOpen} tone="violet" />
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
        saving={saving}
        onSubmit={handleSubmit}
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

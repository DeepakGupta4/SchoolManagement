"use client";

import React, { useState } from "react";
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
  Input,
  PageHeader,
  StatCard,
  Table,
  type Column,
} from "@/components/ui";

const feeStructures = [
  { id: "FS001", class: "Class 1-5",  tuition: 4000,  transport: 1500, lab: 0,    library: 300, sports: 500, misc: 200, total: 6500  },
  { id: "FS002", class: "Class 6-8",  tuition: 5500,  transport: 1500, lab: 500,  library: 400, sports: 600, misc: 300, total: 8800  },
  { id: "FS003", class: "Class 9-10", tuition: 7000,  transport: 1500, lab: 800,  library: 500, sports: 700, misc: 400, total: 10900 },
  { id: "FS004", class: "Class 11-12 (Science)", tuition: 9000, transport: 1500, lab: 1500, library: 600, sports: 700, misc: 500, total: 13800 },
  { id: "FS005", class: "Class 11-12 (Commerce)", tuition: 8000, transport: 1500, lab: 500, library: 600, sports: 700, misc: 500, total: 11800 },
  { id: "FS006", class: "Class 11-12 (Arts)", tuition: 7500, transport: 1500, lab: 0, library: 600, sports: 700, misc: 500, total: 10800 },
];

type FeeStructure = (typeof feeStructures)[number];

const feeHeads: { key: keyof FeeStructure; header: string }[] = [
  { key: "tuition", header: "Tuition (₹)" },
  { key: "transport", header: "Transport (₹)" },
  { key: "lab", header: "Lab (₹)" },
  { key: "library", header: "Library (₹)" },
  { key: "sports", header: "Sports (₹)" },
  { key: "misc", header: "Misc (₹)" },
];

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function FeeStructurePage() {
  const [search, setSearch] = useState("");
  const filtered = feeStructures.filter((f) =>
    f.class.toLowerCase().includes(search.toLowerCase())
  );

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
            <p className="truncate text-xs text-subtle">{f.id}</p>
          </div>
        </div>
      ),
    },
    ...feeHeads.map<Column<FeeStructure>>(({ key, header }) => ({
      key: String(key),
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
        <span className="whitespace-nowrap font-semibold text-primary">{inr.format(f.total)}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (f) => (
        <div className="flex items-center justify-end gap-1">
          <button
            aria-label={`Edit ${f.class} fee structure`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Pencil className="size-4" />
          </button>
          <button
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
            <Button variant="outline">
              <Download className="size-4" />
              Export
            </Button>
            <Button>
              <Plus className="size-4" />
              Add Structure
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Fee Categories" value={feeStructures.length} icon={Layers} tone="indigo" />
        <StatCard label="Lowest Fee" value={inr.format(6500)} icon={TrendingDown} tone="emerald" />
        <StatCard label="Highest Fee" value={inr.format(13800)} icon={TrendingUp} tone="rose" />
        <StatCard label="Fee Heads" value={feeHeads.length} icon={BookOpen} tone="violet" />
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
        <p className="text-xs text-muted">{filtered.length} structures</p>
      </div>

      <Table
        columns={columns}
        rows={filtered}
        rowKey={(f) => f.id}
        emptyTitle="No fee structures found"
        emptyDescription="Try clearing your search to see more results."
      />
    </div>
  );
}

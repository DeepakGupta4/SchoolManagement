"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  Download,
  Mail,
  Phone,
  Search,
  Send,
  Siren,
  Users,
  Wallet,
} from "lucide-react";
import {
  Badge,
  Button,
  Input,
  PageHeader,
  StatCard,
  Table,
  useToast,
  type Column,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { exportToCsv } from "@/lib/exportCsv";
import { FEE_DEFAULTERS as defaulters, type FeeDefaulter } from "@/lib/api/feeRecords";


type Defaulter = FeeDefaulter;

const urgencyConfig = (
  months: number
): { label: string; variant: "danger" | "warning" | "info"; tile: string } => {
  if (months >= 3) return { label: "Critical", variant: "danger", tile: "bg-danger-soft text-danger-text" };
  if (months === 2) return { label: "High", variant: "warning", tile: "bg-warning-soft text-warning-text" };
  return { label: "Medium", variant: "info", tile: "bg-info-soft text-info-text" };
};

const filters = ["All", "Critical", "High", "Medium"];

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function DefaultersPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const { toast } = useToast();

  const filtered = defaulters.filter((d) => {
    const matchSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.id.toLowerCase().includes(search.toLowerCase()) ||
      d.class.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "All" ||
      (filter === "Critical" && d.months >= 3) ||
      (filter === "High" && d.months === 2) ||
      (filter === "Medium" && d.months === 1);
    return matchSearch && matchFilter;
  });

  const totalDue = defaulters.reduce((s, d) => s + d.due, 0);

  const handleExport = () => {
    if (filtered.length === 0) {
      toast({
        title: "Nothing to export",
        description: "No defaulters match the current filters.",
        variant: "warning",
      });
      return;
    }
    exportToCsv<Defaulter>(
      "fee-defaulters",
      [
        { header: "Student ID", value: (d) => d.id },
        { header: "Name", value: (d) => d.name },
        { header: "Class", value: (d) => d.class },
        { header: "Parent", value: (d) => d.parent },
        { header: "Phone", value: (d) => d.phone },
        { header: "Total Fee (INR)", value: (d) => d.totalFee },
        { header: "Paid (INR)", value: (d) => d.paid },
        { header: "Due (INR)", value: (d) => d.due },
        { header: "Months Overdue", value: (d) => d.months },
        { header: "Urgency", value: (d) => urgencyConfig(d.months).label },
        { header: "Last Paid", value: (d) => d.lastPaid },
      ],
      filtered
    );
    toast({
      title: "Export ready",
      description: `${filtered.length} defaulter${filtered.length === 1 ? "" : "s"} exported to CSV.`,
    });
  };

  const columns: Column<Defaulter>[] = [
    {
      key: "name",
      header: "Student",
      sortable: true,
      render: (d) => {
        const urg = urgencyConfig(d.months);
        return (
          <div className="flex items-center gap-3">
            <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-md", urg.tile)}>
              <AlertTriangle className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-text">{d.name}</p>
              <p className="truncate text-xs text-subtle">{d.id}</p>
            </div>
          </div>
        );
      },
    },
    { key: "class", header: "Class", render: (d) => <Badge variant="info">{d.class}</Badge> },
    {
      key: "parent",
      header: "Parent / Guardian",
      sortable: true,
      render: (d) => <span className="whitespace-nowrap text-muted">{d.parent}</span>,
    },
    {
      key: "phone",
      header: "Contact",
      render: (d) => <span className="whitespace-nowrap text-muted">{d.phone}</span>,
    },
    {
      key: "totalFee",
      header: "Total Fee",
      sortable: true,
      align: "right",
      render: (d) => <span className="whitespace-nowrap text-muted">{inr.format(d.totalFee)}</span>,
    },
    {
      key: "paid",
      header: "Paid",
      sortable: true,
      align: "right",
      render: (d) => (
        <span className="whitespace-nowrap font-medium text-success">{inr.format(d.paid)}</span>
      ),
    },
    {
      key: "due",
      header: "Due Amount",
      sortable: true,
      align: "right",
      render: (d) => (
        <span className="whitespace-nowrap font-semibold text-danger">{inr.format(d.due)}</span>
      ),
    },
    {
      key: "months",
      header: "Overdue",
      sortable: true,
      align: "right",
      render: (d) => <span className="whitespace-nowrap text-muted">{d.months} mo.</span>,
    },
    {
      key: "lastPaid",
      header: "Last Paid",
      render: (d) => <span className="whitespace-nowrap text-subtle">{d.lastPaid}</span>,
    },
    {
      key: "urgency",
      header: "Urgency",
      sortable: true,
      sortValue: (d) => d.months,
      render: (d) => {
        const urg = urgencyConfig(d.months);
        return <Badge variant={urg.variant}>{urg.label}</Badge>;
      },
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (d) => (
        <div className="flex items-center justify-end gap-1">
          {[
            { Icon: Phone, label: "Call" },
            { Icon: Mail, label: "Email" },
            { Icon: Send, label: "Send reminder" },
          ].map(({ Icon, label }) => (
            <button
              key={label}
              title={label}
              aria-label={`${label} — ${d.name}`}
              className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
            >
              <Icon className="size-4" />
            </button>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Fee Defaulters"
        description="Students with pending fee dues"
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download className="size-4" />
              Export
            </Button>
            {/* Disabled until SMS/WhatsApp delivery is connected — this would
                message every listed guardian. */}
            <Button variant="danger" disabled title="Messaging is not connected yet">
              <Send className="size-4" />
              Send Reminders
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Defaulters" value={defaulters.length} icon={Users} tone="rose" />
        <StatCard label="Total Due Amount" value={inr.format(totalDue)} icon={Wallet} tone="amber" />
        <StatCard
          label="Critical (3+ mo.)"
          value={defaulters.filter((d) => d.months >= 3).length}
          icon={Siren}
          tone="rose"
        />
        <StatCard
          label="High (2 mo.)"
          value={defaulters.filter((d) => d.months === 2).length}
          icon={AlertTriangle}
          tone="amber"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-md bg-surface-sunken p-1">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={cn(
                "focus-ring rounded-sm px-3.5 py-1.5 text-xs font-medium transition-colors",
                filter === f ? "bg-surface-raised text-text shadow-sm" : "text-muted hover:text-text"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="min-w-60 flex-1">
          <Input
            type="search"
            placeholder="Search defaulters…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search defaulters"
          />
        </div>
        <p className="text-xs text-muted">{filtered.length} students</p>
      </div>

      <Table
        columns={columns}
        rows={filtered}
        rowKey={(d) => d.id}
        emptyTitle="No defaulters found"
        emptyDescription="Try adjusting your filters to see more results."
      />
    </div>
  );
}

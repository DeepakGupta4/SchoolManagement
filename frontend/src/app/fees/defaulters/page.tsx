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
  type Column,
} from "@/components/ui";
import { cn } from "@/lib/utils";

const defaulters = [
  { id: "STU005", name: "Karan Mehta",     class: "12-A", parent: "Suresh Mehta",   phone: "98765-43210", totalFee: 13800, paid: 0,     due: 13800, months: 3, lastPaid: "Apr 2025" },
  { id: "STU011", name: "Deepak Yadav",    class: "10-B", parent: "Ramesh Yadav",   phone: "87654-32109", totalFee: 10900, paid: 2725,  due: 8175,  months: 2, lastPaid: "May 2025" },
  { id: "STU018", name: "Pooja Sharma",    class: "9-A",  parent: "Anil Sharma",    phone: "76543-21098", totalFee: 10900, paid: 5450,  due: 5450,  months: 1, lastPaid: "Jun 2025" },
  { id: "STU023", name: "Amit Tiwari",     class: "11-B", parent: "Rajesh Tiwari",  phone: "65432-10987", totalFee: 13800, paid: 4600,  due: 9200,  months: 2, lastPaid: "May 2025" },
  { id: "STU031", name: "Sunita Devi",     class: "8-A",  parent: "Mohan Devi",     phone: "54321-09876", totalFee: 8800,  paid: 2200,  due: 6600,  months: 3, lastPaid: "Apr 2025" },
  { id: "STU042", name: "Ravi Kumar",      class: "7-B",  parent: "Sunil Kumar",    phone: "43210-98765", totalFee: 8800,  paid: 4400,  due: 4400,  months: 1, lastPaid: "Jun 2025" },
  { id: "STU055", name: "Nisha Pandey",    class: "6-A",  parent: "Vinod Pandey",   phone: "32109-87654", totalFee: 6500,  paid: 0,     due: 6500,  months: 3, lastPaid: "Never"    },
  { id: "STU067", name: "Gaurav Singh",    class: "12-B", parent: "Harish Singh",   phone: "21098-76543", totalFee: 13800, paid: 6900,  due: 6900,  months: 1, lastPaid: "Jun 2025" },
];

type Defaulter = (typeof defaulters)[number];

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
            <Button variant="outline">
              <Download className="size-4" />
              Export
            </Button>
            <Button variant="danger">
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

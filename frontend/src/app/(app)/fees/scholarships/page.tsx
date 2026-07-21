"use client";

import React, { useState } from "react";
import {
  Award,
  CheckCircle,
  Clock,
  Download,
  GraduationCap,
  HeartHandshake,
  Pencil,
  Plus,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  PageHeader,
  StatCard,
  Table,
  type Column,
} from "@/components/ui";
import { cn } from "@/lib/utils";

const scholarships = [
  { id: "SCH001", student: "Priya Patel",    class: "9-B",  type: "Merit",       percentage: 100, amount: 10900, reason: "School Topper",         status: "active",  since: "Apr 2025" },
  { id: "SCH002", student: "Ananya Singh",   class: "7-A",  type: "Need-Based",  percentage: 50,  amount: 4400,  reason: "Financial Hardship",    status: "active",  since: "Apr 2025" },
  { id: "SCH003", student: "Rohan Das",      class: "9-A",  type: "Sports",      percentage: 75,  amount: 8175,  reason: "State Level Athlete",   status: "active",  since: "Apr 2025" },
  { id: "SCH004", student: "Meera Nair",     class: "11-B", type: "Merit",       percentage: 50,  amount: 6900,  reason: "Top 5 in Class",        status: "active",  since: "Apr 2025" },
  { id: "SCH005", student: "Vikram Joshi",   class: "6-B",  type: "Need-Based",  percentage: 25,  amount: 1650,  reason: "Single Parent Family",  status: "pending", since: "Jul 2025" },
  { id: "SCH006", student: "Kavya Reddy",    class: "12-B", type: "Cultural",    percentage: 30,  amount: 4140,  reason: "National Dance Award",  status: "active",  since: "Apr 2025" },
  { id: "SCH007", student: "Deepak Yadav",   class: "10-B", type: "Need-Based",  percentage: 50,  amount: 5450,  reason: "BPL Category",          status: "expired", since: "Jan 2025" },
  { id: "SCH008", student: "Sunita Devi",    class: "8-A",  type: "Need-Based",  percentage: 75,  amount: 6600,  reason: "Orphan Student",        status: "active",  since: "Apr 2025" },
];

type Scholarship = (typeof scholarships)[number];

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

const typeStyles: Record<string, { variant: BadgeVariant; tile: string; bar: string }> = {
  Merit: { variant: "info", tile: "bg-info-soft text-info-text", bar: "bg-info" },
  "Need-Based": { variant: "success", tile: "bg-success-soft text-success-text", bar: "bg-success" },
  Sports: { variant: "warning", tile: "bg-warning-soft text-warning-text", bar: "bg-warning" },
  Cultural: { variant: "default", tile: "bg-primary-soft text-primary-text", bar: "bg-primary" },
};

const statusConfig: Record<
  string,
  { variant: BadgeVariant; icon: React.ElementType; label: string }
> = {
  active: { variant: "success", icon: CheckCircle, label: "Active" },
  pending: { variant: "warning", icon: Clock, label: "Pending" },
  expired: { variant: "default", icon: XCircle, label: "Expired" },
};

const tabs = ["All", "Active", "Pending", "Expired"];

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function ScholarshipsPage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");

  const filtered = scholarships.filter((s) => {
    const matchTab = activeTab === "All" || s.status === activeTab.toLowerCase();
    const matchSearch =
      s.student.toLowerCase().includes(search.toLowerCase()) ||
      s.type.toLowerCase().includes(search.toLowerCase()) ||
      s.class.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const totalSaved = scholarships
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + s.amount, 0);

  const fallbackType = { variant: "default" as BadgeVariant, tile: "bg-surface-hover text-muted", bar: "bg-primary" };

  const columns: Column<Scholarship>[] = [
    {
      key: "id",
      header: "ID",
      sortable: true,
      render: (s) => <span className="font-semibold text-primary">{s.id}</span>,
    },
    {
      key: "student",
      header: "Student",
      sortable: true,
      render: (s) => {
        const tc = typeStyles[s.type] ?? fallbackType;
        return (
          <div className="flex items-center gap-3">
            <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-md", tc.tile)}>
              <Award className="size-4" />
            </div>
            <span className="whitespace-nowrap font-medium text-text">{s.student}</span>
          </div>
        );
      },
    },
    { key: "class", header: "Class", render: (s) => <Badge variant="info">{s.class}</Badge> },
    {
      key: "type",
      header: "Type",
      sortable: true,
      render: (s) => (
        <Badge variant={(typeStyles[s.type] ?? fallbackType).variant}>{s.type}</Badge>
      ),
    },
    {
      key: "percentage",
      header: "Concession",
      sortable: true,
      render: (s) => {
        const tc = typeStyles[s.type] ?? fallbackType;
        return (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-hover">
              <div className={cn("h-full rounded-full", tc.bar)} style={{ width: `${s.percentage}%` }} />
            </div>
            <span className="font-medium text-text">{s.percentage}%</span>
          </div>
        );
      },
    },
    {
      key: "amount",
      header: "Amount Waived",
      sortable: true,
      align: "right",
      render: (s) => (
        <span className="whitespace-nowrap font-semibold text-primary">{inr.format(s.amount)}</span>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      className: "max-w-45",
      render: (s) => <span className="block truncate text-muted">{s.reason}</span>,
    },
    {
      key: "since",
      header: "Since",
      sortable: true,
      render: (s) => <span className="whitespace-nowrap text-subtle">{s.since}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (s) => {
        const sc = statusConfig[s.status];
        const StatusIcon = sc.icon;
        return (
          <Badge variant={sc.variant} className="gap-1.5">
            <StatusIcon className="size-3" />
            {sc.label}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (s) => (
        <div className="flex items-center justify-end gap-1">
          <button
            title="Edit"
            aria-label={`Edit scholarship ${s.id}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Pencil className="size-4" />
          </button>
          <button
            title="Delete"
            aria-label={`Delete scholarship ${s.id}`}
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
        title="Scholarships & Concessions"
        description="Manage fee waivers, merit and need-based scholarships"
        actions={
          <>
            <Button variant="outline">
              <Download className="size-4" />
              Export
            </Button>
            <Button>
              <Plus className="size-4" />
              Add Scholarship
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Scholarships" value={scholarships.length} icon={GraduationCap} tone="violet" />
        <StatCard
          label="Active"
          value={scholarships.filter((s) => s.status === "active").length}
          icon={CheckCircle}
          tone="emerald"
        />
        <StatCard label="Total Fee Waived" value={inr.format(totalSaved)} icon={HeartHandshake} tone="violet" />
        <StatCard
          label="Pending Review"
          value={scholarships.filter((s) => s.status === "pending").length}
          icon={Clock}
          tone="amber"
        />
      </div>

      {/* Scholarship Type Breakdown */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Object.keys(typeStyles).map((type) => {
          const active = scholarships.filter((s) => s.type === type && s.status === "active");
          const total = active.reduce((sum, s) => sum + s.amount, 0);
          const tc = typeStyles[type];
          return (
            <Card key={type}>
              <CardContent>
                <div className="mb-2.5 flex items-center gap-2">
                  <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-md", tc.tile)}>
                    <Award className="size-4" />
                  </div>
                  <span className="text-sm font-semibold text-text">{type}</span>
                </div>
                <p className="text-xl font-semibold text-text">{active.length}</p>
                <p className="mt-0.5 text-xs text-subtle">{inr.format(total)} waived</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-md bg-surface-sunken p-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              aria-pressed={activeTab === tab}
              className={cn(
                "focus-ring rounded-sm px-3.5 py-1.5 text-xs font-medium transition-colors",
                activeTab === tab
                  ? "bg-surface-raised text-text shadow-sm"
                  : "text-muted hover:text-text"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="min-w-60 flex-1">
          <Input
            type="search"
            placeholder="Search scholarships…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search scholarships"
          />
        </div>
        <p className="text-xs text-muted">{filtered.length} records</p>
      </div>

      <Table
        columns={columns}
        rows={filtered}
        rowKey={(s) => s.id}
        emptyTitle="No scholarships found"
        emptyDescription="Try adjusting your filters to see more results."
      />
    </div>
  );
}

"use client";

import React, { useState } from "react";
import {
  Plus, Search, Download, Eye, Edit, Trash2, Calendar, Clock, Users,
  Paperclip, CheckCircle, AlertCircle, XCircle, BookOpen, X,
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

const assignments = [
  { id: "A001", title: "Quadratic Equations Practice",    subject: "Mathematics", class: "10-A", teacher: "Dr. Priya Sharma",  given: "Jul 10", due: "Jul 17", totalMarks: 20, submitted: 38, total: 42, status: "active",   type: "Worksheet"  },
  { id: "A002", title: "Newton's Laws Problems",          subject: "Physics",     class: "11-A", teacher: "Mr. Rahul Verma",   given: "Jul 12", due: "Jul 19", totalMarks: 15, submitted: 30, total: 40, status: "active",   type: "Problem Set"},
  { id: "A003", title: "Essay — My Favourite Season",     subject: "English",     class: "8-B",  teacher: "Ms. Anita Patel",   given: "Jul 8",  due: "Jul 15", totalMarks: 10, submitted: 44, total: 44, status: "completed",type: "Essay"      },
  { id: "A004", title: "Periodic Table Elements",         subject: "Chemistry",   class: "9-A",  teacher: "Ms. Kavita Singh",  given: "Jul 14", due: "Jul 21", totalMarks: 25, submitted: 12, total: 38, status: "active",   type: "Research"   },
  { id: "A005", title: "World War II Summary",            subject: "History",     class: "10-B", teacher: "Mr. Suresh Kumar",  given: "Jul 5",  due: "Jul 12", totalMarks: 15, submitted: 40, total: 40, status: "completed",type: "Essay"      },
  { id: "A006", title: "Cell Division Diagrams",          subject: "Biology",     class: "12-A", teacher: "Ms. Deepa Nair",    given: "Jul 15", due: "Jul 22", totalMarks: 20, submitted: 5,  total: 35, status: "active",   type: "Diagram"    },
  { id: "A007", title: "Python Basics Program",           subject: "Comp. Sci",   class: "9-B",  teacher: "Mr. Amit Joshi",    given: "Jul 16", due: "Jul 23", totalMarks: 30, submitted: 0,  total: 36, status: "upcoming", type: "Practical"  },
  { id: "A008", title: "Trigonometry Identities",         subject: "Mathematics", class: "11-A", teacher: "Dr. Priya Sharma",  given: "Jul 18", due: "Jul 25", totalMarks: 20, submitted: 0,  total: 40, status: "upcoming", type: "Worksheet"  },
];

type Assignment = (typeof assignments)[number];
type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

const statusConfig: Record<
  string,
  { variant: BadgeVariant; icon: React.ElementType; label: string }
> = {
  active:    { variant: "info",    icon: Clock,       label: "Active"    },
  completed: { variant: "success", icon: CheckCircle, label: "Completed" },
  upcoming:  { variant: "warning", icon: AlertCircle, label: "Upcoming"  },
  overdue:   { variant: "danger",  icon: XCircle,     label: "Overdue"   },
};

/** Assignment types share the semantic palette rather than bespoke hex. */
const typeTone: Record<string, string> = {
  Worksheet: "bg-info-soft text-info-text",
  "Problem Set": "bg-primary-soft text-primary-text",
  Essay: "bg-warning-soft text-warning-text",
  Research: "bg-info-soft text-info-text",
  Diagram: "bg-success-soft text-success-text",
  Practical: "bg-danger-soft text-danger-text",
};

const subjectDot: Record<string, string> = {
  Mathematics: "bg-primary",
  Physics: "bg-info",
  English: "bg-warning",
  Chemistry: "bg-success",
  History: "bg-warning",
  Biology: "bg-success",
  "Comp. Sci": "bg-info",
};

const tabs = ["All", "Active", "Upcoming", "Completed"];

export default function AssignmentsPage() {
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch]       = useState("");
  const [selected, setSelected]   = useState<Assignment | null>(null);

  const filtered = assignments.filter(a => {
    const matchTab    = activeTab === "All" || a.status === activeTab.toLowerCase();
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase()) ||
                        a.subject.toLowerCase().includes(search.toLowerCase()) ||
                        a.class.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const columns: Column<Assignment>[] = [
    {
      key: "title",
      header: "Assignment",
      sortable: true,
      render: (a) => (
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-md",
              typeTone[a.type] ?? "bg-surface-hover text-muted"
            )}
          >
            <BookOpen className="size-4" />
          </div>
          <div className="min-w-0">
            <p
              className={cn(
                "truncate font-medium",
                selected?.id === a.id ? "text-primary" : "text-text"
              )}
            >
              {a.title}
            </p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <Badge className={cn("text-[10px]", typeTone[a.type] ?? "bg-surface-hover text-muted")}>
                {a.type}
              </Badge>
              <span className="truncate text-xs text-subtle">{a.teacher}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "subject",
      header: "Subject",
      sortable: true,
      render: (a) => (
        <span className="inline-flex items-center gap-2 whitespace-nowrap text-text">
          <span className={cn("size-2 rounded-full", subjectDot[a.subject] ?? "bg-border-strong")} />
          {a.subject}
        </span>
      ),
    },
    {
      key: "class",
      header: "Class",
      sortable: true,
      render: (a) => <Badge variant="info">{a.class}</Badge>,
    },
    {
      key: "due",
      header: "Due Date",
      sortable: true,
      render: (a) => (
        <div>
          <span className="flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-text">
            <Calendar className="size-3.5 text-subtle" />
            {a.due}
          </span>
          <span className="mt-0.5 block whitespace-nowrap text-[11px] text-subtle">
            Given: {a.given}
          </span>
        </div>
      ),
    },
    {
      key: "submitted",
      header: "Submission",
      sortable: true,
      sortValue: (a) => a.submitted / a.total,
      render: (a) => {
        const subPct = Math.round((a.submitted / a.total) * 100);
        return (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-14 overflow-hidden rounded-full bg-surface-hover">
              <div
                className={cn(
                  "h-full rounded-full",
                  subPct === 100 ? "bg-success" : subPct >= 50 ? "bg-primary" : "bg-warning"
                )}
                style={{ width: `${subPct}%` }}
              />
            </div>
            <span className="whitespace-nowrap text-xs font-medium text-muted">
              {a.submitted}/{a.total}
            </span>
          </div>
        );
      },
    },
    {
      key: "totalMarks",
      header: "Marks",
      sortable: true,
      align: "right",
      render: (a) => (
        <span className="whitespace-nowrap font-semibold text-text">
          {a.totalMarks}
          <span className="ml-0.5 text-xs font-normal text-subtle">pts</span>
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (a) => {
        const sc = statusConfig[a.status];
        const StatusIcon = sc.icon;
        return (
          <Badge variant={sc.variant} className="gap-1.5 px-2.5 py-1">
            <StatusIcon className="size-3" />
            {sc.label}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (a) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            aria-label={`View ${a.title}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-info-soft hover:text-info-text"
          >
            <Eye className="size-4" />
          </button>
          <button
            aria-label={`Edit ${a.title}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-success-soft hover:text-success-text"
          >
            <Edit className="size-4" />
          </button>
          <button
            aria-label={`Delete ${a.title}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-danger-soft hover:text-danger-text"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ),
    },
  ];

  const detailRows = selected
    ? [
        { label: "Teacher", value: selected.teacher, icon: Users },
        { label: "Given On", value: selected.given, icon: Calendar },
        { label: "Due Date", value: selected.due, icon: Clock },
        { label: "Total Marks", value: `${selected.totalMarks} pts`, icon: CheckCircle },
        { label: "Type", value: selected.type, icon: Paperclip },
      ]
    : [];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Assignments"
        description="Manage and track all class assignments"
        actions={
          <>
            <Button variant="outline">
              <Download className="size-4" />
              Export
            </Button>
            <Button>
              <Plus className="size-4" />
              New Assignment
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total" value={assignments.length} icon={BookOpen} tone="indigo" />
        <StatCard
          label="Active"
          value={assignments.filter((a) => a.status === "active").length}
          icon={Clock}
          tone="cyan"
        />
        <StatCard
          label="Completed"
          value={assignments.filter((a) => a.status === "completed").length}
          icon={CheckCircle}
          tone="emerald"
        />
        <StatCard
          label="Upcoming"
          value={assignments.filter((a) => a.status === "upcoming").length}
          icon={AlertCircle}
          tone="amber"
        />
      </div>

      <div className={cn("grid grid-cols-1 gap-5", selected && "xl:grid-cols-[1fr_380px]")}>
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex gap-1 rounded-md bg-surface-sunken p-1">
              {tabs.map((tab) => (
                <Button
                  key={tab}
                  size="sm"
                  variant={activeTab === tab ? "primary" : "ghost"}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </Button>
              ))}
            </div>
            <div className="w-full max-w-70 flex-1">
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search assignments…"
                icon={<Search className="size-4" />}
                aria-label="Search assignments"
              />
            </div>
            <p className="ml-auto text-xs text-muted">{filtered.length} assignments</p>
          </div>

          <Table
            columns={columns}
            rows={filtered}
            rowKey={(a) => a.id}
            onRowClick={(a) => setSelected(selected?.id === a.id ? null : a)}
            rowClassName={(a) => (selected?.id === a.id ? "bg-primary-soft" : undefined)}
            emptyTitle="No assignments found"
            emptyDescription="Try a different tab or clear your search."
            emptyAction={
              <Button variant="outline" onClick={() => { setSearch(""); setActiveTab("All"); }}>
                Clear filters
              </Button>
            }
          />
        </div>

        {selected && (
          <Card className="h-fit overflow-hidden border-primary">
            <div className="gradient-indigo p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-white/15 text-white">
                  <BookOpen className="size-5" />
                </div>
                <button
                  onClick={() => setSelected(null)}
                  aria-label="Close details"
                  className="focus-ring rounded-sm bg-white/10 p-1.5 text-white transition-colors hover:bg-white/20"
                >
                  <X className="size-4" />
                </button>
              </div>
              <p className="mt-3 text-base font-semibold leading-snug text-white">
                {selected.title}
              </p>
              <p className="mt-1 text-xs text-white/70">
                {selected.subject} · Class {selected.class}
              </p>
            </div>

            <CardContent className="flex flex-col gap-3.5">
              {detailRows.map((d) => (
                <div key={d.label} className="flex items-center gap-3">
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-primary-soft text-primary-text">
                    <d.icon className="size-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-subtle">
                      {d.label}
                    </p>
                    <p className="mt-0.5 truncate text-sm font-medium text-text">{d.value}</p>
                  </div>
                </div>
              ))}

              <div className="rounded-md bg-surface-sunken p-3.5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-text">Submission Progress</p>
                  <p className="text-sm font-semibold text-primary">
                    {selected.submitted}/{selected.total}
                  </p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: `${Math.round((selected.submitted / selected.total) * 100)}%`,
                    }}
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-muted">
                  {selected.total - selected.submitted} students yet to submit
                </p>
              </div>

              <Button className="w-full">View Submissions</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  Download,
  Edit,
  Trash2,
  Eye,
  Pin,
  FileText,
  AlertCircle,
  Info,
  CheckCircle,
  Calendar,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  PageHeader,
  Select,
  StatCard,
  Table,
  type Column,
} from "@/components/ui";

const notices = [
  { id: "NC001", title: "Mid-Term Exam Schedule",          body: "Mid-term exams for classes 6–12 will be held from 28 July to 5 August 2025. Detailed timetable attached.",  category: "Exam",      audience: "Students", date: "10 Jul 2025", expiry: "28 Jul 2025", pinned: true,  priority: "High",   postedBy: "Exam Cell"  },
  { id: "NC002", title: "Fee Payment Last Date",           body: "Last date for Q2 fee payment is 20 July 2025. Students with pending fees will not be allowed in exams.",      category: "Finance",   audience: "Parents",  date: "11 Jul 2025", expiry: "20 Jul 2025", pinned: true,  priority: "High",   postedBy: "Accounts"   },
  { id: "NC003", title: "Annual Sports Day",               body: "Annual Sports Day will be held on 28 July 2025. Registration for events open till 22 July.",                  category: "Event",     audience: "All",      date: "12 Jul 2025", expiry: "28 Jul 2025", pinned: true,  priority: "Medium", postedBy: "Sports Dept"},
  { id: "NC004", title: "Library Book Return Notice",      body: "All students must return borrowed library books by 25 July 2025 to avoid fine.",                              category: "General",   audience: "Students", date: "13 Jul 2025", expiry: "25 Jul 2025", pinned: false, priority: "Low",    postedBy: "Librarian"  },
  { id: "NC005", title: "Holiday – Eid Celebration",       body: "School will remain closed on 17 July 2025 on account of Eid. Classes resume on 18 July.",                    category: "Holiday",   audience: "All",      date: "14 Jul 2025", expiry: "17 Jul 2025", pinned: false, priority: "Medium", postedBy: "Admin"      },
  { id: "NC006", title: "Parent-Teacher Meeting",          body: "PTM for classes 9–12 scheduled on 26 July 2025 from 9 AM to 1 PM. Attendance is mandatory for parents.",     category: "Meeting",   audience: "Parents",  date: "14 Jul 2025", expiry: "26 Jul 2025", pinned: false, priority: "High",   postedBy: "Principal"  },
  { id: "NC007", title: "New Canteen Menu",                body: "Updated canteen menu effective from 21 July 2025. Healthy meal options added for all students.",              category: "General",   audience: "All",      date: "15 Jul 2025", expiry: "31 Jul 2025", pinned: false, priority: "Low",    postedBy: "Canteen"    },
  { id: "NC008", title: "Staff Training Workshop",         body: "Mandatory training workshop for all teaching staff on 19 July 2025 from 10 AM to 3 PM in the auditorium.",   category: "Meeting",   audience: "Staff",    date: "15 Jul 2025", expiry: "19 Jul 2025", pinned: false, priority: "High",   postedBy: "HR Dept"    },
  { id: "NC009", title: "Science Exhibition Registration", body: "Students interested in the Science Exhibition (Aug 10) must register with their class teacher by 25 July.",  category: "Event",     audience: "Students", date: "16 Jul 2025", expiry: "25 Jul 2025", pinned: false, priority: "Medium", postedBy: "Science Dept"},
  { id: "NC010", title: "Bus Route Update",                body: "New bus stops added in Sector 14 and Sector 18 from 21 July 2025. Contact transport office for details.",     category: "Transport", audience: "Parents",  date: "16 Jul 2025", expiry: "21 Jul 2025", pinned: false, priority: "Low",    postedBy: "Transport"  },
];

type Notice = (typeof notices)[number];
type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "outline";

const categoryConfig: Record<string, { variant: BadgeVariant; icon: React.ReactNode }> = {
  Exam:      { variant: "warning", icon: <FileText className="size-3" /> },
  Finance:   { variant: "success", icon: <AlertCircle className="size-3" /> },
  Event:     { variant: "info",    icon: <Calendar className="size-3" /> },
  General:   { variant: "outline", icon: <Info className="size-3" /> },
  Holiday:   { variant: "danger",  icon: <CheckCircle className="size-3" /> },
  Meeting:   { variant: "default", icon: <FileText className="size-3" /> },
  Transport: { variant: "info",    icon: <Info className="size-3" /> },
};

const priorityVariant: Record<string, BadgeVariant> = {
  High: "danger",
  Medium: "warning",
  Low: "success",
};

/** Dot colour used in the priority legend, one token class per level. */
const priorityDot: Record<string, string> = {
  High: "bg-danger",
  Medium: "bg-warning",
  Low: "bg-success",
};

const audienceVariant: Record<string, BadgeVariant> = {
  All: "info",
  Parents: "warning",
  Staff: "default",
  Students: "success",
};

function RowActions({ notice }: { notice: Notice }) {
  return (
    <div className="flex items-center gap-1">
      <button
        aria-label={`View ${notice.title}`}
        className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
      >
        <Eye className="size-4" />
      </button>
      <button
        aria-label={`Edit ${notice.title}`}
        className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
      >
        <Edit className="size-4" />
      </button>
      <button
        aria-label={`Delete ${notice.title}`}
        className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-danger-soft hover:text-danger"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

export default function NoticesPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [audienceFilter, setAudienceFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  const filtered = notices.filter((n) => {
    const matchSearch =
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.body.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "All" || n.category === categoryFilter;
    const matchAudience = audienceFilter === "All" || n.audience === audienceFilter;
    const matchPriority = priorityFilter === "All" || n.priority === priorityFilter;
    return matchSearch && matchCategory && matchAudience && matchPriority;
  });

  const pinned = notices.filter((n) => n.pinned);
  const high = notices.filter((n) => n.priority === "High").length;

  const columns: Column<Notice>[] = [
    {
      key: "title",
      header: "Notice",
      sortable: true,
      render: (n) => (
        <div className="flex items-start gap-2">
          {n.pinned && <Pin className="mt-0.5 size-3.5 shrink-0 text-warning" />}
          <div className="min-w-0 max-w-64">
            <p className="truncate font-medium text-text">{n.title}</p>
            <p className="mt-0.5 truncate text-xs text-subtle">{n.body}</p>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      render: (n) => {
        const cc = categoryConfig[n.category];
        return (
          <Badge variant={cc.variant} className="gap-1">
            {cc.icon} {n.category}
          </Badge>
        );
      },
    },
    {
      key: "audience",
      header: "Audience",
      sortable: true,
      render: (n) => (
        <Badge variant={audienceVariant[n.audience] ?? "default"}>{n.audience}</Badge>
      ),
    },
    {
      key: "postedBy",
      header: "Posted by",
      sortable: true,
      render: (n) => <span className="whitespace-nowrap text-muted">{n.postedBy}</span>,
    },
    {
      key: "date",
      header: "Date",
      sortable: true,
      render: (n) => <span className="whitespace-nowrap text-muted">{n.date}</span>,
    },
    {
      key: "expiry",
      header: "Expiry",
      sortable: true,
      render: (n) => <span className="whitespace-nowrap text-muted">{n.expiry}</span>,
    },
    {
      key: "priority",
      header: "Priority",
      sortable: true,
      render: (n) => <Badge variant={priorityVariant[n.priority]}>{n.priority}</Badge>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (n) => <RowActions notice={n} />,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Notice Board"
        description="Post and manage official school notices."
        actions={
          <>
            <Button variant="outline">
              <Download className="size-4" />
              Export
            </Button>
            <Button>
              <Plus className="size-4" />
              Post notice
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total notices" value={notices.length} icon={FileText} tone="indigo" />
        <StatCard label="Pinned" value={pinned.length} icon={Pin} tone="amber" />
        <StatCard label="High priority" value={high} icon={AlertCircle} tone="rose" />
        <StatCard
          label="Categories"
          value={Object.keys(categoryConfig).length}
          icon={Info}
          tone="cyan"
        />
      </div>

      {pinned.length > 0 && (
        <div>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-subtle">
            Pinned
          </p>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {pinned.map((n) => {
              const cc = categoryConfig[n.category];
              return (
                <Card key={n.id} className="border-warning">
                  <CardContent className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        <Badge variant="warning" className="gap-1">
                          <Pin className="size-3" /> Pinned
                        </Badge>
                        <Badge variant={cc.variant} className="gap-1">
                          {cc.icon} {n.category}
                        </Badge>
                        <Badge variant={priorityVariant[n.priority]}>{n.priority}</Badge>
                      </div>
                      <p className="text-sm font-semibold text-text">{n.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
                        {n.body}
                      </p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-3">
                        <Badge variant={audienceVariant[n.audience] ?? "default"}>
                          {n.audience}
                        </Badge>
                        <span className="text-xs text-subtle">Expires: {n.expiry}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      <button
                        aria-label={`Edit ${n.title}`}
                        className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
                      >
                        <Edit className="size-4" />
                      </button>
                      <button
                        aria-label={`Delete ${n.title}`}
                        className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-danger-soft hover:text-danger"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-60 flex-1">
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notices…"
            icon={<Search className="size-4" />}
            aria-label="Search notices"
          />
        </div>
        <div className="w-44">
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by category"
            options={[
              { label: "All categories", value: "All" },
              ...Object.keys(categoryConfig).map((c) => ({ label: c, value: c })),
            ]}
          />
        </div>
        <div className="w-40">
          <Select
            value={audienceFilter}
            onChange={(e) => setAudienceFilter(e.target.value)}
            aria-label="Filter by audience"
            options={[
              { label: "All audiences", value: "All" },
              ...["All", "Students", "Parents", "Staff"].map((a) => ({ label: a, value: a })),
            ]}
          />
        </div>
        <div className="w-40">
          <Select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            aria-label="Filter by priority"
            options={[
              { label: "All priorities", value: "All" },
              ...["High", "Medium", "Low"].map((p) => ({ label: p, value: p })),
            ]}
          />
        </div>
        <p className="ml-auto text-xs text-subtle">{filtered.length} notices</p>
      </div>

      <Table
        columns={columns}
        rows={filtered}
        rowKey={(n) => n.id}
        emptyTitle="No notices found"
        emptyDescription="Try clearing your filters to see more results."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted">
          Showing <strong className="font-semibold text-text">{filtered.length}</strong> of{" "}
          <strong className="font-semibold text-text">{notices.length}</strong> notices
        </p>
        <div className="flex flex-wrap items-center gap-4">
          {["High", "Medium", "Low"].map((p) => (
            <div key={p} className="flex items-center gap-1.5">
              <span className={`size-2 rounded-full ${priorityDot[p]}`} />
              <span className="text-xs text-muted">
                {p}:{" "}
                <strong className="font-semibold text-text">
                  {filtered.filter((n) => n.priority === p).length}
                </strong>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

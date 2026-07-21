"use client";

import React, { useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Download,
  FileText,
  Phone,
  Plus,
  Search,
  UserPlus,
  Users,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  PageHeader,
  Pagination,
  Select,
  StatCard,
  Table,
  type Column,
} from "@/components/ui";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 10;

const applications = [
  { id: "ADM-2026-001", name: "Aarav Sharma",     classApplied: "Class 1",  parent: "Rohit Sharma",     phone: "98765-43210", source: "Walk-in",   appliedOn: "2026-01-12", stage: "approved",  score: 88 },
  { id: "ADM-2026-002", name: "Diya Nair",        classApplied: "Class 6",  parent: "Suresh Nair",      phone: "98450-11223", source: "Website",   appliedOn: "2026-01-14", stage: "interview", score: 76 },
  { id: "ADM-2026-003", name: "Kabir Malhotra",   classApplied: "Class 9",  parent: "Vikas Malhotra",   phone: "99887-65432", source: "Referral",  appliedOn: "2026-01-15", stage: "applied",   score: 0  },
  { id: "ADM-2026-004", name: "Ananya Iyer",      classApplied: "Class 11", parent: "Ganesh Iyer",      phone: "90123-45678", source: "Website",   appliedOn: "2026-01-16", stage: "enquiry",   score: 0  },
  { id: "ADM-2026-005", name: "Vivaan Reddy",     classApplied: "Class 1",  parent: "Prasad Reddy",     phone: "88990-11223", source: "Walk-in",   appliedOn: "2026-01-18", stage: "approved",  score: 92 },
  { id: "ADM-2026-006", name: "Ishita Banerjee",  classApplied: "Class 4",  parent: "Arindam Banerjee", phone: "97654-32109", source: "Referral",  appliedOn: "2026-01-19", stage: "rejected",  score: 41 },
  { id: "ADM-2026-007", name: "Reyansh Gupta",    classApplied: "Class 6",  parent: "Deepak Gupta",     phone: "96543-21098", source: "Website",   appliedOn: "2026-01-20", stage: "interview", score: 81 },
  { id: "ADM-2026-008", name: "Saanvi Patil",     classApplied: "Class 9",  parent: "Mahesh Patil",     phone: "95432-10987", source: "Fair",      appliedOn: "2026-01-21", stage: "applied",   score: 0  },
  { id: "ADM-2026-009", name: "Arjun Chauhan",    classApplied: "Class 11", parent: "Bhupendra Chauhan",phone: "94321-09876", source: "Walk-in",   appliedOn: "2026-01-22", stage: "interview", score: 69 },
  { id: "ADM-2026-010", name: "Myra Joshi",       classApplied: "Class 1",  parent: "Nitin Joshi",      phone: "93210-98765", source: "Website",   appliedOn: "2026-01-23", stage: "enquiry",   score: 0  },
  { id: "ADM-2026-011", name: "Advik Deshmukh",   classApplied: "Class 4",  parent: "Sameer Deshmukh",  phone: "92109-87654", source: "Referral",  appliedOn: "2026-01-24", stage: "approved",  score: 85 },
  { id: "ADM-2026-012", name: "Kiara Menon",      classApplied: "Class 6",  parent: "Ravi Menon",       phone: "91098-76543", source: "Fair",      appliedOn: "2026-01-25", stage: "applied",   score: 0  },
  { id: "ADM-2026-013", name: "Atharv Rathore",   classApplied: "Class 9",  parent: "Jitendra Rathore", phone: "90987-65432", source: "Website",   appliedOn: "2026-01-27", stage: "rejected",  score: 38 },
  { id: "ADM-2026-014", name: "Aadhya Kulkarni",  classApplied: "Class 11", parent: "Shirish Kulkarni", phone: "89876-54321", source: "Walk-in",   appliedOn: "2026-01-28", stage: "interview", score: 74 },
  { id: "ADM-2026-015", name: "Vihaan Saxena",    classApplied: "Class 1",  parent: "Alok Saxena",      phone: "88765-43210", source: "Referral",  appliedOn: "2026-01-29", stage: "enquiry",   score: 0  },
  { id: "ADM-2026-016", name: "Anika Bhatt",      classApplied: "Class 4",  parent: "Manoj Bhatt",      phone: "87654-32109", source: "Website",   appliedOn: "2026-02-02", stage: "approved",  score: 90 },
  { id: "ADM-2026-017", name: "Shaurya Pillai",   classApplied: "Class 6",  parent: "Anand Pillai",     phone: "86543-21098", source: "Fair",      appliedOn: "2026-02-03", stage: "applied",   score: 0  },
  { id: "ADM-2026-018", name: "Navya Choudhary",  classApplied: "Class 9",  parent: "Rakesh Choudhary", phone: "85432-10987", source: "Walk-in",   appliedOn: "2026-02-05", stage: "interview", score: 79 },
];

type Application = (typeof applications)[number];

const STAGE_META: Record<
  string,
  { label: string; variant: "default" | "info" | "warning" | "success" | "danger" }
> = {
  enquiry: { label: "Enquiry", variant: "default" },
  applied: { label: "Applied", variant: "info" },
  interview: { label: "Interview", variant: "warning" },
  approved: { label: "Approved", variant: "success" },
  rejected: { label: "Rejected", variant: "danger" },
};

const PIPELINE = ["enquiry", "applied", "interview", "approved", "rejected"] as const;

const STAGE_OPTIONS = PIPELINE.map((s) => ({ label: STAGE_META[s].label, value: s }));

const CLASS_OPTIONS = ["Class 1", "Class 4", "Class 6", "Class 9", "Class 11"].map((c) => ({
  label: c,
  value: c,
}));

const SOURCE_OPTIONS = ["Walk-in", "Website", "Referral", "Fair"].map((s) => ({
  label: s,
  value: s,
}));

export default function AdmissionsPage() {
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("");
  const [classApplied, setClassApplied] = useState("");
  const [source, setSource] = useState("");
  const [page, setPage] = useState(1);

  // Narrowing a filter can strand you past the last page, so reset on change.
  const applyFilter = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  const query = search.trim().toLowerCase();
  const filtered = applications.filter((a) => {
    const matchSearch =
      !query ||
      a.name.toLowerCase().includes(query) ||
      a.id.toLowerCase().includes(query) ||
      a.parent.toLowerCase().includes(query);
    return (
      matchSearch &&
      (!stage || a.stage === stage) &&
      (!classApplied || a.classApplied === classApplied) &&
      (!source || a.source === source)
    );
  });

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const countOf = (s: string) => applications.filter((a) => a.stage === s).length;
  const approved = countOf("approved");
  const inProcess = countOf("applied") + countOf("interview");
  const conversion = Math.round((approved / applications.length) * 100);

  const columns: Column<Application>[] = [
    {
      key: "name",
      header: "Applicant",
      sortable: true,
      render: (a) => (
        <div className="flex items-center gap-3">
          <Avatar name={a.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{a.name}</p>
            <p className="truncate text-xs text-subtle">{a.id}</p>
          </div>
        </div>
      ),
    },
    {
      key: "classApplied",
      header: "Class Applied",
      sortable: true,
      render: (a) => <Badge variant="info">{a.classApplied}</Badge>,
    },
    {
      key: "parent",
      header: "Parent / Guardian",
      sortable: true,
      render: (a) => (
        <div className="min-w-0">
          <p className="truncate text-text">{a.parent}</p>
          <p className="flex items-center gap-1 text-xs text-subtle">
            <Phone className="size-3" />
            {a.phone}
          </p>
        </div>
      ),
    },
    {
      key: "source",
      header: "Source",
      sortable: true,
      render: (a) => <span className="whitespace-nowrap text-muted">{a.source}</span>,
    },
    {
      key: "appliedOn",
      header: "Applied On",
      sortable: true,
      render: (a) => <span className="whitespace-nowrap text-muted">{a.appliedOn}</span>,
    },
    {
      key: "score",
      header: "Entrance",
      sortable: true,
      align: "right",
      render: (a) =>
        a.score > 0 ? (
          <span
            className={cn(
              "font-semibold",
              a.score >= 75 ? "text-success" : a.score >= 50 ? "text-warning" : "text-danger"
            )}
          >
            {a.score}
          </span>
        ) : (
          <span className="text-subtle">—</span>
        ),
    },
    {
      key: "stage",
      header: "Stage",
      sortable: true,
      render: (a) => {
        const meta = STAGE_META[a.stage];
        return <Badge variant={meta.variant}>{meta.label}</Badge>;
      },
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (a) => (
        <button
          title={`Open file for ${a.name}`}
          aria-label={`Open application ${a.id}`}
          className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
        >
          <FileText className="size-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Admissions Pipeline"
        description="Track every applicant from first enquiry through to approval."
        actions={
          <>
            <Button variant="outline">
              <Download className="size-4" />
              Export
            </Button>
            <Button>
              <Plus className="size-4" />
              New Application
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Applications" value={applications.length} icon={Users} tone="indigo" />
        <StatCard label="In Process" value={inProcess} icon={UserPlus} tone="amber" />
        <StatCard label="Approved" value={approved} icon={CheckCircle2} tone="emerald" />
        <StatCard
          label="Conversion Rate"
          value={conversion}
          suffix="%"
          icon={CalendarDays}
          tone="violet"
        />
      </div>

      <Card>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {PIPELINE.map((s) => {
            const count = countOf(s);
            const pct = Math.round((count / applications.length) * 100);
            return (
              <button
                key={s}
                onClick={() => applyFilter(setStage)(stage === s ? "" : s)}
                aria-pressed={stage === s}
                className={cn(
                  "focus-ring rounded-md border p-3 text-left transition-colors",
                  stage === s
                    ? "border-primary bg-primary-soft"
                    : "border-border bg-surface-sunken hover:bg-surface-hover"
                )}
              >
                <p className="text-xs font-medium text-muted">{STAGE_META[s].label}</p>
                <p className="mt-1 text-2xl font-semibold text-text">{count}</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-hover">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-60 flex-1">
          <Input
            type="search"
            placeholder="Search by applicant, application ID or parent…"
            value={search}
            onChange={(e) => applyFilter(setSearch)(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search applications"
          />
        </div>
        <div className="w-40">
          <Select
            value={stage}
            onChange={(e) => applyFilter(setStage)(e.target.value)}
            placeholder="All stages"
            options={STAGE_OPTIONS}
            aria-label="Filter by stage"
          />
        </div>
        <div className="w-40">
          <Select
            value={classApplied}
            onChange={(e) => applyFilter(setClassApplied)(e.target.value)}
            placeholder="All classes"
            options={CLASS_OPTIONS}
            aria-label="Filter by class applied"
          />
        </div>
        <div className="w-40">
          <Select
            value={source}
            onChange={(e) => applyFilter(setSource)(e.target.value)}
            placeholder="All sources"
            options={SOURCE_OPTIONS}
            aria-label="Filter by source"
          />
        </div>
      </div>

      <Table
        columns={columns}
        rows={paged}
        rowKey={(a) => a.id}
        rowClassName={(a) => (a.stage === "rejected" ? "opacity-60" : undefined)}
        emptyTitle="No applications found"
        emptyDescription="Try clearing your filters to see more results."
      />

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        totalItems={filtered.length}
        onPageChange={setPage}
      />
    </div>
  );
}

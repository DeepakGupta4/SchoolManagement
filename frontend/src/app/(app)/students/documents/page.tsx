"use client";

import React, { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Download,
  FileText,
  FolderOpen,
  Search,
  ShieldCheck,
  Upload,
  XCircle,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Input,
  PageHeader,
  Pagination,
  Select,
  StatCard,
  Table,
  useToast,
  type Column,
} from "@/components/ui";
import { exportToCsv } from "@/lib/exportCsv";
import { cn } from "@/lib/utils";
import { useResource } from "@/hooks/useResource";
import { studentDocumentsApi, type StudentDocument } from "@/lib/api/studentDocuments";

const PAGE_SIZE = 10;

/** Each document is one of: verified | pending (uploaded, awaiting check) | missing. */
type DocRecord = StudentDocument;

const DOC_TYPES = [
  { key: "birthCert", label: "Birth Certificate" },
  { key: "aadhaar", label: "Aadhaar" },
  { key: "tc", label: "Transfer Certificate" },
  { key: "marksheets", label: "Marksheets" },
  { key: "photo", label: "Photograph" },
] as const;

type DocKey = (typeof DOC_TYPES)[number]["key"];

const DOC_STATE: Record<
  string,
  { label: string; badge: "success" | "warning" | "danger"; dot: string }
> = {
  verified: { label: "Verified", badge: "success", dot: "bg-success" },
  pending: { label: "Pending", badge: "warning", dot: "bg-warning" },
  missing: { label: "Missing", badge: "danger", dot: "bg-danger" },
};

const STATE_OPTIONS = Object.entries(DOC_STATE).map(([value, m]) => ({ label: m.label, value }));

const DOC_OPTIONS = DOC_TYPES.map((d) => ({ label: d.label, value: d.key }));

function statesOf(r: DocRecord) {
  return DOC_TYPES.map((d) => r[d.key]);
}

function completion(r: DocRecord) {
  const verified = statesOf(r).filter((s) => s === "verified").length;
  return Math.round((verified / DOC_TYPES.length) * 100);
}

export default function StudentDocumentsPage() {
  const [search, setSearch] = useState("");
  const [className, setClassName] = useState("");
  const [docType, setDocType] = useState("");
  const [docState, setDocState] = useState("");
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const { items, loading } = useResource(studentDocumentsApi, {}, { label: "student file" });

  const CLASS_OPTIONS = useMemo(
    () =>
      [...new Set(items.map((r) => r.className))]
        .sort()
        .map((c) => ({ label: `Class ${c}`, value: c })),
    [items]
  );

  const applyFilter = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  const query = search.trim().toLowerCase();
  const filtered = items.filter((r) => {
    const matchSearch =
      !query ||
      r.name.toLowerCase().includes(query) ||
      r.studentId.toLowerCase().includes(query) ||
      r.guardian.toLowerCase().includes(query);

    // "Show me students whose <docType> is <docState>" — either half works alone.
    const matchDoc = !docState
      ? true
      : docType
        ? r[docType as DocKey] === docState
        : statesOf(r).includes(docState);

    return matchSearch && (!className || r.className === className) && matchDoc;
  });

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalSlots = items.length * DOC_TYPES.length;
  const verifiedCount = items.reduce(
    (sum, r) => sum + statesOf(r).filter((s) => s === "verified").length,
    0
  );
  const pendingCount = items.reduce(
    (sum, r) => sum + statesOf(r).filter((s) => s === "pending").length,
    0
  );
  const missingCount = totalSlots - verifiedCount - pendingCount;
  const fullyComplete = items.filter((r) => completion(r) === 100).length;

  /** One row per student in the filtered set, one column per document type. */
  const handleExport = () => {
    if (filtered.length === 0) {
      toast({
        title: "Nothing to export",
        description: "No student files match the current filters.",
        variant: "warning",
      });
      return;
    }
    exportToCsv<DocRecord>(
      "student-documents",
      [
        { header: "Student ID", value: (r) => r.studentId },
        { header: "Student", value: (r) => r.name },
        { header: "Class", value: (r) => r.className },
        { header: "Guardian", value: (r) => r.guardian },
        ...DOC_TYPES.map((d) => ({
          header: d.label,
          value: (r: DocRecord) => DOC_STATE[r[d.key]]?.label ?? r[d.key],
        })),
        { header: "Vault Completion (%)", value: (r) => completion(r) },
      ],
      filtered
    );
    toast({
      title: "Export ready",
      description: `${filtered.length} student file${filtered.length === 1 ? "" : "s"} exported to CSV.`,
    });
  };

  const docColumns: Column<DocRecord>[] = DOC_TYPES.map((d) => ({
    key: d.key,
    header: d.label,
    sortable: true,
    align: "center" as const,
    render: (r: DocRecord) => {
      const meta = DOC_STATE[r[d.key]] ?? DOC_STATE.missing;
      return (
        <span
          title={`${d.label}: ${meta.label}`}
          className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-muted"
        >
          <span className={cn("size-2 rounded-full", meta.dot)} />
          {meta.label}
        </span>
      );
    },
  }));

  const columns: Column<DocRecord>[] = [
    {
      key: "name",
      header: "Student",
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-3">
          <Avatar name={r.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{r.name}</p>
            <p className="truncate text-xs text-subtle">
              {r.studentId} · {r.guardian}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "className",
      header: "Class",
      sortable: true,
      render: (r) => <Badge variant="info">{r.className}</Badge>,
    },
    ...docColumns,
    {
      key: "completion",
      header: "Vault",
      sortable: true,
      sortValue: (r) => completion(r),
      align: "right",
      render: (r) => {
        const pct = completion(r);
        return (
          <div className="flex min-w-28 flex-col items-end gap-1">
            <span
              className={cn(
                "text-xs font-semibold",
                pct === 100 ? "text-success" : pct >= 60 ? "text-warning" : "text-danger"
              )}
            >
              {pct}%
            </span>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-hover">
              <div
                className={cn(
                  "h-full rounded-full",
                  pct === 100 ? "bg-success" : pct >= 60 ? "bg-warning" : "bg-danger"
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button
            title="Open vault"
            aria-label={`Open document vault for ${r.name}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <FolderOpen className="size-4" />
          </button>
          <button
            title="Upload document"
            aria-label={`Upload document for ${r.name}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Upload className="size-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Student Document Vault"
        description="Track birth certificates, Aadhaar, TCs and marksheets for every student."
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download className="size-4" />
              Export Report
            </Button>
            <Button>
              <Upload className="size-4" />
              Bulk Upload
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Documents Verified" value={verifiedCount} icon={ShieldCheck} tone="emerald" />
        <StatCard label="Awaiting Verification" value={pendingCount} icon={Clock} tone="amber" />
        <StatCard label="Missing Documents" value={missingCount} icon={XCircle} tone="rose" />
        <StatCard
          label="Files Complete"
          value={fullyComplete}
          suffix={` / ${items.length}`}
          icon={CheckCircle2}
          tone="indigo"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-60 flex-1">
          <Input
            type="search"
            placeholder="Search by student, ID or guardian…"
            value={search}
            onChange={(e) => applyFilter(setSearch)(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search student documents"
          />
        </div>
        <div className="w-40">
          <Select
            value={className}
            onChange={(e) => applyFilter(setClassName)(e.target.value)}
            placeholder="All classes"
            options={CLASS_OPTIONS}
            aria-label="Filter by class"
          />
        </div>
        <div className="w-48">
          <Select
            value={docType}
            onChange={(e) => applyFilter(setDocType)(e.target.value)}
            placeholder="Any document"
            options={DOC_OPTIONS}
            aria-label="Filter by document type"
          />
        </div>
        <div className="w-40">
          <Select
            value={docState}
            onChange={(e) => applyFilter(setDocState)(e.target.value)}
            placeholder="Any status"
            options={STATE_OPTIONS}
            aria-label="Filter by document status"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-md border border-border bg-surface-sunken px-4 py-2.5">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted">
          <FileText className="size-3.5 text-subtle" />
          Legend
        </span>
        {Object.entries(DOC_STATE).map(([key, meta]) => (
          <span key={key} className="inline-flex items-center gap-1.5 text-xs text-muted">
            <span className={cn("size-2 rounded-full", meta.dot)} />
            {meta.label}
          </span>
        ))}
        <span className="ml-auto text-xs text-muted">{filtered.length} students</span>
      </div>

      <Table
        columns={columns}
        rows={paged}
        rowKey={(r) => r.id}
        loading={loading}
        rowClassName={(r) => (completion(r) < 60 ? "bg-danger-soft" : undefined)}
        emptyTitle="No student files found"
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

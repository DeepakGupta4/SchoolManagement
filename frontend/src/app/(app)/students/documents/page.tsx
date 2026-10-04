"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Download,
  FileText,
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
import { useClassOptions } from "@/hooks/useClassOptions";
import { fetchAllStudents } from "@/lib/api/students";
import { getDocumentSummary, type DocSummary } from "@/lib/api/documents";
import { fullName, type Student } from "@/types/student";
import { BulkUploadModal } from "./BulkUploadModal";
import { ManageDocumentsModal, type ManagedStudent } from "./ManageDocumentsModal";

const PAGE_SIZE = 10;

type DocState = "verified" | "pending" | "missing";

interface DocRecord {
  id: string;
  studentId: string;
  name: string;
  className: string;
  guardian: string;
  avatar?: string;
  birthCert: DocState;
  aadhaar: DocState;
  tc: DocState;
  marksheets: DocState;
  photo: DocState;
}

/** The tracked slots + how older (untagged) docs map to them by title. */
const DOC_TYPES = [
  { key: "birthCert", label: "Birth Certificate", match: /birth/i },
  { key: "aadhaar", label: "Aadhaar", match: /aadhaar|government id|govt/i },
  { key: "tc", label: "Transfer Certificate", match: /transfer|leaving|\btc\b/i },
  { key: "marksheets", label: "Marksheets", match: /marksheet|mark sheet|result|report card/i },
  { key: "photo", label: "Photograph", match: /photo|photograph/i },
] as const;

type DocKey = (typeof DOC_TYPES)[number]["key"];

const DOC_STATE: Record<string, { label: string; badge: "success" | "warning" | "danger"; dot: string }> = {
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
  const [onlyComplete, setOnlyComplete] = useState(false);
  const [page, setPage] = useState(1);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [managing, setManaging] = useState<ManagedStudent | null>(null);
  const { toast } = useToast();
  const { classOptions } = useClassOptions();

  // Derive the vault from REAL data: the active roster + a light summary of every
  // uploaded student document. Uploading/verifying a file updates this directly.
  const [students, setStudents] = useState<Student[]>([]);
  const [summary, setSummary] = useState<DocSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const refresh = () => setReloadKey((k) => k + 1);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    Promise.all([fetchAllStudents({ status: "active" }), getDocumentSummary("student")])
      .then(([studs, sum]) => {
        if (cancelled) return;
        setStudents(studs);
        setSummary(sum);
      })
      .catch(() => {
        if (cancelled) return;
        setStudents([]);
        setSummary([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const records: DocRecord[] = useMemo(() => {
    const byOwner = new Map<string, DocSummary[]>();
    for (const d of summary) {
      const arr = byOwner.get(d.ownerId);
      if (arr) arr.push(d);
      else byOwner.set(d.ownerId, [d]);
    }
    return students.map((s) => {
      const owned = byOwner.get(s.id) ?? [];
      const stateOf = (key: string, match: RegExp): DocState => {
        const matched = owned.filter((d) => d.docType === key || (!d.docType && match.test(d.title)));
        if (matched.some((d) => d.verified)) return "verified";
        if (matched.length) return "pending";
        if (key === "photo" && s.avatar) return "verified"; // the profile photo satisfies it
        return "missing";
      };
      return {
        id: s.id,
        studentId: s.admissionNo,
        name: fullName(s),
        className: s.className,
        guardian: s.guardian?.name ?? "",
        avatar: s.avatar || undefined,
        birthCert: stateOf("birthCert", /birth/i),
        aadhaar: stateOf("aadhaar", /aadhaar|government id|govt/i),
        tc: stateOf("tc", /transfer|leaving|\btc\b/i),
        marksheets: stateOf("marksheets", /marksheet|mark sheet|result|report card/i),
        photo: stateOf("photo", /photo|photograph/i),
      };
    });
  }, [students, summary]);

  const applyFilter = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  const query = search.trim().toLowerCase();
  const filtered = records.filter((r) => {
    const matchSearch =
      !query ||
      r.name.toLowerCase().includes(query) ||
      r.studentId.toLowerCase().includes(query) ||
      r.guardian.toLowerCase().includes(query);
    const matchDoc = !docState
      ? true
      : docType
        ? r[docType as DocKey] === docState
        : statesOf(r).includes(docState as DocState);
    return (
      matchSearch &&
      (!className || r.className === className) &&
      matchDoc &&
      (!onlyComplete || completion(r) === 100)
    );
  });

  // Clamp during render so a shrunk list / reload can't strand an empty page.
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const totalSlots = records.length * DOC_TYPES.length;
  const verifiedCount = records.reduce((sum, r) => sum + statesOf(r).filter((s) => s === "verified").length, 0);
  const pendingCount = records.reduce((sum, r) => sum + statesOf(r).filter((s) => s === "pending").length, 0);
  const missingCount = totalSlots - verifiedCount - pendingCount;
  const fullyComplete = records.filter((r) => completion(r) === 100).length;

  const manageStudent = (id: string) => {
    const s = students.find((x) => x.id === id);
    if (s) setManaging({ id: s.id, name: fullName(s), avatar: s.avatar || undefined });
  };

  const handleExport = () => {
    if (filtered.length === 0) {
      toast({ title: "Nothing to export", description: "No student files match the current filters.", variant: "warning" });
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
        <span title={`${d.label}: ${meta.label}`} className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-muted">
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
          <Avatar name={r.name} src={r.avatar} size="sm" />
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
            <span className={cn("text-xs font-semibold", pct === 100 ? "text-success" : pct >= 60 ? "text-warning" : "text-danger-text")}>
              {pct}%
            </span>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-hover">
              <div
                className={cn("h-full rounded-full", pct === 100 ? "bg-success" : pct >= 60 ? "bg-warning" : "bg-danger")}
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
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="outline" size="sm" onClick={() => manageStudent(r.id)}>
            <Upload className="size-4" />
            Manage
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Student Document Vault"
        description="Upload, track and verify birth certificates, Aadhaar, TCs, marksheets and photos for every student."
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download className="size-4" />
              Export Report
            </Button>
            <Button onClick={() => setBulkOpen(true)}>
              <Upload className="size-4" />
              Bulk Upload
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Documents Verified"
          value={verifiedCount}
          icon={ShieldCheck}
          tone="emerald"
          active={docState === "verified"}
          onClick={() => {
            setOnlyComplete(false);
            applyFilter(setDocState)(docState === "verified" ? "" : "verified");
          }}
        />
        <StatCard
          label="Awaiting Verification"
          value={pendingCount}
          icon={Clock}
          tone="amber"
          active={docState === "pending"}
          onClick={() => {
            setOnlyComplete(false);
            applyFilter(setDocState)(docState === "pending" ? "" : "pending");
          }}
        />
        <StatCard
          label="Missing Documents"
          value={missingCount}
          icon={XCircle}
          tone="rose"
          active={docState === "missing"}
          onClick={() => {
            setOnlyComplete(false);
            applyFilter(setDocState)(docState === "missing" ? "" : "missing");
          }}
        />
        <StatCard
          label="Files Complete"
          value={fullyComplete}
          suffix={` / ${records.length}`}
          icon={CheckCircle2}
          tone="indigo"
          active={onlyComplete}
          onClick={() => {
            setDocState("");
            setOnlyComplete((v) => !v);
            setPage(1);
          }}
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
            options={classOptions}
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
        onRowClick={(r) => manageStudent(r.id)}
        rowClassName={(r) => (completion(r) < 60 ? "bg-danger-soft" : undefined)}
        emptyTitle="No student files found"
        emptyDescription={
          search || className || docType || docState || onlyComplete
            ? "Try clearing your filters to see more results."
            : "Add students to start tracking their documents."
        }
      />

      {!loading && filtered.length > 0 && (
        <Pagination page={safePage} pageSize={PAGE_SIZE} totalItems={filtered.length} onPageChange={setPage} />
      )}

      <BulkUploadModal open={bulkOpen} onOpenChange={setBulkOpen} onUploaded={refresh} />
      <ManageDocumentsModal
        open={!!managing}
        onOpenChange={(o) => !o && setManaging(null)}
        student={managing}
        onChanged={refresh}
      />
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import {
  Clock,
  Download,
  FileCheck2,
  FileText,
  Pencil,
  Plus,
  QrCode,
  Search,
  ShieldCheck,
  Stamp,
  Trash2,
  XCircle,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  ConfirmDialog,
  Input,
  PageHeader,
  Pagination,
  Select,
  StatCard,
  Table,
  Tooltip,
  type Column,
} from "@/components/ui";
import { useResource } from "@/hooks/useResource";
import {
  CERTIFICATE_STATUS_OPTIONS,
  CERTIFICATE_TYPE_OPTIONS,
  certificatesApi,
  makeVerificationCode,
  todayIso,
  type Certificate,
  type CertificateStatus,
  type CertificateType,
} from "@/lib/api/certificates";
import type { CertificateSchema } from "@/lib/schemas/certificate";
import { CertificateFormModal } from "./CertificateFormModal";
import { VerifyCodeModal } from "./VerifyCodeModal";

const PAGE_SIZE = 8;

const TYPE_VARIANT: Record<CertificateType, "info" | "success" | "warning" | "default"> = {
  Transfer: "warning",
  Bonafide: "info",
  Character: "success",
  Migration: "default",
};

const STATUS_VARIANT: Record<CertificateStatus, "success" | "warning" | "info" | "danger"> = {
  pending: "warning",
  "in-review": "info",
  issued: "success",
  rejected: "danger",
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export default function CertificatesPage() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const filters = useMemo(() => ({ search, type, status }), [search, type, status]);

  const { items, loading, error, refetch, save, remove, saving, deleting } = useResource(
    certificatesApi,
    filters,
    { label: "certificate request", describe: (c) => `${c.type} certificate for ${c.student}` }
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Certificate | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Certificate | null>(null);
  const [verifyOpen, setVerifyOpen] = useState(false);

  // A narrowed filter can strand you past the last page, so every filter
  // change resets to page 1.
  const applyFilter = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  const stats = useMemo(() => {
    const issued = items.filter((c) => c.status === "issued").length;
    const pending = items.filter((c) => c.status === "pending").length;
    const inReview = items.filter((c) => c.status === "in-review").length;
    const rejected = items.filter((c) => c.status === "rejected").length;
    return { issued, pending, inReview, rejected };
  }, [items]);

  // Clamp during render — resetting page state from an effect is not allowed.
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (certificate: Certificate) => {
    setEditing(certificate);
    setFormOpen(true);
  };

  const handleSubmit = async (values: CertificateSchema) => {
    // Issue date and verification code are stamped by the office, not typed in.
    const isIssued = values.status === "issued";
    const ok = await save(
      {
        ...values,
        issueDate: isIssued ? editing?.issueDate ?? todayIso() : null,
        verificationCode: isIssued
          ? editing?.verificationCode ?? makeVerificationCode()
          : null,
      },
      editing
    );

    if (ok) {
      setFormOpen(false);
      setEditing(null);
    }
  };

  const issue = async (certificate: Certificate) => {
    await save(
      {
        ...certificate,
        status: "issued",
        issueDate: todayIso(),
        verificationCode: certificate.verificationCode ?? makeVerificationCode(),
      },
      certificate
    );
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    const ok = await remove(pendingDelete);
    if (ok) setPendingDelete(null);
  };

  const clearFilters = () => {
    setSearch("");
    setType("");
    setStatus("");
    setPage(1);
  };

  const columns: Column<Certificate>[] = [
    {
      key: "student",
      header: "Student",
      sortable: true,
      sortValue: (c) => c.student,
      render: (c) => (
        <div className="flex items-center gap-3">
          <Avatar name={c.student} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{c.student}</p>
            <p className="truncate text-xs text-subtle">
              {c.admissionNo} · {c.className}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "type",
      header: "Certificate",
      sortable: true,
      render: (c) => (
        <div className="min-w-0">
          <Badge variant={TYPE_VARIANT[c.type]}>{c.type}</Badge>
          <p className="mt-1 truncate text-xs text-subtle">{c.code}</p>
        </div>
      ),
    },
    {
      key: "requestedBy",
      header: "Requested by",
      render: (c) => (
        <div className="min-w-0">
          <p className="truncate text-muted">{c.requestedBy}</p>
          <p className="mt-0.5 truncate text-xs text-subtle">on {formatDate(c.requestedOn)}</p>
        </div>
      ),
    },
    {
      key: "issueDate",
      header: "Issue date",
      sortable: true,
      sortValue: (c) => c.issueDate ?? "",
      render: (c) =>
        c.issueDate ? (
          <span className="whitespace-nowrap text-muted">{formatDate(c.issueDate)}</span>
        ) : (
          <span className="text-subtle">Not issued</span>
        ),
    },
    {
      key: "verificationCode",
      header: "Verification",
      render: (c) =>
        c.verificationCode ? (
          <Tooltip content="Scan the QR on the certificate to verify this code online">
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm bg-surface-sunken px-2 py-1 text-xs font-medium tracking-widest text-muted">
              <QrCode className="size-3.5 text-subtle" />
              {c.verificationCode}
            </span>
          </Tooltip>
        ) : (
          <span className="text-subtle">—</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (c) => (
        <Badge variant={STATUS_VARIANT[c.status]} className="capitalize">
          {c.status.replace("-", " ")}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (c) => (
        <div className="flex items-center justify-end gap-1">
          {c.status === "issued" ? (
            <Button variant="outline" size="sm">
              <Download className="size-3.5" />
              PDF
            </Button>
          ) : c.status === "pending" || c.status === "in-review" ? (
            <Button variant="outline" size="sm" disabled={saving} onClick={() => issue(c)}>
              <Stamp className="size-3.5" />
              Issue
            </Button>
          ) : null}
          <button
            onClick={() => openEdit(c)}
            aria-label={`Edit ${c.type} certificate request for ${c.student}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Pencil className="size-4" />
          </button>
          <button
            onClick={() => setPendingDelete(c)}
            aria-label={`Delete ${c.type} certificate request for ${c.student}`}
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
        title="Certificates"
        description="Issue transfer, bonafide, character and migration certificates with QR verification."
        actions={
          <>
            <Button variant="outline" onClick={() => setVerifyOpen(true)}>
              <ShieldCheck className="size-4" />
              Verify a code
            </Button>
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              New request
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Issued" value={stats.issued} icon={FileCheck2} tone="emerald" />
        <StatCard label="Pending" value={stats.pending} icon={Clock} tone="amber" />
        <StatCard label="In review" value={stats.inReview} icon={FileText} tone="indigo" />
        <StatCard label="Rejected" value={stats.rejected} icon={XCircle} tone="rose" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-60 flex-1">
          <Input
            type="search"
            placeholder="Search by student, admission no. or verification code…"
            value={search}
            onChange={(e) => applyFilter(setSearch)(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search certificate requests"
          />
        </div>
        <div className="w-44">
          <Select
            value={type}
            onChange={(e) => applyFilter(setType)(e.target.value)}
            placeholder="All types"
            options={CERTIFICATE_TYPE_OPTIONS}
            aria-label="Filter by certificate type"
          />
        </div>
        <div className="w-40">
          <Select
            value={status}
            onChange={(e) => applyFilter(setStatus)(e.target.value)}
            placeholder="All statuses"
            options={CERTIFICATE_STATUS_OPTIONS}
            aria-label="Filter by status"
          />
        </div>
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
        <>
          <Table
            columns={columns}
            rows={paged}
            rowKey={(c) => c.id}
            loading={loading}
            rowClassName={(c) => (c.status === "rejected" ? "opacity-60" : undefined)}
            emptyTitle="No certificate requests found"
            emptyDescription={
              search || type || status
                ? "Try clearing your filters to see more results."
                : "Raise your first certificate request to get started."
            }
            emptyAction={
              search || type || status ? (
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : (
                <Button variant="outline" onClick={openCreate}>
                  <Plus className="size-4" />
                  New request
                </Button>
              )
            }
          />

          <Pagination
            page={safePage}
            pageSize={PAGE_SIZE}
            totalItems={items.length}
            onPageChange={setPage}
          />
        </>
      )}

      <VerifyCodeModal open={verifyOpen} onOpenChange={setVerifyOpen} />

      <CertificateFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        record={editing}
        saving={saving}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete certificate request?"
        description={
          pendingDelete
            ? `The ${pendingDelete.type} certificate request for ${pendingDelete.student} (${pendingDelete.admissionNo}) will be permanently removed. This cannot be undone.`
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

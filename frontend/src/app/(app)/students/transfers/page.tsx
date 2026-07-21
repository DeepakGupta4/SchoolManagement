"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Download,
  LogOut,
  Pencil,
  Plus,
  Printer,
  Search,
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
  useToast,
  type Column,
} from "@/components/ui";
import { exportToCsv } from "@/lib/exportCsv";
import { useResource } from "@/hooks/useResource";
import {
  STATUS_META,
  STATUS_OPTIONS,
  transfersApi,
  TYPE_OPTIONS,
  type TransferRequest,
} from "@/lib/api/transfers";
import type { TransferSchema } from "@/lib/schemas/transfer";
import { TransferFormModal } from "./TransferFormModal";

const PAGE_SIZE = 10;

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function TransfersPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);

  const filters = useMemo(() => ({ search, status, type }), [search, status, type]);

  const { items, loading, error, refetch, save, remove, saving, deleting } = useResource(
    transfersApi,
    filters,
    { label: "request", describe: (r) => r.name }
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TransferRequest | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TransferRequest | null>(null);
  const { toast } = useToast();

  // Narrowing a filter can strand you past the last page, so reset on change.
  const applyFilter = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  const stats = useMemo(() => {
    const countOf = (s: string) => items.filter((r) => r.status === s).length;
    return {
      total: items.length,
      pending: countOf("pending"),
      issued: countOf("issued"),
      dues: items.reduce((sum, r) => sum + r.dues, 0),
    };
  }, [items]);

  // Clamp during render — resetting page state from an effect is not allowed.
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  /** Every filter here is applied server-side, so `items` is what the table shows. */
  const handleExport = () => {
    if (items.length === 0) {
      toast({
        title: "Nothing to export",
        description: "No requests match the current filters.",
        variant: "warning",
      });
      return;
    }
    exportToCsv<TransferRequest>(
      "transfer-requests",
      [
        { header: "Student ID", value: (r) => r.studentId },
        { header: "Student", value: (r) => r.name },
        { header: "Class", value: (r) => r.className },
        { header: "Type", value: (r) => r.type.charAt(0).toUpperCase() + r.type.slice(1) },
        { header: "Reason", value: (r) => r.reason },
        { header: "Requested On", value: (r) => r.requestedOn },
        { header: "TC Number", value: (r) => (r.tcNo === "—" ? "" : r.tcNo) },
        { header: "Issued On", value: (r) => (r.issuedOn === "—" ? "" : r.issuedOn) },
        { header: "Pending Dues", value: (r) => r.dues },
        { header: "Status", value: (r) => STATUS_META[r.status]?.label ?? r.status },
      ],
      items
    );
    toast({
      title: "Export ready",
      description: `${items.length} request${items.length === 1 ? "" : "s"} exported to CSV.`,
    });
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleSubmit = async (values: TransferSchema) => {
    const ok = await save(values, editing);
    if (ok) {
      setFormOpen(false);
      setEditing(null);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    const ok = await remove(pendingDelete);
    if (ok) setPendingDelete(null);
  };

  const columns: Column<TransferRequest>[] = [
    {
      key: "name",
      header: "Student",
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-3">
          <Avatar name={r.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{r.name}</p>
            <p className="truncate text-xs text-subtle">{r.studentId}</p>
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
    {
      key: "type",
      header: "Type",
      sortable: true,
      render: (r) => (
        <Badge variant={r.type === "transfer" ? "default" : "outline"} className="capitalize">
          {r.type}
        </Badge>
      ),
    },
    {
      key: "reason",
      header: "Reason",
      render: (r) => <span className="text-muted">{r.reason}</span>,
    },
    {
      key: "requestedOn",
      header: "Requested",
      sortable: true,
      render: (r) => <span className="whitespace-nowrap text-muted">{r.requestedOn}</span>,
    },
    {
      key: "tcNo",
      header: "TC Number",
      render: (r) =>
        r.tcNo === "—" ? (
          <span className="text-subtle">—</span>
        ) : (
          <span className="whitespace-nowrap font-medium text-text">{r.tcNo}</span>
        ),
    },
    {
      key: "issuedOn",
      header: "Issued On",
      sortable: true,
      render: (r) => <span className="whitespace-nowrap text-subtle">{r.issuedOn}</span>,
    },
    {
      key: "dues",
      header: "Pending Dues",
      sortable: true,
      align: "right",
      render: (r) =>
        r.dues > 0 ? (
          <span className="whitespace-nowrap font-semibold text-danger">{inr.format(r.dues)}</span>
        ) : (
          <span className="whitespace-nowrap text-success">Cleared</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (r) => {
        const meta = STATUS_META[r.status];
        return meta ? <Badge variant={meta.variant}>{meta.label}</Badge> : null;
      },
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          <button
            title="Print transfer certificate"
            aria-label={`Print certificate for ${r.name}`}
            disabled={r.status !== "issued"}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text disabled:pointer-events-none disabled:opacity-40"
          >
            <Printer className="size-4" />
          </button>
          <button
            onClick={() => {
              setEditing(r);
              setFormOpen(true);
            }}
            aria-label={`Edit request for ${r.name}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Pencil className="size-4" />
          </button>
          <button
            onClick={() => setPendingDelete(r)}
            aria-label={`Delete request for ${r.name}`}
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
        title="Transfers & Withdrawals"
        description="Manage transfer certificate requests, approvals and issuance."
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download className="size-4" />
              Export
            </Button>
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              New Request
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Requests" value={stats.total} icon={LogOut} tone="indigo" />
        <StatCard label="Pending Approval" value={stats.pending} icon={Clock} tone="amber" />
        <StatCard label="TCs Issued" value={stats.issued} icon={CheckCircle2} tone="emerald" />
        <StatCard
          label="Outstanding Dues"
          value={inr.format(stats.dues)}
          icon={XCircle}
          tone="rose"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-60 flex-1">
          <Input
            type="search"
            placeholder="Search by student, ID, TC number or reason…"
            value={search}
            onChange={(e) => applyFilter(setSearch)(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search transfer requests"
          />
        </div>
        <div className="w-44">
          <Select
            value={status}
            onChange={(e) => applyFilter(setStatus)(e.target.value)}
            placeholder="All statuses"
            options={STATUS_OPTIONS}
            aria-label="Filter by status"
          />
        </div>
        <div className="w-40">
          <Select
            value={type}
            onChange={(e) => applyFilter(setType)(e.target.value)}
            placeholder="All types"
            options={TYPE_OPTIONS}
            aria-label="Filter by request type"
          />
        </div>
        <p className="text-xs text-muted">{items.length} requests</p>
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
            rowKey={(r) => r.id}
            loading={loading}
            rowClassName={(r) => (r.status === "rejected" ? "opacity-60" : undefined)}
            emptyTitle="No requests found"
            emptyDescription={
              search || status || type
                ? "Try clearing your filters to see more results."
                : "Raise your first transfer request to get started."
            }
            emptyAction={
              <Button variant="outline" onClick={openCreate}>
                <Plus className="size-4" />
                New Request
              </Button>
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

      <TransferFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        record={editing}
        saving={saving}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete request?"
        description={
          pendingDelete
            ? `The ${pendingDelete.type} request for ${pendingDelete.name} (${pendingDelete.studentId}) will be permanently removed. This cannot be undone.`
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

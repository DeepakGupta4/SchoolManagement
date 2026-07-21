"use client";

import { useMemo, useState } from "react";
import {
  BadgeCheck,
  DoorOpen,
  LogIn,
  Pencil,
  QrCode,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
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
  VISITOR_PURPOSE_OPTIONS,
  VISITOR_STATUS_OPTIONS,
  currentTime,
  makePassCode,
  visitorsApi,
  type Visitor,
  type VisitorPurpose,
  type VisitorStatus,
} from "@/lib/api/visitors";
import type { VisitorSchema } from "@/lib/schemas/visitor";
import { VisitorFormModal } from "./VisitorFormModal";

const PAGE_SIZE = 8;

const STATUS_VARIANT: Record<VisitorStatus, "success" | "default" | "warning"> = {
  inside: "success",
  "checked-out": "default",
  expected: "warning",
};

const PURPOSE_VARIANT: Record<VisitorPurpose, "info" | "warning" | "danger" | "default"> = {
  "Parent meeting": "info",
  "Admission enquiry": "info",
  "Vendor / delivery": "default",
  Maintenance: "default",
  "Student pickup": "warning",
  "Official inspection": "danger",
};

export default function VisitorsPage() {
  const [search, setSearch] = useState("");
  const [purpose, setPurpose] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const filters = useMemo(() => ({ search, purpose, status }), [search, purpose, status]);

  const { items, loading, error, refetch, save, remove, saving, deleting } = useResource(
    visitorsApi,
    filters,
    { label: "visitor", describe: (v) => `${v.name} (${v.passCode})` }
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Visitor | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Visitor | null>(null);

  // A narrowed filter can strand you past the last page, so every filter
  // change resets to page 1.
  const applyFilter = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  const stats = useMemo(() => {
    const inside = items.filter((v) => v.status === "inside").length;
    const expected = items.filter((v) => v.status === "expected").length;
    const pickups = items.filter((v) => v.pickupFor).length;
    return { total: items.length, inside, expected, pickups };
  }, [items]);

  // Clamp during render — resetting page state from an effect is not allowed.
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const openCheckIn = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (visitor: Visitor) => {
    setEditing(visitor);
    setFormOpen(true);
  };

  const handleSubmit = async (values: VisitorSchema) => {
    const { notes, ...rest } = values;
    const pickupFor =
      rest.purpose === "Student pickup" ? notes.trim() || "Pending verification" : null;

    const ok = await save(
      {
        ...rest,
        pickupFor,
        passCode: editing?.passCode ?? makePassCode(),
        inTime: editing?.inTime ?? currentTime(),
        outTime:
          rest.status === "checked-out" ? editing?.outTime ?? currentTime() : null,
      },
      editing
    );

    if (ok) {
      setFormOpen(false);
      setEditing(null);
      if (!editing) setPage(1);
    }
  };

  const checkOut = async (visitor: Visitor) => {
    await save({ ...visitor, status: "checked-out", outTime: currentTime() }, visitor);
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    const ok = await remove(pendingDelete);
    if (ok) setPendingDelete(null);
  };

  const clearFilters = () => {
    setSearch("");
    setPurpose("");
    setStatus("");
    setPage(1);
  };

  const columns: Column<Visitor>[] = [
    {
      key: "name",
      header: "Visitor",
      sortable: true,
      sortValue: (v) => v.name,
      render: (v) => (
        <div className="flex items-center gap-3">
          <Avatar name={v.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{v.name}</p>
            <p className="truncate text-xs text-subtle">{v.phone}</p>
          </div>
        </div>
      ),
    },
    {
      key: "purpose",
      header: "Purpose",
      sortable: true,
      render: (v) => <Badge variant={PURPOSE_VARIANT[v.purpose]}>{v.purpose}</Badge>,
    },
    {
      key: "whomToMeet",
      header: "Whom to meet",
      render: (v) => (
        <div className="min-w-0">
          <p className="truncate text-muted">{v.whomToMeet}</p>
          {v.pickupFor && (
            <p className="mt-0.5 inline-flex items-center gap-1 truncate text-xs text-warning-text">
              <ShieldCheck className="size-3 shrink-0" />
              Pickup: {v.pickupFor}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "inTime",
      header: "In / Out",
      sortable: true,
      render: (v) => (
        <span className="whitespace-nowrap text-muted">
          {v.inTime} — {v.outTime ?? <span className="text-subtle">still inside</span>}
        </span>
      ),
    },
    {
      key: "passCode",
      header: "Gate pass",
      render: (v) => (
        <Tooltip content="Scan this code at the gate to verify the pass">
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm bg-surface-sunken px-2 py-1 text-xs font-medium tracking-widest text-muted">
            <QrCode className="size-3.5 text-subtle" />
            {v.passCode}
          </span>
        </Tooltip>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (v) => (
        <Badge variant={STATUS_VARIANT[v.status]} className="capitalize">
          {v.status.replace("-", " ")}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (v) => (
        <div className="flex items-center justify-end gap-1">
          {v.status === "inside" && (
            <Button variant="outline" size="sm" disabled={saving} onClick={() => checkOut(v)}>
              <DoorOpen className="size-3.5" />
              Check out
            </Button>
          )}
          <button
            onClick={() => openEdit(v)}
            aria-label={`Edit ${v.name}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Pencil className="size-4" />
          </button>
          <button
            onClick={() => setPendingDelete(v)}
            aria-label={`Delete ${v.name}`}
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
        title="Visitors & gate"
        description="Log every visitor, issue QR gate passes and authorise student pickups."
        actions={
          <>
            <Button variant="outline">
              <QrCode className="size-4" />
              Scan pass
            </Button>
            <Button onClick={openCheckIn}>
              <UserPlus className="size-4" />
              Check in visitor
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Visitors today" value={stats.total} icon={Users} tone="indigo" />
        <StatCard label="Currently inside" value={stats.inside} icon={LogIn} tone="emerald" />
        <StatCard label="Expected" value={stats.expected} icon={BadgeCheck} tone="amber" />
        <StatCard label="Student pickups" value={stats.pickups} icon={ShieldCheck} tone="rose" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-60 flex-1">
          <Input
            type="search"
            placeholder="Search by name, phone, host or pass code…"
            value={search}
            onChange={(e) => applyFilter(setSearch)(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search visitors"
          />
        </div>
        <div className="w-52">
          <Select
            value={purpose}
            onChange={(e) => applyFilter(setPurpose)(e.target.value)}
            placeholder="All purposes"
            options={VISITOR_PURPOSE_OPTIONS}
            aria-label="Filter by purpose"
          />
        </div>
        <div className="w-40">
          <Select
            value={status}
            onChange={(e) => applyFilter(setStatus)(e.target.value)}
            placeholder="All statuses"
            options={VISITOR_STATUS_OPTIONS}
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
            rowKey={(v) => v.id}
            loading={loading}
            rowClassName={(v) => (v.status === "checked-out" ? "opacity-70" : undefined)}
            emptyTitle="No visitors found"
            emptyDescription="Try clearing your filters, or check in a new visitor at the gate."
            emptyAction={
              search || purpose || status ? (
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : (
                <Button variant="outline" onClick={openCheckIn}>
                  <UserPlus className="size-4" />
                  Check in visitor
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

      <VisitorFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        record={editing}
        saving={saving}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete gate log entry?"
        description={
          pendingDelete
            ? `${pendingDelete.name}'s entry and gate pass ${pendingDelete.passCode} will be removed from the log. This cannot be undone.`
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

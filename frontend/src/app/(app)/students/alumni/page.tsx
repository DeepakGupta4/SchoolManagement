"use client";

import { useMemo, useState } from "react";
import {
  Award,
  Briefcase,
  Download,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  Send,
  Trash2,
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
  useToast,
  type Column,
} from "@/components/ui";
import { exportToCsv } from "@/lib/exportCsv";
import { useResource } from "@/hooks/useResource";
import {
  alumniApi,
  BATCH_OPTIONS,
  CITY_OPTIONS,
  STREAM_OPTIONS,
  type Alumnus,
} from "@/lib/api/alumni";
import type { AlumnusSchema } from "@/lib/schemas/alumnus";
import { AlumnusFormModal } from "./AlumnusFormModal";

const PAGE_SIZE = 10;

export default function AlumniPage() {
  const [search, setSearch] = useState("");
  const [batch, setBatch] = useState("");
  const [stream, setStream] = useState("");
  const [city, setCity] = useState("");
  const [page, setPage] = useState(1);

  const filters = useMemo(
    () => ({ search, batch, stream, city }),
    [search, batch, stream, city]
  );

  const { items, loading, error, refetch, save, remove, saving, deleting } = useResource(
    alumniApi,
    filters,
    { label: "alumnus", describe: (a) => a.name }
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Alumnus | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Alumnus | null>(null);
  const { toast } = useToast();

  // Narrowing a filter can strand you past the last page, so reset on change.
  const applyFilter = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  const stats = useMemo(
    () => ({
      total: items.length,
      batches: new Set(items.map((a) => a.batch)).size,
      cities: new Set(items.map((a) => a.city)).size,
      mentors: items.filter((a) => a.mentor).length,
    }),
    [items]
  );

  // Clamp during render — resetting page state from an effect is not allowed.
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = items.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  /** Every filter here is applied server-side, so `items` is what the table shows. */
  const handleExport = () => {
    if (items.length === 0) {
      toast({
        title: "Nothing to export",
        description: "No alumni match the current filters.",
        variant: "warning",
      });
      return;
    }
    exportToCsv<Alumnus>(
      "alumni",
      [
        { header: "Alumni ID", value: (a) => a.id },
        { header: "Name", value: (a) => a.name },
        { header: "Batch", value: (a) => a.batch },
        { header: "Stream", value: (a) => a.stream },
        { header: "Occupation", value: (a) => a.occupation },
        { header: "Employer", value: (a) => a.employer },
        { header: "City", value: (a) => a.city },
        { header: "Email", value: (a) => a.email },
        { header: "Phone", value: (a) => a.phone },
        { header: "Can Help With", value: (a) => a.interests.join("; ") },
        { header: "Mentor", value: (a) => (a.mentor ? "Yes" : "No") },
      ],
      items
    );
    toast({
      title: "Export ready",
      description: `${items.length} alumn${items.length === 1 ? "us" : "i"} exported to CSV.`,
    });
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  // The form models mentorship as a yes/no select; the record stores a boolean.
  const handleSubmit = async (values: AlumnusSchema) => {
    const ok = await save({ ...values, mentor: values.mentor === "yes" }, editing);
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

  const columns: Column<Alumnus>[] = [
    {
      key: "name",
      header: "Alumnus",
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
      key: "batch",
      header: "Batch",
      sortable: true,
      render: (a) => <Badge variant="info">{a.batch}</Badge>,
    },
    {
      key: "stream",
      header: "Stream",
      sortable: true,
      render: (a) => <span className="whitespace-nowrap text-muted">{a.stream}</span>,
    },
    {
      key: "occupation",
      header: "Current Occupation",
      sortable: true,
      render: (a) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-text">{a.occupation}</p>
          <p className="truncate text-xs text-subtle">{a.employer}</p>
        </div>
      ),
    },
    {
      key: "city",
      header: "Location",
      sortable: true,
      render: (a) => (
        <span className="inline-flex items-center gap-1 whitespace-nowrap text-muted">
          <MapPin className="size-3.5 text-subtle" />
          {a.city}
        </span>
      ),
    },
    {
      key: "contact",
      header: "Contact",
      render: (a) => (
        <div className="min-w-0">
          <p className="truncate text-muted">{a.email}</p>
          <p className="flex items-center gap-1 text-xs text-subtle">
            <Phone className="size-3" />
            {a.phone}
          </p>
        </div>
      ),
    },
    {
      key: "interests",
      header: "Can help with",
      render: (a) =>
        a.interests.length ? (
          <div className="flex flex-wrap gap-1">
            {a.interests.map((i) => (
              <Badge key={i} variant="outline">
                {i}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-subtle">—</span>
        ),
    },
    {
      key: "mentor",
      header: "Mentorship",
      sortable: true,
      sortValue: (a) => (a.mentor ? 1 : 0),
      render: (a) =>
        a.mentor ? <Badge variant="success">Mentor</Badge> : <span className="text-subtle">—</span>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (a) => (
        <div className="flex items-center justify-end gap-1">
          <button
            title="Email alumnus"
            aria-label={`Email ${a.name}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Mail className="size-4" />
          </button>
          <button
            onClick={() => {
              setEditing(a);
              setFormOpen(true);
            }}
            aria-label={`Edit ${a.name}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Pencil className="size-4" />
          </button>
          <button
            onClick={() => setPendingDelete(a)}
            aria-label={`Delete ${a.name}`}
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
        title="Alumni Directory"
        description="Stay connected with passed-out batches and their career journeys."
        actions={
          <>
            {/* Disabled until email delivery is connected. */}
            <Button variant="outline" disabled title="Email delivery is not connected yet">
              <Send className="size-4" />
              Invite to Alumni Meet
            </Button>
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Add alumnus
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Registered Alumni" value={stats.total} icon={Users} tone="indigo" />
        <StatCard label="Batches Covered" value={stats.batches} icon={Award} tone="violet" />
        <StatCard label="Cities" value={stats.cities} icon={Briefcase} tone="cyan" />
        <StatCard label="Volunteer Mentors" value={stats.mentors} icon={Award} tone="emerald" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-60 flex-1">
          <Input
            type="search"
            placeholder="Search by name, occupation or employer…"
            value={search}
            onChange={(e) => applyFilter(setSearch)(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search alumni"
          />
        </div>
        <div className="w-40">
          <Select
            value={batch}
            onChange={(e) => applyFilter(setBatch)(e.target.value)}
            placeholder="All batches"
            options={BATCH_OPTIONS.map((b) => ({ label: `Batch of ${b}`, value: b }))}
            aria-label="Filter by batch"
          />
        </div>
        <div className="w-40">
          <Select
            value={stream}
            onChange={(e) => applyFilter(setStream)(e.target.value)}
            placeholder="All streams"
            options={STREAM_OPTIONS.map((s) => ({ label: s, value: s }))}
            aria-label="Filter by stream"
          />
        </div>
        <div className="w-40">
          <Select
            value={city}
            onChange={(e) => applyFilter(setCity)(e.target.value)}
            placeholder="All cities"
            options={CITY_OPTIONS.map((c) => ({ label: c, value: c }))}
            aria-label="Filter by city"
          />
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="size-4" />
          Export
        </Button>
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
            rowKey={(a) => a.id}
            loading={loading}
            emptyTitle="No alumni found"
            emptyDescription={
              search || batch || stream || city
                ? "Try clearing your filters to see more results."
                : "Add your first alumnus to get started."
            }
            emptyAction={
              <Button variant="outline" onClick={openCreate}>
                <Plus className="size-4" />
                Add alumnus
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

      <AlumnusFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        record={editing}
        saving={saving}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete alumnus?"
        description={
          pendingDelete
            ? `${pendingDelete.name} (batch of ${pendingDelete.batch}) will be permanently removed from the directory. This cannot be undone.`
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

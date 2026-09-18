"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Plus,
  Download,
  Pencil,
  Trash2,
  Users,
  Home,
  DoorOpen,
  KeyRound,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  ConfirmDialog,
  EmptyState,
  Input,
  PageHeader,
  Select,
  StatCard,
  Table,
  useToast,
  type Column,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { exportToCsv } from "@/lib/exportCsv";
import { useResource } from "@/hooks/useResource";
import { textMatch } from "@/lib/api/createResource";
import {
  hostelStudentsApi,
  HOSTEL_OPTIONS,
  FEE_STATUS_OPTIONS,
  type HostelStudent,
} from "@/lib/api/hostelStudents";
import type { HostelStudentSchema } from "@/lib/schemas/hostelStudent";
import { HostelStudentFormModal } from "./HostelStudentFormModal";

const feeVariant: Record<string, "success" | "warning" | "danger"> = {
  Paid: "success",
  Pending: "warning",
  Overdue: "danger",
};

const feeDot: Record<string, string> = {
  Paid: "bg-success",
  Pending: "bg-warning",
  Overdue: "bg-danger",
};

const tabs = ["All", "Boys", "Girls"];

export default function HostelPage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [hostelFilter, setHostelFilter] = useState("All");
  const [feeFilter, setFeeFilter] = useState("All");

  // No filters go to the server: occupancy is counted per hostel from the live
  // allocation records, which needs every resident regardless of the table's
  // current tab/search. The narrowing is applied during render instead.
  const filters = useMemo(() => ({}), []);

  const { items, loading, error, refetch, save, remove, saving, deleting } = useResource(
    hostelStudentsApi,
    filters,
    { label: "resident", describe: (s) => s.name }
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<HostelStudent | null>(null);
  const [pendingDelete, setPendingDelete] = useState<HostelStudent | null>(null);
  const { toast } = useToast();

  // Rows for the table only — occupancy keeps counting every allocation.
  const visible = useMemo(
    () =>
      items.filter((s) => {
        if (activeTab !== "All" && s.type !== activeTab) return false;
        if (hostelFilter !== "All" && s.hostel !== hostelFilter) return false;
        if (feeFilter !== "All" && s.fees !== feeFilter) return false;
        return textMatch(search, s.name, s.studentId, s.room);
      }),
    [items, activeTab, hostelFilter, feeFilter, search]
  );

  const handleExport = () => {
    if (visible.length === 0) {
      toast({
        title: "Nothing to export",
        description: "No residents match the current filters.",
        variant: "warning",
      });
      return;
    }
    exportToCsv<HostelStudent>(
      "hostel-residents",
      [
        { header: "Student ID", value: (s) => s.studentId },
        { header: "Name", value: (s) => s.name },
        { header: "Class", value: (s) => s.class },
        { header: "Hostel", value: (s) => s.hostel },
        { header: "Room", value: (s) => s.room },
        { header: "Type", value: (s) => s.type },
        { header: "Fees", value: (s) => s.fees },
        { header: "Join Date", value: (s) => s.joinDate },
        { header: "Contact", value: (s) => s.contact },
      ],
      visible
    );
    toast({
      title: "Export ready",
      description: `${visible.length} resident${visible.length === 1 ? "" : "s"} exported to CSV.`,
    });
  };

  // No hostel blocks are registered yet, so capacity is unknown.
  const totalRooms = 0;
  const totalOccupied = items.length;
  const totalVacant = Math.max(0, totalRooms - totalOccupied);

  const hasFilters =
    Boolean(search) || activeTab !== "All" || hostelFilter !== "All" || feeFilter !== "All";

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleSubmit = async (values: HostelStudentSchema) => {
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

  const columns: Column<HostelStudent>[] = [
    {
      key: "name",
      header: "Student",
      sortable: true,
      render: (s) => (
        <div className="flex items-center gap-3">
          <Avatar name={s.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{s.name}</p>
            <p className="truncate text-xs text-subtle">{s.studentId}</p>
          </div>
        </div>
      ),
    },
    {
      key: "class",
      header: "Class",
      sortable: true,
      render: (s) => <Badge variant="info">Class {s.class}</Badge>,
    },
    {
      key: "hostel",
      header: "Hostel",
      sortable: true,
      render: (s) => <span className="whitespace-nowrap text-muted">{s.hostel}</span>,
    },
    {
      key: "room",
      header: "Room no.",
      sortable: true,
      render: (s) => (
        <span className="inline-flex rounded-sm bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary-text">
          {s.room}
        </span>
      ),
    },
    {
      key: "type",
      header: "Type",
      sortable: true,
      render: (s) => <Badge variant={s.type === "Boys" ? "info" : "danger"}>{s.type}</Badge>,
    },
    {
      key: "joinDate",
      header: "Join date",
      render: (s) => <span className="whitespace-nowrap text-muted">{s.joinDate}</span>,
    },
    {
      key: "contact",
      header: "Contact",
      render: (s) => <span className="whitespace-nowrap text-muted">{s.contact}</span>,
    },
    {
      key: "fees",
      header: "Fee status",
      sortable: true,
      render: (s) => <Badge variant={feeVariant[s.fees]}>{s.fees}</Badge>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (s) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => {
              setEditing(s);
              setFormOpen(true);
            }}
            aria-label={`Edit ${s.name}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Pencil className="size-4" />
          </button>
          <button
            onClick={() => setPendingDelete(s)}
            aria-label={`Delete ${s.name}`}
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
        title="Hostel"
        description="Manage hostel rooms, students and wardens."
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download className="size-4" />
              Export
            </Button>
            <Button onClick={openCreate}>
              <Plus className="size-4" />
              Add student
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total hostels" value={0} icon={Home} tone="indigo" />
        <StatCard label="Total rooms" value={totalRooms} icon={DoorOpen} tone="violet" />
        <StatCard label="Occupied" value={totalOccupied} icon={Users} tone="emerald" />
        <StatCard label="Vacant" value={totalVacant} icon={KeyRound} tone="amber" />
      </div>

      <Card>
        <EmptyState
          icon={<Home className="size-5" />}
          title="No hostel blocks added yet"
          description="Register a hostel block to track its rooms, warden and occupancy."
        />
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex gap-1 rounded-md bg-surface-sunken p-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "focus-ring rounded-sm px-4 py-1.5 text-xs font-semibold transition-colors",
                activeTab === tab
                  ? "bg-surface-raised text-text shadow-sm"
                  : "text-muted hover:text-text"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="w-48">
          <Select
            value={hostelFilter}
            onChange={(e) => setHostelFilter(e.target.value)}
            aria-label="Filter by hostel"
            options={[
              { label: "All hostels", value: "All" },
              ...HOSTEL_OPTIONS.map((h) => ({ label: h, value: h })),
            ]}
          />
        </div>

        <div className="w-44">
          <Select
            value={feeFilter}
            onChange={(e) => setFeeFilter(e.target.value)}
            aria-label="Filter by fee status"
            options={[
              { label: "All fee status", value: "All" },
              ...FEE_STATUS_OPTIONS.map((f) => ({ label: f, value: f })),
            ]}
          />
        </div>

        <div className="min-w-60 flex-1">
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID or room…"
            icon={<Search className="size-4" />}
            aria-label="Search students"
          />
        </div>

        <p className="text-xs text-muted">{visible.length} students</p>
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
        <Table
          columns={columns}
          rows={visible}
          rowKey={(s) => s.id}
          loading={loading}
          emptyTitle="No students found"
          emptyDescription={
            hasFilters
              ? "Try clearing your filters to see more results."
              : "Add your first hostel resident to get started."
          }
          emptyAction={
            <Button variant="outline" onClick={openCreate}>
              <Plus className="size-4" />
              Add student
            </Button>
          }
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <p className="text-xs text-muted">
          Showing <span className="font-medium text-text">{visible.length}</span> resident(s)
        </p>
        <div className="flex flex-wrap items-center gap-4">
          {FEE_STATUS_OPTIONS.map((status) => (
            <span key={status} className="flex items-center gap-1.5 text-xs text-muted">
              <span className={cn("size-2 rounded-full", feeDot[status])} />
              {status}: <span className="font-semibold text-text">
                {items.filter((s) => s.fees === status).length}
              </span>
            </span>
          ))}
        </div>
      </div>

      <HostelStudentFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        record={editing}
        saving={saving}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Remove resident?"
        description={
          pendingDelete
            ? `${pendingDelete.name} will be removed from ${pendingDelete.hostel} (room ${pendingDelete.room}). This cannot be undone.`
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

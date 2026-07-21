"use client";

import { useMemo, useState } from "react";
import {
  Search,
  Plus,
  Download,
  Pencil,
  Trash2,
  Activity,
  Heart,
  Pill,
  AlertCircle,
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
  Select,
  StatCard,
  Table,
  type Column,
  useToast,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { exportToCsv } from "@/lib/exportCsv";
import { useResource } from "@/hooks/useResource";
import {
  medicinesApi,
  MEDICINE_STOCK_STATUS_OPTIONS,
  type Medicine,
} from "@/lib/api/medicines";
import {
  patientsApi,
  PATIENT_STATUS_OPTIONS,
  PATIENT_TYPE_OPTIONS,
  type Patient,
} from "@/lib/api/patients";
import type { MedicineSchema } from "@/lib/schemas/medicine";
import type { PatientSchema } from "@/lib/schemas/patient";
import { MedicineFormModal } from "./MedicineFormModal";
import { PatientFormModal } from "./PatientFormModal";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

const statusVariant: Record<string, BadgeVariant> = {
  Recovered: "success",
  "Under Treatment": "warning",
  Referred: "danger",
};

const statusDot: Record<string, string> = {
  Recovered: "bg-success",
  "Under Treatment": "bg-warning",
  Referred: "bg-danger",
};

const stockVariant: Record<string, BadgeVariant> = {
  "In Stock": "success",
  "Low Stock": "warning",
  "Out of Stock": "danger",
};

export default function HealthPage() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"patients" | "medicines">("patients");
  // The two tabs have disjoint status vocabularies, so they each keep their own
  // filter — sharing one would blank the other tab's table on switch.
  const [patientStatus, setPatientStatus] = useState("All");
  const [patientType, setPatientType] = useState("All");
  const [medicineStatus, setMedicineStatus] = useState("All");

  const isMedicines = tab === "medicines";

  // The search box is shared, so only feed it to the query that is on screen.
  const patientFilters = useMemo(
    () => ({
      search: isMedicines ? "" : search,
      status: patientStatus,
      type: patientType,
    }),
    [isMedicines, search, patientStatus, patientType]
  );

  const medicineFilters = useMemo(
    () => ({
      search: isMedicines ? search : "",
      status: medicineStatus,
    }),
    [isMedicines, search, medicineStatus]
  );

  const {
    items: patients,
    loading: patientsLoading,
    error: patientsError,
    refetch: refetchPatients,
    save: savePatient,
    remove: removePatient,
    saving: savingPatient,
    deleting: deletingPatient,
  } = useResource(patientsApi, patientFilters, {
    label: "record",
    describe: (p) => p.name,
  });

  const {
    items: medicines,
    loading,
    error,
    refetch,
    save,
    remove,
    saving,
    deleting,
  } = useResource(medicinesApi, medicineFilters, {
    label: "medicine",
    describe: (m) => m.name,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Medicine | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Medicine | null>(null);

  const [patientFormOpen, setPatientFormOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [pendingDeletePatient, setPendingDeletePatient] = useState<Patient | null>(null);

  const recovered = patients.filter((p) => p.status === "Recovered").length;
  const underTreatment = patients.filter((p) => p.status === "Under Treatment").length;
  const lowStock = medicines.filter((m) => m.status !== "In Stock").length;
  const { toast } = useToast();

  /** Follows the active tab so the file matches the table on screen. */
  const handleExport = () => {
    const count = isMedicines ? medicines.length : patients.length;
    if (count === 0) {
      toast({
        title: "Nothing to export",
        description: `No ${isMedicines ? "medicines" : "patient records"} match the current filters.`,
        variant: "warning",
      });
      return;
    }
    if (isMedicines) {
      exportToCsv<Medicine>(
        "medicine-stock",
        [
          { header: "Code", value: (m) => m.code },
          { header: "Medicine", value: (m) => m.name },
          { header: "Category", value: (m) => m.category },
          { header: "Stock", value: (m) => m.stock },
          { header: "Unit", value: (m) => m.unit },
          { header: "Expiry", value: (m) => m.expiry },
          { header: "Status", value: (m) => m.status },
        ],
        medicines
      );
    } else {
      exportToCsv<Patient>(
        "health-records",
        [
          { header: "Code", value: (p) => p.code },
          { header: "Name", value: (p) => p.name },
          { header: "Class", value: (p) => p.class },
          { header: "Type", value: (p) => p.type },
          { header: "Issue", value: (p) => p.issue },
          { header: "Doctor", value: (p) => p.doctor },
          { header: "Date", value: (p) => p.date },
          { header: "Status", value: (p) => p.status },
        ],
        patients
      );
    }
    toast({
      title: "Export ready",
      description: `${count} ${isMedicines ? "medicine" : "patient record"}${count === 1 ? "" : "s"} exported to CSV.`,
    });
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openCreatePatient = () => {
    setEditingPatient(null);
    setPatientFormOpen(true);
  };

  const handleSubmit = async (values: MedicineSchema) => {
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

  const handlePatientSubmit = async (values: PatientSchema) => {
    const ok = await savePatient(values, editingPatient);
    if (ok) {
      setPatientFormOpen(false);
      setEditingPatient(null);
    }
  };

  const handlePatientDelete = async () => {
    if (!pendingDeletePatient) return;
    const ok = await removePatient(pendingDeletePatient);
    if (ok) setPendingDeletePatient(null);
  };

  const patientColumns: Column<Patient>[] = [
    {
      key: "name",
      header: "Patient",
      sortable: true,
      render: (p) => (
        <div className="flex items-center gap-3">
          <Avatar name={p.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{p.name}</p>
            <p className="truncate text-xs text-subtle">{p.code}</p>
          </div>
        </div>
      ),
    },
    {
      key: "class",
      header: "Class",
      sortable: true,
      render: (p) => <Badge variant="info">{p.class}</Badge>,
    },
    {
      key: "issue",
      header: "Issue",
      sortable: true,
      render: (p) => <span className="whitespace-nowrap text-muted">{p.issue}</span>,
    },
    {
      key: "doctor",
      header: "Doctor",
      sortable: true,
      render: (p) => <span className="whitespace-nowrap text-muted">{p.doctor}</span>,
    },
    {
      key: "date",
      header: "Date",
      render: (p) => <span className="whitespace-nowrap text-muted">{p.date}</span>,
    },
    {
      key: "type",
      header: "Type",
      sortable: true,
      render: (p) => <Badge variant={p.type === "Student" ? "info" : "default"}>{p.type}</Badge>,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (p) => <Badge variant={statusVariant[p.status] ?? "default"}>{p.status}</Badge>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (p) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="px-2"
            aria-label={`Edit ${p.name}`}
            onClick={() => {
              setEditingPatient(p);
              setPatientFormOpen(true);
            }}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="px-2 hover:bg-danger-soft hover:text-danger"
            aria-label={`Delete ${p.name}`}
            onClick={() => setPendingDeletePatient(p)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  const medicineColumns: Column<Medicine>[] = [
    {
      key: "name",
      header: "Medicine",
      sortable: true,
      render: (m) => (
        <div className="flex items-center gap-3">
          <div className="gradient-indigo flex size-9 shrink-0 items-center justify-center rounded-md text-white">
            <Pill className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{m.name}</p>
            <p className="truncate text-xs text-subtle">{m.code}</p>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      render: (m) => <Badge variant="default">{m.category}</Badge>,
    },
    {
      key: "stock",
      header: "Stock",
      sortable: true,
      align: "right",
      render: (m) => (
        <span
          className={cn(
            "font-semibold",
            m.stock === 0 ? "text-danger" : m.stock < 15 ? "text-warning" : "text-text"
          )}
        >
          {m.stock}
        </span>
      ),
    },
    {
      key: "unit",
      header: "Unit",
      render: (m) => <span className="text-muted">{m.unit}</span>,
    },
    {
      key: "expiry",
      header: "Expiry",
      render: (m) => <span className="whitespace-nowrap text-muted">{m.expiry}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (m) => <Badge variant={stockVariant[m.status] ?? "default"}>{m.status}</Badge>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (m) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="px-2"
            aria-label={`Edit ${m.name}`}
            onClick={() => {
              setEditing(m);
              setFormOpen(true);
            }}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="px-2 hover:bg-danger-soft hover:text-danger"
            aria-label={`Delete ${m.name}`}
            onClick={() => setPendingDelete(m)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Health"
        description="Manage patient records, medicines and health reports."
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download className="size-4" />
              Export
            </Button>
            <Button onClick={isMedicines ? openCreate : openCreatePatient}>
              <Plus className="size-4" />
              {isMedicines ? "Add medicine" : "Add record"}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total patients" value={patients.length} icon={Heart} tone="rose" />
        <StatCard label="Recovered" value={recovered} icon={Activity} tone="emerald" />
        <StatCard label="Under treatment" value={underTreatment} icon={AlertCircle} tone="amber" />
        <StatCard label="Medicine alerts" value={lowStock} icon={Pill} tone="indigo" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex gap-1 rounded-md bg-surface-sunken p-1">
          {(["patients", "medicines"] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setSearch("");
              }}
              className={cn(
                "focus-ring rounded-sm px-4 py-1.5 text-xs font-semibold capitalize transition-colors",
                tab === t ? "bg-surface-raised text-text shadow-sm" : "text-muted hover:text-text"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "patients" ? (
          <>
            <div className="w-44">
              <Select
                value={patientStatus}
                onChange={(e) => setPatientStatus(e.target.value)}
                aria-label="Filter by status"
                options={[
                  { label: "All status", value: "All" },
                  ...PATIENT_STATUS_OPTIONS.map((s) => ({ label: s, value: s })),
                ]}
              />
            </div>
            <div className="w-36">
              <Select
                value={patientType}
                onChange={(e) => setPatientType(e.target.value)}
                aria-label="Filter by type"
                options={[
                  { label: "All types", value: "All" },
                  ...PATIENT_TYPE_OPTIONS.map((t) => ({ label: t, value: t })),
                ]}
              />
            </div>
          </>
        ) : (
          <div className="w-44">
            <Select
              value={medicineStatus}
              onChange={(e) => setMedicineStatus(e.target.value)}
              aria-label="Filter by stock status"
              options={[
                { label: "All stock", value: "All" },
                ...MEDICINE_STOCK_STATUS_OPTIONS.map((s) => ({ label: s, value: s })),
              ]}
            />
          </div>
        )}

        <div className="min-w-60 flex-1">
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === "patients" ? "Search patients…" : "Search medicines…"}
            icon={<Search className="size-4" />}
            aria-label={tab === "patients" ? "Search patients" : "Search medicines"}
          />
        </div>

        <p className="text-xs text-muted">
          {tab === "patients" ? `${patients.length} records` : `${medicines.length} items`}
        </p>
      </div>

      {tab === "patients" ? (
        patientsError ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-sm font-medium text-danger">{patientsError}</p>
              <Button variant="outline" onClick={refetchPatients}>
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Table
            columns={patientColumns}
            rows={patients}
            rowKey={(p) => p.id}
            loading={patientsLoading}
            emptyTitle="No records found"
            emptyDescription={
              search || patientStatus !== "All" || patientType !== "All"
                ? "Try clearing your filters to see more results."
                : "Add your first health record to get started."
            }
            emptyAction={
              <Button variant="outline" onClick={openCreatePatient}>
                <Plus className="size-4" />
                Add record
              </Button>
            }
          />
        )
      ) : error ? (
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
          columns={medicineColumns}
          rows={medicines}
          rowKey={(m) => m.id}
          loading={loading}
          emptyTitle="No medicines found"
          emptyDescription={
            search || medicineStatus !== "All"
              ? "Try clearing your filters to see more results."
              : "Add your first medicine to get started."
          }
          emptyAction={
            <Button variant="outline" onClick={openCreate}>
              <Plus className="size-4" />
              Add medicine
            </Button>
          }
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <p className="text-xs text-muted">
          Showing{" "}
          <span className="font-medium text-text">
            {tab === "patients" ? patients.length : medicines.length}
          </span>{" "}
          {tab === "patients" ? "records" : "items"}
        </p>
        {tab === "patients" && (
          <div className="flex flex-wrap items-center gap-4">
            {PATIENT_STATUS_OPTIONS.map((s) => (
              <span key={s} className="flex items-center gap-1.5 text-xs text-muted">
                <span className={cn("size-2 rounded-full", statusDot[s])} />
                {s}:{" "}
                <span className="font-semibold text-text">
                  {patients.filter((p) => p.status === s).length}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>

      <MedicineFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        record={editing}
        saving={saving}
        onSubmit={handleSubmit}
      />

      <PatientFormModal
        open={patientFormOpen}
        onOpenChange={setPatientFormOpen}
        record={editingPatient}
        saving={savingPatient}
        onSubmit={handlePatientSubmit}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete medicine?"
        description={
          pendingDelete
            ? `${pendingDelete.name} will be permanently removed from the infirmary stock. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={Boolean(pendingDeletePatient)}
        onOpenChange={(open) => !open && setPendingDeletePatient(null)}
        title="Delete health record?"
        description={
          pendingDeletePatient
            ? `The record for ${pendingDeletePatient.name} (${pendingDeletePatient.code}) will be permanently removed. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        destructive
        loading={deletingPatient}
        onConfirm={handlePatientDelete}
      />
    </div>
  );
}

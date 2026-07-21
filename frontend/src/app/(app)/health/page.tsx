"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  Download,
  Pencil,
  Trash2,
  Eye,
  Activity,
  Heart,
  Pill,
  AlertCircle,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Input,
  PageHeader,
  Select,
  StatCard,
  Table,
  type Column,
} from "@/components/ui";
import { cn } from "@/lib/utils";

const patients = [
  { id: "P001", name: "Aarav Sharma",  class: "10-A", issue: "Fever",        status: "Recovered", date: "12 Jul 2025", doctor: "Dr. Mehta",  type: "Student" },
  { id: "P002", name: "Priya Patel",   class: "9-B",  issue: "Sprained Ankle",status: "Under Treatment", date: "14 Jul 2025", doctor: "Dr. Mehta",  type: "Student" },
  { id: "P003", name: "Rohan Verma",   class: "11-A", issue: "Headache",     status: "Recovered", date: "10 Jul 2025", doctor: "Dr. Singh",  type: "Student" },
  { id: "P004", name: "Sneha Gupta",   class: "8-C",  issue: "Stomach Ache", status: "Referred",  date: "15 Jul 2025", doctor: "Dr. Mehta",  type: "Student" },
  { id: "P005", name: "Karan Singh",   class: "12-B", issue: "Eye Infection", status: "Under Treatment", date: "13 Jul 2025", doctor: "Dr. Singh",  type: "Student" },
  { id: "P006", name: "Mr. Ramesh",    class: "—",    issue: "BP Check",     status: "Recovered", date: "11 Jul 2025", doctor: "Dr. Mehta",  type: "Staff" },
  { id: "P007", name: "Ananya Joshi",  class: "7-A",  issue: "Allergy",      status: "Under Treatment", date: "15 Jul 2025", doctor: "Dr. Singh",  type: "Student" },
  { id: "P008", name: "Vikram Nair",   class: "6-B",  issue: "Cold & Cough", status: "Recovered", date: "09 Jul 2025", doctor: "Dr. Mehta",  type: "Student" },
];

const medicines = [
  { id: "M001", name: "Paracetamol 500mg", category: "Analgesic",    stock: 240, unit: "Tablets", expiry: "Dec 2026", status: "In Stock" },
  { id: "M002", name: "Amoxicillin 250mg", category: "Antibiotic",   stock: 80,  unit: "Capsules",expiry: "Jun 2026", status: "In Stock" },
  { id: "M003", name: "ORS Sachets",       category: "Electrolyte",  stock: 12,  unit: "Sachets", expiry: "Mar 2026", status: "Low Stock" },
  { id: "M004", name: "Ibuprofen 400mg",   category: "Analgesic",    stock: 0,   unit: "Tablets", expiry: "Sep 2026", status: "Out of Stock" },
  { id: "M005", name: "Antacid Syrup",     category: "Antacid",      stock: 6,   unit: "Bottles", expiry: "Nov 2025", status: "Low Stock" },
  { id: "M006", name: "Bandages",          category: "First Aid",    stock: 50,  unit: "Rolls",   expiry: "—",        status: "In Stock" },
  { id: "M007", name: "Antiseptic Cream",  category: "First Aid",    stock: 18,  unit: "Tubes",   expiry: "Aug 2026", status: "In Stock" },
];

type Patient = (typeof patients)[number];
type Medicine = (typeof medicines)[number];

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
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const filteredPatients = patients.filter((p) => {
    const matchStatus = statusFilter === "All" || p.status === statusFilter;
    const matchType = typeFilter === "All" || p.type === typeFilter;
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.issue.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchType && matchSearch;
  });

  const filteredMedicines = medicines.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.category.toLowerCase().includes(search.toLowerCase())
  );

  const recovered = patients.filter((p) => p.status === "Recovered").length;
  const underTreatment = patients.filter((p) => p.status === "Under Treatment").length;
  const lowStock = medicines.filter((m) => m.status !== "In Stock").length;

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
            <p className="truncate text-xs text-subtle">{p.id}</p>
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
      render: (p) => <Badge variant={statusVariant[p.status]}>{p.status}</Badge>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (p) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" className="px-2" aria-label={`View ${p.name}`}>
            <Eye className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" className="px-2" aria-label={`Edit ${p.name}`}>
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="px-2 hover:bg-danger-soft hover:text-danger"
            aria-label={`Delete ${p.name}`}
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
            <p className="truncate text-xs text-subtle">{m.id}</p>
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
      render: (m) => <Badge variant={stockVariant[m.status]}>{m.status}</Badge>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (m) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" className="px-2" aria-label={`Edit ${m.name}`}>
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="px-2 hover:bg-danger-soft hover:text-danger"
            aria-label={`Delete ${m.name}`}
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
            <Button variant="outline">
              <Download className="size-4" />
              Export
            </Button>
            <Button>
              <Plus className="size-4" />
              Add record
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
                setStatusFilter("All");
                setTypeFilter("All");
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

        {tab === "patients" && (
          <>
            <div className="w-44">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by status"
                options={[
                  { label: "All status", value: "All" },
                  { label: "Recovered", value: "Recovered" },
                  { label: "Under Treatment", value: "Under Treatment" },
                  { label: "Referred", value: "Referred" },
                ]}
              />
            </div>
            <div className="w-36">
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                aria-label="Filter by type"
                options={[
                  { label: "All types", value: "All" },
                  { label: "Student", value: "Student" },
                  { label: "Staff", value: "Staff" },
                ]}
              />
            </div>
          </>
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
          {tab === "patients"
            ? `${filteredPatients.length} records`
            : `${filteredMedicines.length} items`}
        </p>
      </div>

      {tab === "patients" ? (
        <Table
          columns={patientColumns}
          rows={filteredPatients}
          rowKey={(p) => p.id}
          emptyTitle="No records found"
          emptyDescription="Try adjusting your filters or search."
        />
      ) : (
        <Table
          columns={medicineColumns}
          rows={filteredMedicines}
          rowKey={(m) => m.id}
          emptyTitle="No medicines found"
          emptyDescription="Try a different search term."
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <p className="text-xs text-muted">
          Showing{" "}
          <span className="font-medium text-text">
            {tab === "patients" ? filteredPatients.length : filteredMedicines.length}
          </span>{" "}
          of{" "}
          <span className="font-medium text-text">
            {tab === "patients" ? patients.length : medicines.length}
          </span>{" "}
          {tab === "patients" ? "records" : "items"}
        </p>
        {tab === "patients" && (
          <div className="flex flex-wrap items-center gap-4">
            {["Recovered", "Under Treatment", "Referred"].map((s) => (
              <span key={s} className="flex items-center gap-1.5 text-xs text-muted">
                <span className={cn("size-2 rounded-full", statusDot[s])} />
                {s}:{" "}
                <span className="font-semibold text-text">
                  {filteredPatients.filter((p) => p.status === s).length}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

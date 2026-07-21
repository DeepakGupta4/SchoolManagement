"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  Download,
  Pencil,
  Trash2,
  Eye,
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
  Input,
  PageHeader,
  Select,
  StatCard,
  Table,
  type Column,
} from "@/components/ui";
import { cn } from "@/lib/utils";

const hostels = [
  { id: "H001", name: "Boys Hostel A",   type: "Boys",  totalRooms: 30, occupied: 28, warden: "Mr. Ramesh Gupta",   contact: "98765-11111", floors: 3, amenities: ["WiFi", "Mess", "Gym", "Laundry"] },
  { id: "H002", name: "Boys Hostel B",   type: "Boys",  totalRooms: 25, occupied: 20, warden: "Mr. Suresh Sharma",  contact: "98765-22222", floors: 2, amenities: ["WiFi", "Mess", "Study Room"] },
  { id: "H003", name: "Girls Hostel A",  type: "Girls", totalRooms: 35, occupied: 34, warden: "Ms. Priya Verma",    contact: "98765-33333", floors: 4, amenities: ["WiFi", "Mess", "Gym", "Salon"] },
  { id: "H004", name: "Girls Hostel B",  type: "Girls", totalRooms: 20, occupied: 15, warden: "Ms. Anita Patel",    contact: "98765-44444", floors: 2, amenities: ["WiFi", "Mess", "Library"] },
];

const students = [
  { id: "S001", name: "Aarav Sharma",   class: "10-A", hostel: "Boys Hostel A",  room: "A-101", type: "Boys",  fees: "Paid",    joinDate: "Apr 2025", contact: "98765-XXXXX" },
  { id: "S002", name: "Rohan Verma",    class: "9-B",  hostel: "Boys Hostel A",  room: "A-102", type: "Boys",  fees: "Pending", joinDate: "Apr 2025", contact: "87654-XXXXX" },
  { id: "S003", name: "Karan Singh",    class: "11-A", hostel: "Boys Hostel B",  room: "B-201", type: "Boys",  fees: "Paid",    joinDate: "Apr 2025", contact: "76543-XXXXX" },
  { id: "S004", name: "Vikram Nair",    class: "8-A",  hostel: "Boys Hostel B",  room: "B-105", type: "Boys",  fees: "Overdue", joinDate: "Jan 2025", contact: "65432-XXXXX" },
  { id: "S005", name: "Priya Patel",    class: "10-A", hostel: "Girls Hostel A", room: "G-301", type: "Girls", fees: "Paid",    joinDate: "Apr 2025", contact: "54321-XXXXX" },
  { id: "S006", name: "Sneha Gupta",    class: "11-C", hostel: "Girls Hostel A", room: "G-302", type: "Girls", fees: "Paid",    joinDate: "Apr 2025", contact: "43210-XXXXX" },
  { id: "S007", name: "Ananya Joshi",   class: "12-B", hostel: "Girls Hostel A", room: "G-401", type: "Girls", fees: "Paid",    joinDate: "Jan 2025", contact: "32109-XXXXX" },
  { id: "S008", name: "Meera Iyer",     class: "6-B",  hostel: "Girls Hostel B", room: "GB-101",type: "Girls", fees: "Pending", joinDate: "Apr 2025", contact: "21098-XXXXX" },
  { id: "S009", name: "Arjun Reddy",    class: "9-A",  hostel: "Boys Hostel A",  room: "A-205", type: "Boys",  fees: "Paid",    joinDate: "Apr 2025", contact: "11987-XXXXX" },
  { id: "S010", name: "Pooja Mishra",   class: "10-B", hostel: "Girls Hostel B", room: "GB-202",type: "Girls", fees: "Overdue", joinDate: "Jan 2025", contact: "10876-XXXXX" },
];

type Student = (typeof students)[number];

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

/** Per-hostel accent, drawn from the shared gradient tokens. */
const hostelGradients = ["gradient-indigo", "gradient-cyan", "gradient-rose", "gradient-emerald"];

const tabs = ["All", "Boys", "Girls"];

function occupancyTone(pct: number) {
  if (pct >= 90) return { bar: "bg-danger", text: "text-danger" };
  if (pct >= 70) return { bar: "bg-warning", text: "text-warning" };
  return { bar: "bg-success", text: "text-success" };
}

function RowActions({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="sm" className="px-2" aria-label={`View ${label}`}>
        <Eye className="size-4" />
      </Button>
      <Button variant="ghost" size="sm" className="px-2" aria-label={`Edit ${label}`}>
        <Pencil className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="px-2 hover:bg-danger-soft hover:text-danger"
        aria-label={`Delete ${label}`}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

export default function HostelPage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [hostelFilter, setHostelFilter] = useState("All");
  const [feeFilter, setFeeFilter] = useState("All");

  const filtered = students.filter((s) => {
    const matchTab = activeTab === "All" || s.type === activeTab;
    const matchHostel = hostelFilter === "All" || s.hostel === hostelFilter;
    const matchFee = feeFilter === "All" || s.fees === feeFilter;
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase()) ||
      s.room.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchHostel && matchFee && matchSearch;
  });

  const totalOccupied = hostels.reduce((s, h) => s + h.occupied, 0);
  const totalRooms = hostels.reduce((s, h) => s + h.totalRooms, 0);
  const totalVacant = totalRooms - totalOccupied;

  const columns: Column<Student>[] = [
    {
      key: "name",
      header: "Student",
      sortable: true,
      render: (s) => (
        <div className="flex items-center gap-3">
          <Avatar name={s.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{s.name}</p>
            <p className="truncate text-xs text-subtle">{s.id}</p>
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
      render: (s) => <RowActions label={s.name} />,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Hostel"
        description="Manage hostel rooms, students and wardens."
        actions={
          <>
            <Button variant="outline">
              <Download className="size-4" />
              Export
            </Button>
            <Button>
              <Plus className="size-4" />
              Add student
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total hostels" value={hostels.length} icon={Home} tone="indigo" />
        <StatCard label="Total rooms" value={totalRooms} icon={DoorOpen} tone="violet" />
        <StatCard label="Occupied" value={totalOccupied} icon={Users} tone="emerald" />
        <StatCard label="Vacant" value={totalVacant} icon={KeyRound} tone="amber" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {hostels.map((h, idx) => {
          const gradient = hostelGradients[idx % hostelGradients.length];
          const occupancyPct = Math.round((h.occupied / h.totalRooms) * 100);
          const tone = occupancyTone(occupancyPct);
          return (
            <Card key={h.id} className="overflow-hidden">
              <div className={cn("h-1.5", gradient)} />
              <CardContent>
                <div className="mb-3.5 flex items-center gap-3">
                  <div
                    className={cn(
                      "flex size-11 shrink-0 items-center justify-center rounded-md text-white",
                      gradient
                    )}
                  >
                    <Home className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text">{h.name}</p>
                    <Badge variant={h.type === "Boys" ? "info" : "danger"} className="mt-1">
                      {h.type}
                    </Badge>
                  </div>
                </div>

                <div className="mb-3.5">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="text-xs text-muted">Occupancy</span>
                    <span className={cn("text-xs font-semibold", tone.text)}>
                      {h.occupied}/{h.totalRooms} ({occupancyPct}%)
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-hover">
                    <div
                      className={cn("h-full rounded-full", tone.bar)}
                      style={{ width: `${occupancyPct}%` }}
                    />
                  </div>
                </div>

                <div className="mb-3.5 flex flex-col gap-1.5">
                  {[
                    { label: "Warden", value: h.warden },
                    { label: "Floors", value: String(h.floors) },
                    { label: "Contact", value: h.contact },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-2">
                      <span className="text-xs text-subtle">{row.label}</span>
                      <span className="truncate text-xs font-medium text-text">{row.value}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {h.amenities.map((a) => (
                    <Badge key={a} variant="outline">
                      {a}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

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
              ...hostels.map((h) => ({ label: h.name, value: h.name })),
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
              { label: "Paid", value: "Paid" },
              { label: "Pending", value: "Pending" },
              { label: "Overdue", value: "Overdue" },
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

        <p className="text-xs text-muted">{filtered.length} students</p>
      </div>

      <Table
        columns={columns}
        rows={filtered}
        rowKey={(s) => s.id}
        emptyTitle="No students found"
        emptyDescription="Try adjusting your filters."
      />

      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <p className="text-xs text-muted">
          Showing <span className="font-medium text-text">{filtered.length}</span> of{" "}
          <span className="font-medium text-text">{students.length}</span> students
        </p>
        <div className="flex flex-wrap items-center gap-4">
          {["Paid", "Pending", "Overdue"].map((status) => (
            <span key={status} className="flex items-center gap-1.5 text-xs text-muted">
              <span className={cn("size-2 rounded-full", feeDot[status])} />
              {status}: <span className="font-semibold text-text">
                {filtered.filter((s) => s.fees === status).length}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

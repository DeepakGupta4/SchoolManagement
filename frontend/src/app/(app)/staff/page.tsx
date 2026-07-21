"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  Download,
  Eye,
  Pencil,
  Trash2,
  Phone,
  Mail,
  Users,
  Briefcase,
  Clock,
  UserCheck,
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

const staffList = [
  { id: "ST001", name: "Mr. Rajesh Sharma",   role: "Principal",         dept: "Administration", type: "Full-time", status: "active",   phone: "98765-11111", email: "rajesh@school.edu",   join: "Jan 2015", salary: "₹85,000" },
  { id: "ST002", name: "Ms. Sunita Verma",    role: "Vice Principal",    dept: "Administration", type: "Full-time", status: "active",   phone: "98765-22222", email: "sunita@school.edu",   join: "Mar 2017", salary: "₹72,000" },
  { id: "ST003", name: "Mr. Anil Kumar",      role: "Accountant",        dept: "Finance",        type: "Full-time", status: "active",   phone: "98765-33333", email: "anil@school.edu",     join: "Jun 2018", salary: "₹45,000" },
  { id: "ST004", name: "Ms. Pooja Mehta",     role: "HR Manager",        dept: "HR",             type: "Full-time", status: "active",   phone: "98765-44444", email: "pooja@school.edu",    join: "Aug 2019", salary: "₹50,000" },
  { id: "ST005", name: "Mr. Suresh Nair",     role: "IT Administrator",  dept: "IT",             type: "Full-time", status: "active",   phone: "98765-55555", email: "suresh@school.edu",   join: "Feb 2020", salary: "₹55,000" },
  { id: "ST006", name: "Ms. Kavita Joshi",    role: "Librarian",         dept: "Library",        type: "Full-time", status: "on-leave", phone: "98765-66666", email: "kavita@school.edu",   join: "Apr 2016", salary: "₹38,000" },
  { id: "ST007", name: "Mr. Deepak Singh",    role: "Security Head",     dept: "Security",       type: "Full-time", status: "active",   phone: "98765-77777", email: "deepak@school.edu",   join: "Jan 2018", salary: "₹32,000" },
  { id: "ST008", name: "Ms. Anita Gupta",     role: "Receptionist",      dept: "Administration", type: "Full-time", status: "active",   phone: "98765-88888", email: "anita@school.edu",    join: "Sep 2021", salary: "₹28,000" },
  { id: "ST009", name: "Mr. Ramesh Patel",    role: "Transport Manager", dept: "Transport",      type: "Full-time", status: "active",   phone: "98765-99999", email: "ramesh@school.edu",   join: "Jul 2017", salary: "₹42,000" },
  { id: "ST010", name: "Ms. Nisha Reddy",     role: "Nurse",             dept: "Health",         type: "Part-time", status: "active",   phone: "98765-10101", email: "nisha@school.edu",    join: "Mar 2022", salary: "₹25,000" },
  { id: "ST011", name: "Mr. Vinod Tiwari",    role: "Canteen Manager",   dept: "Canteen",        type: "Full-time", status: "active",   phone: "98765-11211", email: "vinod@school.edu",    join: "Nov 2019", salary: "₹30,000" },
  { id: "ST012", name: "Ms. Rekha Iyer",      role: "Counselor",         dept: "HR",             type: "Part-time", status: "inactive", phone: "98765-12121", email: "rekha@school.edu",    join: "Jan 2023", salary: "₹22,000" },
];

type Staff = (typeof staffList)[number];

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

/** Departments map onto the semantic badge palette — no per-department hexes. */
const DEPT_VARIANT: Record<string, BadgeVariant> = {
  Administration: "info",
  Finance: "success",
  HR: "default",
  IT: "info",
  Library: "warning",
  Security: "danger",
  Transport: "default",
  Health: "danger",
  Canteen: "warning",
};

const STATUS_META: Record<string, { variant: BadgeVariant; dot: string; label: string }> = {
  active: { variant: "success", dot: "bg-success", label: "Active" },
  "on-leave": { variant: "warning", dot: "bg-warning", label: "On Leave" },
  inactive: { variant: "default", dot: "bg-subtle", label: "Inactive" },
};

const departments = ["All", ...Array.from(new Set(staffList.map((s) => s.dept)))];

export default function StaffPage() {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const filtered = staffList.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.role.toLowerCase().includes(search.toLowerCase()) ||
      s.id.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === "All" || s.dept === deptFilter;
    const matchType = typeFilter === "All" || s.type === typeFilter;
    const matchStatus = statusFilter === "All" || s.status === statusFilter;
    return matchSearch && matchDept && matchType && matchStatus;
  });

  const totalActive = staffList.filter((s) => s.status === "active").length;
  const totalOnLeave = staffList.filter((s) => s.status === "on-leave").length;
  const totalPartTime = staffList.filter((s) => s.type === "Part-time").length;

  const deptCounts = staffList.reduce<Record<string, number>>((acc, s) => {
    acc[s.dept] = (acc[s.dept] || 0) + 1;
    return acc;
  }, {});

  const columns: Column<Staff>[] = [
    {
      key: "name",
      header: "Staff Member",
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
      key: "role",
      header: "Role",
      sortable: true,
      render: (s) => <span className="whitespace-nowrap text-muted">{s.role}</span>,
    },
    {
      key: "dept",
      header: "Department",
      sortable: true,
      render: (s) => <Badge variant={DEPT_VARIANT[s.dept] ?? "default"}>{s.dept}</Badge>,
    },
    {
      key: "type",
      header: "Type",
      sortable: true,
      render: (s) => (
        <Badge variant={s.type === "Full-time" ? "success" : "warning"}>{s.type}</Badge>
      ),
    },
    {
      key: "salary",
      header: "Salary",
      sortable: true,
      align: "right",
      render: (s) => <span className="whitespace-nowrap font-medium text-text">{s.salary}</span>,
    },
    {
      key: "join",
      header: "Join Date",
      render: (s) => <span className="whitespace-nowrap text-muted">{s.join}</span>,
    },
    {
      key: "contact",
      header: "Contact",
      render: (s) => (
        <div className="flex flex-col gap-1 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <Phone className="size-3 text-subtle" />
            {s.phone}
          </span>
          <span className="flex items-center gap-1.5">
            <Mail className="size-3 text-subtle" />
            {s.email}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (s) => {
        const meta = STATUS_META[s.status];
        return <Badge variant={meta.variant}>{meta.label}</Badge>;
      },
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (s) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" className="px-2" aria-label={`View ${s.name}`}>
            <Eye className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" className="px-2" aria-label={`Edit ${s.name}`}>
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="px-2 hover:bg-danger-soft hover:text-danger"
            aria-label={`Delete ${s.name}`}
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
        title="Staff Management"
        description="Manage non-teaching staff across all departments"
        actions={
          <>
            <Button variant="outline">
              <Download className="size-4" />
              Export
            </Button>
            <Button>
              <Plus className="size-4" />
              Add Staff
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Staff" value={staffList.length} icon={Users} tone="cyan" />
        <StatCard label="Active" value={totalActive} icon={UserCheck} tone="emerald" />
        <StatCard label="On Leave" value={totalOnLeave} icon={Clock} tone="amber" />
        <StatCard label="Part-time" value={totalPartTime} icon={Briefcase} tone="violet" />
      </div>

      {/* Department summary — each tile toggles the department filter */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
        {Object.entries(deptCounts).map(([dept, count]) => {
          const active = deptFilter === dept;
          return (
            <button
              key={dept}
              onClick={() => setDeptFilter(active ? "All" : dept)}
              aria-pressed={active}
              className={`focus-ring rounded-md border px-4 py-3 text-left transition-colors ${
                active
                  ? "border-primary bg-primary-soft"
                  : "border-border bg-surface-raised hover:bg-surface-hover"
              }`}
            >
              <p
                className={`truncate text-[10px] font-semibold uppercase tracking-widest ${
                  active ? "text-primary-text" : "text-subtle"
                }`}
              >
                {dept}
              </p>
              <p className="mt-1 text-xl font-semibold text-text">{count}</p>
              <p className="text-xs text-muted">members</p>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-60 flex-1">
          <Input
            type="search"
            placeholder="Search by name, role or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search staff"
          />
        </div>
        <div className="w-48">
          <Select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            options={departments.map((d) => ({ label: d === "All" ? "All Departments" : d, value: d }))}
            aria-label="Filter by department"
          />
        </div>
        <div className="w-40">
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={[
              { label: "All Types", value: "All" },
              { label: "Full-time", value: "Full-time" },
              { label: "Part-time", value: "Part-time" },
            ]}
            aria-label="Filter by employment type"
          />
        </div>
        <div className="w-40">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { label: "All Status", value: "All" },
              { label: "Active", value: "active" },
              { label: "On Leave", value: "on-leave" },
              { label: "Inactive", value: "inactive" },
            ]}
            aria-label="Filter by status"
          />
        </div>
        <p className="ml-auto text-xs text-subtle">{filtered.length} staff members</p>
      </div>

      <Table
        columns={columns}
        rows={filtered}
        rowKey={(s) => s.id}
        emptyTitle="No staff found"
        emptyDescription="Try adjusting your filters"
      />

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
        <p>
          Showing <strong className="font-semibold text-text">{filtered.length}</strong> of{" "}
          <strong className="font-semibold text-text">{staffList.length}</strong> staff members
        </p>
        <div className="flex flex-wrap items-center gap-4">
          {["active", "on-leave", "inactive"].map((st) => {
            const meta = STATUS_META[st];
            const count = filtered.filter((s) => s.status === st).length;
            return (
              <span key={st} className="flex items-center gap-1.5">
                <span className={`size-2 rounded-full ${meta.dot}`} />
                {meta.label}: <strong className="font-semibold text-text">{count}</strong>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

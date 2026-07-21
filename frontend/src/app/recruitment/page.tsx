"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  Download,
  Eye,
  Pencil,
  Trash2,
  Briefcase,
  Users,
  CheckCircle,
  Clock,
  Calendar,
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

const jobs = [
  { id: "JB001", title: "Mathematics Teacher",    dept: "Teaching",       type: "Full-time", posted: "01 Jul 2025", deadline: "31 Jul 2025", applicants: 18, status: "Open" },
  { id: "JB002", title: "Physics Teacher",         dept: "Teaching",       type: "Full-time", posted: "05 Jul 2025", deadline: "05 Aug 2025", applicants: 12, status: "Open" },
  { id: "JB003", title: "IT Administrator",        dept: "IT",             type: "Full-time", posted: "20 Jun 2025", deadline: "20 Jul 2025", applicants: 25, status: "Closed" },
  { id: "JB004", title: "Accountant",              dept: "Finance",        type: "Full-time", posted: "10 Jul 2025", deadline: "10 Aug 2025", applicants: 9,  status: "Open" },
  { id: "JB005", title: "School Counselor",        dept: "HR",             type: "Part-time", posted: "12 Jul 2025", deadline: "12 Aug 2025", applicants: 7,  status: "Open" },
  { id: "JB006", title: "Security Guard",          dept: "Security",       type: "Full-time", posted: "15 Jun 2025", deadline: "15 Jul 2025", applicants: 30, status: "Closed" },
];

const applicants = [
  { id: "AP001", name: "Arjun Mehta",     job: "Mathematics Teacher",  dept: "Teaching",  exp: "5 yrs", applied: "03 Jul 2025", status: "Shortlisted", phone: "98765-11111", email: "arjun@email.com" },
  { id: "AP002", name: "Sneha Kapoor",    job: "Mathematics Teacher",  dept: "Teaching",  exp: "3 yrs", applied: "04 Jul 2025", status: "Under Review", phone: "98765-22222", email: "sneha@email.com" },
  { id: "AP003", name: "Rahul Desai",     job: "Physics Teacher",      dept: "Teaching",  exp: "7 yrs", applied: "06 Jul 2025", status: "Shortlisted", phone: "98765-33333", email: "rahul@email.com" },
  { id: "AP004", name: "Pooja Nair",      job: "IT Administrator",     dept: "IT",        exp: "4 yrs", applied: "22 Jun 2025", status: "Hired",       phone: "98765-44444", email: "pooja@email.com" },
  { id: "AP005", name: "Vikram Joshi",    job: "IT Administrator",     dept: "IT",        exp: "6 yrs", applied: "23 Jun 2025", status: "Rejected",    phone: "98765-55555", email: "vikram@email.com" },
  { id: "AP006", name: "Ananya Singh",    job: "Accountant",           dept: "Finance",   exp: "2 yrs", applied: "11 Jul 2025", status: "Under Review", phone: "98765-66666", email: "ananya@email.com" },
  { id: "AP007", name: "Karan Sharma",    job: "School Counselor",     dept: "HR",        exp: "3 yrs", applied: "13 Jul 2025", status: "Shortlisted", phone: "98765-77777", email: "karan@email.com" },
  { id: "AP008", name: "Meera Iyer",      job: "Security Guard",       dept: "Security",  exp: "8 yrs", applied: "16 Jun 2025", status: "Hired",       phone: "98765-88888", email: "meera@email.com" },
  { id: "AP009", name: "Rohit Verma",     job: "Physics Teacher",      dept: "Teaching",  exp: "2 yrs", applied: "07 Jul 2025", status: "Under Review", phone: "98765-99999", email: "rohit@email.com" },
  { id: "AP010", name: "Divya Patel",     job: "Accountant",           dept: "Finance",   exp: "5 yrs", applied: "12 Jul 2025", status: "Shortlisted", phone: "98765-10101", email: "divya@email.com" },
];

type Job = (typeof jobs)[number];
type Applicant = (typeof applicants)[number];

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

const APPLICANT_STATUS: Record<string, { variant: BadgeVariant; dot: string }> = {
  Shortlisted: { variant: "info", dot: "bg-info" },
  "Under Review": { variant: "warning", dot: "bg-warning" },
  Hired: { variant: "success", dot: "bg-success" },
  Rejected: { variant: "danger", dot: "bg-danger" },
};

const JOB_STATUS: Record<string, BadgeVariant> = {
  Open: "success",
  Closed: "danger",
};

const DEPT_VARIANT: Record<string, BadgeVariant> = {
  Teaching: "info",
  IT: "info",
  Finance: "success",
  HR: "default",
  Security: "danger",
};

const tabs = ["Job Postings", "Applicants"] as const;

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

export default function RecruitmentPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Job Postings");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");

  const filteredJobs = jobs.filter((j) => {
    const matchSearch =
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || j.status === statusFilter;
    const matchDept = deptFilter === "All" || j.dept === deptFilter;
    return matchSearch && matchStatus && matchDept;
  });

  const filteredApplicants = applicants.filter((a) => {
    const matchSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.job.toLowerCase().includes(search.toLowerCase()) ||
      a.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || a.status === statusFilter;
    const matchDept = deptFilter === "All" || a.dept === deptFilter;
    return matchSearch && matchStatus && matchDept;
  });

  const openJobs = jobs.filter((j) => j.status === "Open").length;
  const totalApps = applicants.length;
  const shortlisted = applicants.filter((a) => a.status === "Shortlisted").length;
  const hired = applicants.filter((a) => a.status === "Hired").length;

  const jobColumns: Column<Job>[] = [
    {
      key: "title",
      header: "Job Title",
      sortable: true,
      render: (j) => (
        <div className="flex items-center gap-3">
          <div className="gradient-indigo flex size-9 shrink-0 items-center justify-center rounded-md text-white">
            <Briefcase className="size-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{j.title}</p>
            <p className="truncate text-xs text-subtle">{j.id}</p>
          </div>
        </div>
      ),
    },
    {
      key: "dept",
      header: "Department",
      sortable: true,
      render: (j) => <Badge variant={DEPT_VARIANT[j.dept] ?? "default"}>{j.dept}</Badge>,
    },
    {
      key: "type",
      header: "Type",
      sortable: true,
      render: (j) => (
        <Badge variant={j.type === "Full-time" ? "success" : "warning"}>{j.type}</Badge>
      ),
    },
    {
      key: "posted",
      header: "Posted",
      render: (j) => (
        <span className="flex items-center gap-1.5 whitespace-nowrap text-muted">
          <Calendar className="size-3.5 text-subtle" />
          {j.posted}
        </span>
      ),
    },
    {
      key: "deadline",
      header: "Deadline",
      render: (j) => (
        <span className="flex items-center gap-1.5 whitespace-nowrap text-muted">
          <Clock className="size-3.5 text-subtle" />
          {j.deadline}
        </span>
      ),
    },
    {
      key: "applicants",
      header: "Applicants",
      sortable: true,
      align: "right",
      render: (j) => (
        <span className="inline-flex items-center gap-1.5 font-semibold text-primary">
          <Users className="size-3.5" />
          {j.applicants}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (j) => <Badge variant={JOB_STATUS[j.status] ?? "default"}>{j.status}</Badge>,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (j) => <RowActions label={j.title} />,
    },
  ];

  const applicantColumns: Column<Applicant>[] = [
    {
      key: "name",
      header: "Applicant",
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
      key: "job",
      header: "Applied For",
      sortable: true,
      render: (a) => <span className="whitespace-nowrap text-muted">{a.job}</span>,
    },
    {
      key: "dept",
      header: "Department",
      sortable: true,
      render: (a) => <Badge variant={DEPT_VARIANT[a.dept] ?? "default"}>{a.dept}</Badge>,
    },
    {
      key: "exp",
      header: "Experience",
      sortable: true,
      align: "right",
      render: (a) => <span className="whitespace-nowrap text-muted">{a.exp}</span>,
    },
    {
      key: "applied",
      header: "Applied On",
      render: (a) => <span className="whitespace-nowrap text-muted">{a.applied}</span>,
    },
    {
      key: "contact",
      header: "Contact",
      render: (a) => (
        <div className="flex flex-col gap-0.5 text-xs text-muted">
          <span>{a.phone}</span>
          <span>{a.email}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (a) => (
        <Badge variant={APPLICANT_STATUS[a.status]?.variant ?? "default"}>{a.status}</Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (a) => <RowActions label={a.name} />,
    },
  ];

  const isJobs = tab === "Job Postings";

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Recruitment"
        description="Manage job postings and track applicants"
        actions={
          <>
            <Button variant="outline">
              <Download className="size-4" />
              Export
            </Button>
            <Button>
              <Plus className="size-4" />
              Post Job
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Open Positions" value={openJobs} icon={Briefcase} tone="indigo" />
        <StatCard label="Total Applicants" value={totalApps} icon={Users} tone="cyan" />
        <StatCard label="Shortlisted" value={shortlisted} icon={Clock} tone="amber" />
        <StatCard label="Hired" value={hired} icon={CheckCircle} tone="emerald" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div
          role="tablist"
          aria-label="Recruitment views"
          className="inline-flex gap-1 rounded-md bg-surface-sunken p-1"
        >
          {tabs.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => {
                setTab(t);
                setSearch("");
                setStatusFilter("All");
                setDeptFilter("All");
              }}
              className={`focus-ring rounded-sm px-4 py-1.5 text-xs font-medium transition-colors ${
                tab === t
                  ? "bg-surface-raised text-text shadow-sm"
                  : "text-muted hover:text-text"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="min-w-60 flex-1">
          <Input
            type="search"
            placeholder={isJobs ? "Search jobs…" : "Search applicants…"}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label={isJobs ? "Search jobs" : "Search applicants"}
          />
        </div>

        <div className="w-48">
          <Select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            options={[
              { label: "All Departments", value: "All" },
              ...["Teaching", "IT", "Finance", "HR", "Security"].map((d) => ({
                label: d,
                value: d,
              })),
            ]}
            aria-label="Filter by department"
          />
        </div>

        <div className="w-44">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { label: "All Status", value: "All" },
              ...(isJobs
                ? ["Open", "Closed"]
                : ["Under Review", "Shortlisted", "Hired", "Rejected"]
              ).map((s) => ({ label: s, value: s })),
            ]}
            aria-label="Filter by status"
          />
        </div>

        <p className="ml-auto text-xs text-subtle">
          {isJobs ? `${filteredJobs.length} jobs` : `${filteredApplicants.length} applicants`}
        </p>
      </div>

      {isJobs ? (
        <Table
          columns={jobColumns}
          rows={filteredJobs}
          rowKey={(j) => j.id}
          emptyTitle="No jobs found"
          emptyDescription="Try adjusting your filters"
        />
      ) : (
        <Table
          columns={applicantColumns}
          rows={filteredApplicants}
          rowKey={(a) => a.id}
          emptyTitle="No applicants found"
          emptyDescription="Try adjusting your filters"
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
        <p>
          Showing{" "}
          <strong className="font-semibold text-text">
            {isJobs ? filteredJobs.length : filteredApplicants.length}
          </strong>{" "}
          of{" "}
          <strong className="font-semibold text-text">
            {isJobs ? jobs.length : applicants.length}
          </strong>{" "}
          {isJobs ? "jobs" : "applicants"}
        </p>
        {!isJobs && (
          <div className="flex flex-wrap items-center gap-4">
            {["Under Review", "Shortlisted", "Hired", "Rejected"].map((st) => {
              const count = filteredApplicants.filter((a) => a.status === st).length;
              return (
                <span key={st} className="flex items-center gap-1.5">
                  <span className={`size-2 rounded-full ${APPLICANT_STATUS[st].dot}`} />
                  {st}: <strong className="font-semibold text-text">{count}</strong>
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

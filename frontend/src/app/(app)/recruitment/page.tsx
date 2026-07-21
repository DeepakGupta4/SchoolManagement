"use client";

import { useMemo, useState } from "react";
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
  Card,
  CardContent,
  ConfirmDialog,
  Input,
  PageHeader,
  Select,
  StatCard,
  Table,
  useToast,
  type Column,
} from "@/components/ui";
import { exportToCsv } from "@/lib/exportCsv";
import { useResource } from "@/hooks/useResource";
import {
  jobPostingsApi,
  JOB_DEPT_OPTIONS,
  type JobPosting,
} from "@/lib/api/jobPostings";
import type { JobPostingSchema } from "@/lib/schemas/jobPosting";
import { JobPostingFormModal } from "./JobPostingFormModal";

const applicants = [
  { id: "AP001", name: "Arjun Mehta",  job: "Mathematics Teacher", dept: "Teaching", exp: "5 yrs", applied: "03 Jul 2025", status: "Shortlisted",  phone: "98765-11111", email: "arjun@email.com" },
  { id: "AP002", name: "Sneha Kapoor", job: "Mathematics Teacher", dept: "Teaching", exp: "3 yrs", applied: "04 Jul 2025", status: "Under Review", phone: "98765-22222", email: "sneha@email.com" },
  { id: "AP003", name: "Rahul Desai",  job: "Physics Teacher",     dept: "Teaching", exp: "7 yrs", applied: "06 Jul 2025", status: "Shortlisted",  phone: "98765-33333", email: "rahul@email.com" },
  { id: "AP004", name: "Pooja Nair",   job: "IT Administrator",    dept: "IT",       exp: "4 yrs", applied: "22 Jun 2025", status: "Hired",        phone: "98765-44444", email: "pooja@email.com" },
  { id: "AP005", name: "Vikram Joshi", job: "IT Administrator",    dept: "IT",       exp: "6 yrs", applied: "23 Jun 2025", status: "Rejected",     phone: "98765-55555", email: "vikram@email.com" },
  { id: "AP006", name: "Ananya Singh", job: "Accountant",          dept: "Finance",  exp: "2 yrs", applied: "11 Jul 2025", status: "Under Review", phone: "98765-66666", email: "ananya@email.com" },
  { id: "AP007", name: "Karan Sharma", job: "School Counselor",    dept: "HR",       exp: "3 yrs", applied: "13 Jul 2025", status: "Shortlisted",  phone: "98765-77777", email: "karan@email.com" },
  { id: "AP008", name: "Meera Iyer",   job: "Security Guard",      dept: "Security", exp: "8 yrs", applied: "16 Jun 2025", status: "Hired",        phone: "98765-88888", email: "meera@email.com" },
  { id: "AP009", name: "Rohit Verma",  job: "Physics Teacher",     dept: "Teaching", exp: "2 yrs", applied: "07 Jul 2025", status: "Under Review", phone: "98765-99999", email: "rohit@email.com" },
  { id: "AP010", name: "Divya Patel",  job: "Accountant",          dept: "Finance",  exp: "5 yrs", applied: "12 Jul 2025", status: "Shortlisted",  phone: "98765-10101", email: "divya@email.com" },
];

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

/** Read-only actions for the applicant pipeline, which has no backend yet. */
function ApplicantActions({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="sm" className="px-2" aria-label={`View ${label}`}>
        <Eye className="size-4" />
      </Button>
    </div>
  );
}

export default function RecruitmentPage() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Job Postings");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");

  const isJobs = tab === "Job Postings";

  // The applicants tab reuses the same controls, so the job list keeps its own
  // filters unfiltered while that tab is active.
  // `statusFilter` is deliberately left out of the server filters: the "Open
  // Positions" card needs the open count across the whole (otherwise filtered)
  // set, so status narrowing is applied during render instead.
  const filters = useMemo(
    () => ({
      search: isJobs ? search : "",
      dept: isJobs ? deptFilter : "All",
      status: "All",
    }),
    [isJobs, search, deptFilter]
  );

  const { items, loading, error, refetch, save, remove, saving, deleting } = useResource(
    jobPostingsApi,
    filters,
    { label: "job posting", describe: (j) => j.title }
  );

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<JobPosting | null>(null);
  const [pendingDelete, setPendingDelete] = useState<JobPosting | null>(null);
  const { toast } = useToast();

  const filteredApplicants = applicants.filter((a) => {
    const matchSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.job.toLowerCase().includes(search.toLowerCase()) ||
      a.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || a.status === statusFilter;
    const matchDept = deptFilter === "All" || a.dept === deptFilter;
    return matchSearch && matchStatus && matchDept;
  });

  /** Exports the postings or the applicant pipeline, matching the active tab. */
  const handleExport = () => {
    const count = isJobs ? items.length : filteredApplicants.length;
    if (count === 0) {
      toast({
        title: "Nothing to export",
        description: `No ${isJobs ? "job postings" : "applicants"} match the current filters.`,
        variant: "warning",
      });
      return;
    }
    if (isJobs) {
      exportToCsv<JobPosting>(
        "job-postings",
        [
          { header: "Code", value: (j) => j.code },
          { header: "Title", value: (j) => j.title },
          { header: "Department", value: (j) => j.dept },
          { header: "Type", value: (j) => j.type },
          { header: "Posted", value: (j) => j.posted },
          { header: "Deadline", value: (j) => j.deadline },
          { header: "Applicants", value: (j) => j.applicants },
          { header: "Status", value: (j) => j.status },
        ],
        items
      );
    } else {
      exportToCsv<Applicant>(
        "applicants",
        [
          { header: "Applicant ID", value: (a) => a.id },
          { header: "Name", value: (a) => a.name },
          { header: "Applied For", value: (a) => a.job },
          { header: "Department", value: (a) => a.dept },
          { header: "Experience", value: (a) => a.exp },
          { header: "Applied On", value: (a) => a.applied },
          { header: "Phone", value: (a) => a.phone },
          { header: "Email", value: (a) => a.email },
          { header: "Status", value: (a) => a.status },
        ],
        filteredApplicants
      );
    }
    toast({
      title: "Export ready",
      description: `${count} ${isJobs ? "job posting" : "applicant"}${count === 1 ? "" : "s"} exported to CSV.`,
    });
  };

  const openJobs = items.filter((j) => j.status === "Open").length;
  const totalApps = applicants.length;
  const shortlisted = applicants.filter((a) => a.status === "Shortlisted").length;
  const hired = applicants.filter((a) => a.status === "Hired").length;

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleSubmit = async (values: JobPostingSchema) => {
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

  const jobColumns: Column<JobPosting>[] = [
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
            <p className="truncate text-xs text-subtle">{j.code}</p>
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
      render: (j) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => {
              setEditing(j);
              setFormOpen(true);
            }}
            aria-label={`Edit ${j.title}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Pencil className="size-4" />
          </button>
          <button
            onClick={() => setPendingDelete(j)}
            aria-label={`Delete ${j.title}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-danger-soft hover:text-danger"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ),
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
      render: (a) => <ApplicantActions label={a.name} />,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Recruitment"
        description="Manage job postings and track applicants"
        actions={
          <>
            <Button variant="outline" onClick={handleExport}>
              <Download className="size-4" />
              Export
            </Button>
            <Button onClick={openCreate}>
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
              ...JOB_DEPT_OPTIONS.map((d) => ({ label: d, value: d })),
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
          {isJobs ? `${items.length} jobs` : `${filteredApplicants.length} applicants`}
        </p>
      </div>

      {isJobs ? (
        error ? (
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
            columns={jobColumns}
            rows={items}
            rowKey={(j) => j.id}
            loading={loading}
            emptyTitle="No jobs found"
            emptyDescription="Try adjusting your filters"
            emptyAction={
              <Button variant="outline" onClick={openCreate}>
                <Plus className="size-4" />
                Post Job
              </Button>
            }
          />
        )
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
            {isJobs ? items.length : filteredApplicants.length}
          </strong>{" "}
          {isJobs ? "jobs" : `of ${applicants.length} applicants`}
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

      <JobPostingFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        record={editing}
        saving={saving}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete job posting?"
        description={
          pendingDelete
            ? `${pendingDelete.title} (${pendingDelete.code}) and its ${pendingDelete.applicants} applicant record(s) will be permanently removed. This cannot be undone.`
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

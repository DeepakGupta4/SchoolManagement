"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Eye,
  FileText,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  UserCheck,
  CalendarOff,
  BriefcaseBusiness,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  ConfirmDialog,
  Input,
  Pagination,
  Select,
  Table,
  useToast,
  type Column,
} from "@/components/ui";
import { useTeachers } from "@/hooks/useTeachers";
import { useSubjectOptions } from "@/hooks/useSubjectOptions";
import {
  createTeacher,
  deleteTeacher,
  updateTeacher,
  countTeachers,
} from "@/lib/api/teachers";
import {
  teacherName,
  type Teacher,
  type TeacherFormValues,
  type TeacherStatus,
} from "@/types/teacher";
import { exportTablePdf } from "@/lib/exportPdf";
import { TeacherFormModal } from "./TeacherFormModal";

const PAGE_SIZE = 8;

const STATUS_VARIANT: Record<TeacherStatus, "success" | "warning" | "default" | "danger"> = {
  active: "success",
  "on-leave": "warning",
  inactive: "default",
  resigned: "danger",
};

function StatCard({
  label,
  value,
  icon: Icon,
  gradient,
  onClick,
  active,
}: {
  label: string;
  value: string;
  icon: typeof Users;
  gradient: string;
  onClick?: () => void;
  active?: boolean;
}) {
  const card = (
    <Card
      className={`${active ? "ring-2 ring-primary " : ""}${onClick ? "cursor-pointer transition-shadow hover:shadow-md" : ""}`}
    >
      <CardContent className="flex items-center gap-3.5">
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-md text-white ${gradient}`}>
          <Icon className="size-4.5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted">{label}</p>
          <p className="mt-0.5 truncate text-xl font-semibold text-text">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
  return onClick ? (
    <button type="button" onClick={onClick} aria-pressed={active} className="focus-ring block w-full rounded-2xl text-left">
      {card}
    </button>
  ) : (
    card
  );
}

function TeachersPageInner() {
  const { toast } = useToast();
  const { subjectNames } = useSubjectOptions();

  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [status, setStatus] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [page, setPage] = useState(1);

  // Deep-link from the dashboard "Teachers on leave" tile — read reactively so a
  // cached-page navigation still applies it (App Router won't remount the page).
  const searchParams = useSearchParams();
  useEffect(() => {
    const s = searchParams.get("status");
    if (!s) return;
    const t = setTimeout(() => setStatus(s), 0);
    return () => clearTimeout(t);
  }, [searchParams]);

  // The table shows the COMPLETE server-filtered set (all pages), so nothing is
  // capped at 200 and every filter is applied server-side.
  const { teachers, loading, error, refetch } = useTeachers({ search, subject, status, employmentType });
  const filtered = teachers;

  // A narrowed filter can strand you past the last page, so every filter change
  // resets to page 1.
  const applyFilter = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  const clearAll = () => {
    setSearch("");
    setSubject("");
    setStatus("");
    setEmploymentType("");
    setPage(1);
  };
  const isFiltered = Boolean(search || subject || status || employmentType);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [deleting, setDeleting] = useState<Teacher | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Headline tiles come from whole-school server counts, independent of the table
  // filters, so a status/subject filter never turns them into a subtotal. Each
  // field is "—" when its count couldn't be fetched (never a confident 0).
  const [agg, setAgg] = useState<{
    total: number | null;
    active: number | null;
    onLeave: number | null;
    fullTime: number | null;
  } | null>(null);
  const [statsVersion, setStatsVersion] = useState(0);
  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      countTeachers({}),
      countTeachers({ status: "active" }),
      countTeachers({ status: "on-leave" }),
      countTeachers({ employmentType: "full-time" }),
    ]).then(([t, a, l, f]) => {
      if (cancelled) return;
      setAgg({
        total: t.status === "fulfilled" ? t.value : null,
        active: a.status === "fulfilled" ? a.value : null,
        onLeave: l.status === "fulfilled" ? l.value : null,
        fullTime: f.status === "fulfilled" ? f.value : null,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [statsVersion]);
  const statValue = (n: number | null | undefined) => (n != null ? String(n) : "—");

  // Clamp during render — deleting the last row on the last page would otherwise
  // strand the user on an empty page.
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const pagedTeachers = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage]
  );

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  /** Exports exactly the rows the filters are showing — the complete set, not one page. */
  const handleExportPdf = () => {
    if (filtered.length === 0) {
      toast({
        title: "Nothing to export",
        description: "No teachers match the current filters.",
        variant: "warning",
      });
      return;
    }
    setExporting(true);
    try {
      const parts = [subject, status, employmentType, search ? `“${search}”` : ""].filter(Boolean);
      const ok = exportTablePdf({
        title: "Teachers",
        subtitle: parts.length ? `Filtered by ${parts.join(" · ")}` : "All teachers",
        columns: ["Emp ID", "Name", "Department", "Subjects", "Classes", "Status", "Phone", "Email"],
        rows: filtered.map((t) => [
          t.employeeId,
          teacherName(t),
          t.department,
          t.subjects.join(", "),
          t.classes.join(", "),
          t.status,
          t.phone,
          t.email,
        ]),
      });
      if (!ok) {
        toast({
          title: "Pop-up blocked",
          description: "Allow pop-ups for this site to export a PDF.",
          variant: "error",
        });
      }
    } finally {
      setExporting(false);
    }
  };

  const openEdit = (teacher: Teacher) => {
    setEditing(teacher);
    setFormOpen(true);
  };

  const handleSubmit = async (values: TeacherFormValues): Promise<Teacher | null> => {
    try {
      const saved = editing
        ? await updateTeacher(editing.id, values)
        : await createTeacher(values);
      toast({
        title: editing ? "Teacher updated" : "Teacher added",
        description: editing
          ? `${values.firstName} ${values.lastName}'s record was saved.`
          : `${values.firstName} ${values.lastName} joined the staff.`,
      });
      refetch();
      setStatsVersion((v) => v + 1);
      return saved;
    } catch (e) {
      toast({
        title: "Could not save teacher",
        description: e instanceof Error ? e.message : "Something went wrong.",
        variant: "error",
      });
      return null;
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setIsDeleting(true);
    try {
      await deleteTeacher(deleting.id);
      toast({ title: "Teacher removed", description: `${teacherName(deleting)} was deleted.` });
      setDeleting(null);
      refetch();
      setStatsVersion((v) => v + 1);
    } catch (e) {
      toast({
        title: "Could not delete teacher",
        description: e instanceof Error ? e.message : "Something went wrong.",
        variant: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<Teacher>[] = [
    {
      key: "name",
      header: "Teacher",
      sortable: true,
      sortValue: (t) => teacherName(t),
      render: (t) => (
        <div className="flex items-center gap-3">
          <Avatar name={teacherName(t)} src={t.avatar} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{teacherName(t)}</p>
            <p className="truncate text-xs text-subtle">{t.employeeId}</p>
          </div>
        </div>
      ),
    },
    {
      key: "subjects",
      header: "Subjects",
      render: (t) => (
        <div className="flex flex-wrap gap-1">
          {t.subjects.map((s) => (
            <Badge key={s} variant="info">
              {s}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: "classes",
      header: "Classes",
      render: (t) =>
        t.classes.length ? (
          <span className="whitespace-nowrap text-muted">{t.classes.join(", ")}</span>
        ) : (
          <span className="text-subtle">Unassigned</span>
        ),
    },
    {
      key: "experienceYears",
      header: "Exp.",
      sortable: true,
      align: "right",
      render: (t) => <span className="whitespace-nowrap text-muted">{t.experienceYears} yrs</span>,
    },
    {
      key: "employmentType",
      header: "Type",
      sortable: true,
      render: (t) => (
        <Badge variant={t.employmentType === "full-time" ? "success" : "warning"} className="capitalize">
          {t.employmentType.replace("-", " ")}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (t) => (
        <Badge variant={STATUS_VARIANT[t.status]} className="capitalize">
          {t.status.replace("-", " ")}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (t) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/teachers/${t.id}`}
            aria-label={`View ${teacherName(t)}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Eye className="size-4" />
          </Link>
          <button
            onClick={() => openEdit(t)}
            aria-label={`Edit ${teacherName(t)}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Pencil className="size-4" />
          </button>
          <button
            onClick={() => setDeleting(t)}
            aria-label={`Delete ${teacherName(t)}`}
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text">Teachers</h1>
          <p className="mt-0.5 text-sm text-muted">
            Manage teaching staff, subjects and class assignments.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={handleExportPdf} disabled={exporting}>
            <FileText className="size-4" />
            {exporting ? "Exporting…" : "Export PDF"}
          </Button>
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Add teacher
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total teachers"
          value={statValue(agg?.total)}
          icon={Users}
          gradient="gradient-indigo"
          active={!search && !subject && !status && !employmentType}
          onClick={clearAll}
        />
        <StatCard
          label="Active"
          value={statValue(agg?.active)}
          icon={UserCheck}
          gradient="gradient-emerald"
          active={status === "active"}
          onClick={() => {
            setStatus(status === "active" ? "" : "active");
            setPage(1);
          }}
        />
        <StatCard
          label="Full-time"
          value={statValue(agg?.fullTime)}
          icon={BriefcaseBusiness}
          gradient="gradient-cyan"
          active={employmentType === "full-time"}
          onClick={() => {
            setEmploymentType(employmentType === "full-time" ? "" : "full-time");
            setPage(1);
          }}
        />
        <StatCard
          label="On leave"
          value={statValue(agg?.onLeave)}
          icon={CalendarOff}
          gradient="gradient-amber"
          active={status === "on-leave"}
          onClick={() => {
            setStatus(status === "on-leave" ? "" : "on-leave");
            setPage(1);
          }}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-60 flex-1">
          <Input
            type="search"
            placeholder="Search by name, employee ID or subject…"
            value={search}
            onChange={(e) => applyFilter(setSearch)(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search teachers"
          />
        </div>
        <div className="w-48">
          <Select
            value={subject}
            onChange={(e) => applyFilter(setSubject)(e.target.value)}
            placeholder="All subjects"
            options={subjectNames.map((s) => ({ label: s, value: s }))}
            aria-label="Filter by subject"
          />
        </div>
        <div className="w-40">
          <Select
            value={status}
            onChange={(e) => applyFilter(setStatus)(e.target.value)}
            placeholder="All statuses"
            options={[
              { label: "Active", value: "active" },
              { label: "On leave", value: "on-leave" },
              { label: "Inactive", value: "inactive" },
              { label: "Resigned", value: "resigned" },
            ]}
            aria-label="Filter by status"
          />
        </div>
      </div>

      {error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="text-sm font-medium text-danger-text">{error}</p>
            <Button variant="outline" onClick={refetch}>
              Try again
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Table
            columns={columns}
            rows={pagedTeachers}
            rowKey={(t) => t.id}
            loading={loading}
            emptyTitle="No teachers found"
            emptyDescription={
              isFiltered
                ? "No teachers match the current filters."
                : "Add your first teacher to get started."
            }
            emptyAction={
              isFiltered ? (
                <Button variant="outline" onClick={clearAll}>
                  Show all teachers
                </Button>
              ) : (
                <Button variant="outline" onClick={openCreate}>
                  <Plus className="size-4" />
                  Add teacher
                </Button>
              )
            }
          />
          {!loading && (
            <Pagination
              page={safePage}
              pageSize={PAGE_SIZE}
              totalItems={filtered.length}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      <TeacherFormModal
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        teacher={editing}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete teacher?"
        description={
          deleting
            ? `${teacherName(deleting)} (${deleting.employeeId}) will be permanently removed, along with their uploaded documents. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        destructive
        loading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}

// useSearchParams must sit under a Suspense boundary for the static build.
export default function TeachersPage() {
  return (
    <Suspense fallback={null}>
      <TeachersPageInner />
    </Suspense>
  );
}

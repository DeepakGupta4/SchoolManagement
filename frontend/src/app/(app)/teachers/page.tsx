"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Eye,
  Pencil,
  Plus,
  Search,
  Star,
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
import {
  createTeacher,
  deleteTeacher,
  updateTeacher,
  SUBJECT_OPTIONS,
} from "@/lib/api/teachers";
import {
  teacherName,
  type Teacher,
  type TeacherFormValues,
  type TeacherStatus,
} from "@/types/teacher";
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
}: {
  label: string;
  value: string;
  icon: typeof Users;
  gradient: string;
}) {
  return (
    <Card>
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
}

export default function TeachersPage() {
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const { teachers, loading, error, refetch } = useTeachers({ search, subject, status });

  // A narrowed filter can strand you past the last page, so every filter
  // change resets to page 1.
  const applyFilter = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [deleting, setDeleting] = useState<Teacher | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const stats = useMemo(() => {
    const active = teachers.filter((t) => t.status === "active").length;
    const onLeave = teachers.filter((t) => t.status === "on-leave").length;
    const fullTime = teachers.filter((t) => t.employmentType === "full-time").length;
    return { total: teachers.length, active, onLeave, fullTime };
  }, [teachers]);

  const pagedTeachers = useMemo(
    () => teachers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [teachers, page]
  );

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (teacher: Teacher) => {
    setEditing(teacher);
    setFormOpen(true);
  };

  const handleSubmit = async (values: TeacherFormValues) => {
    try {
      if (editing) {
        await updateTeacher(editing.id, values);
        toast({
          title: "Teacher updated",
          description: `${values.firstName} ${values.lastName}'s record was saved.`,
        });
      } else {
        await createTeacher(values);
        toast({
          title: "Teacher added",
          description: `${values.firstName} ${values.lastName} joined the staff.`,
        });
      }
      setFormOpen(false);
      setEditing(null);
      refetch();
    } catch (e) {
      toast({
        title: "Could not save teacher",
        description: e instanceof Error ? e.message : "Something went wrong.",
        variant: "error",
      });
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
      key: "rating",
      header: "Rating",
      sortable: true,
      align: "right",
      render: (t) =>
        t.rating > 0 ? (
          <span className="inline-flex items-center gap-1 font-medium text-text">
            <Star className="size-3.5 fill-warning text-warning" />
            {t.rating.toFixed(1)}
          </span>
        ) : (
          <span className="text-subtle">—</span>
        ),
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
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Add teacher
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total teachers" value={String(stats.total)} icon={Users} gradient="gradient-indigo" />
        <StatCard label="Active" value={String(stats.active)} icon={UserCheck} gradient="gradient-emerald" />
        <StatCard label="Full-time" value={String(stats.fullTime)} icon={BriefcaseBusiness} gradient="gradient-cyan" />
        <StatCard label="On leave" value={String(stats.onLeave)} icon={CalendarOff} gradient="gradient-amber" />
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
            options={SUBJECT_OPTIONS.map((s) => ({ label: s, value: s }))}
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
            rows={pagedTeachers}
            rowKey={(t) => t.id}
            loading={loading}
            emptyTitle="No teachers found"
            emptyDescription={
              search || subject || status
                ? "Try clearing your filters to see more results."
                : "Add your first teacher to get started."
            }
            emptyAction={
              <Button variant="outline" onClick={openCreate}>
                <Plus className="size-4" />
                Add teacher
              </Button>
            }
          />
          {!loading && (
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              totalItems={teachers.length}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      <TeacherFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        teacher={editing}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete teacher?"
        description={
          deleting
            ? `${teacherName(deleting)} (${deleting.employeeId}) will be permanently removed. This cannot be undone.`
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

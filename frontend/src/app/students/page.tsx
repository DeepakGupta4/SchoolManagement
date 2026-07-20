"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Pencil, Plus, Search, Trash2, Users, UserCheck, IndianRupee, TrendingDown } from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  ConfirmDialog,
  Input,
  Select,
  Table,
  useToast,
  type Column,
} from "@/components/ui";
import { useStudents } from "@/hooks/useStudents";
import { createStudent, deleteStudent, updateStudent, CLASS_OPTIONS } from "@/lib/api/students";
import { fullName, type Student, type StudentFormValues, type StudentStatus } from "@/types/student";
import { StudentFormModal } from "./StudentFormModal";

const STATUS_VARIANT: Record<StudentStatus, "success" | "default" | "info" | "warning"> = {
  active: "success",
  inactive: "default",
  alumni: "info",
  transferred: "warning",
};

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

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

export default function StudentsPage() {
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [className, setClassName] = useState("");
  const [status, setStatus] = useState("");

  const { students, loading, error, refetch } = useStudents({ search, className, status });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const stats = useMemo(() => {
    const active = students.filter((s) => s.status === "active").length;
    const due = students.reduce((sum, s) => sum + s.feeDue, 0);
    const lowAttendance = students.filter((s) => s.attendancePercent < 75).length;
    return { total: students.length, active, due, lowAttendance };
  }, [students]);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (student: Student) => {
    setEditing(student);
    setFormOpen(true);
  };

  const handleSubmit = async (values: StudentFormValues) => {
    try {
      if (editing) {
        await updateStudent(editing.id, values);
        toast({
          title: "Student updated",
          description: `${values.firstName} ${values.lastName}'s record was saved.`,
        });
      } else {
        await createStudent(values);
        toast({
          title: "Student added",
          description: `${values.firstName} ${values.lastName} was enrolled.`,
        });
      }
      setFormOpen(false);
      setEditing(null);
      refetch();
    } catch (e) {
      toast({
        title: "Could not save student",
        description: e instanceof Error ? e.message : "Something went wrong.",
        variant: "error",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setIsDeleting(true);
    try {
      await deleteStudent(deleting.id);
      toast({ title: "Student removed", description: `${fullName(deleting)} was deleted.` });
      setDeleting(null);
      refetch();
    } catch (e) {
      toast({
        title: "Could not delete student",
        description: e instanceof Error ? e.message : "Something went wrong.",
        variant: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<Student>[] = [
    {
      key: "name",
      header: "Student",
      sortable: true,
      sortValue: (s) => fullName(s),
      render: (s) => (
        <div className="flex items-center gap-3">
          <Avatar name={fullName(s)} src={s.avatar} size="sm" />
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{fullName(s)}</p>
            <p className="truncate text-xs text-subtle">{s.admissionNo}</p>
          </div>
        </div>
      ),
    },
    {
      key: "className",
      header: "Class",
      sortable: true,
      render: (s) => (
        <span className="whitespace-nowrap text-muted">
          {s.className} · {s.section}
        </span>
      ),
    },
    {
      key: "rollNo",
      header: "Roll",
      sortable: true,
      sortValue: (s) => Number(s.rollNo),
      align: "right",
    },
    {
      key: "attendancePercent",
      header: "Attendance",
      sortable: true,
      align: "right",
      render: (s) => (
        <span className={s.attendancePercent < 75 ? "font-medium text-danger" : "text-muted"}>
          {s.attendancePercent}%
        </span>
      ),
    },
    {
      key: "feeDue",
      header: "Fee due",
      sortable: true,
      align: "right",
      render: (s) =>
        s.feeDue > 0 ? (
          <span className="font-medium text-warning-text">{inr.format(s.feeDue)}</span>
        ) : (
          <span className="text-subtle">—</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (s) => (
        <Badge variant={STATUS_VARIANT[s.status]} className="capitalize">
          {s.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (s) => (
        // Row click navigates to the detail page; stop actions bubbling into it.
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          <Link
            href={`/students/${s.id}`}
            aria-label={`View ${fullName(s)}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Eye className="size-4" />
          </Link>
          <button
            onClick={() => openEdit(s)}
            aria-label={`Edit ${fullName(s)}`}
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Pencil className="size-4" />
          </button>
          <button
            onClick={() => setDeleting(s)}
            aria-label={`Delete ${fullName(s)}`}
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
          <h1 className="text-xl font-semibold text-text">Students</h1>
          <p className="mt-0.5 text-sm text-muted">
            Manage enrolment, records and academic profiles.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Add student
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total students" value={String(stats.total)} icon={Users} gradient="gradient-indigo" />
        <StatCard label="Active" value={String(stats.active)} icon={UserCheck} gradient="gradient-emerald" />
        <StatCard label="Fees pending" value={inr.format(stats.due)} icon={IndianRupee} gradient="gradient-amber" />
        <StatCard label="Attendance < 75%" value={String(stats.lowAttendance)} icon={TrendingDown} gradient="gradient-rose" />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-60 flex-1">
          <Input
            type="search"
            placeholder="Search by name, admission no. or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="size-4" />}
            aria-label="Search students"
          />
        </div>
        <div className="w-40">
          <Select
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="All classes"
            options={CLASS_OPTIONS.map((c) => ({ label: c, value: c }))}
            aria-label="Filter by class"
          />
        </div>
        <div className="w-40">
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            placeholder="All statuses"
            options={[
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
              { label: "Alumni", value: "alumni" },
              { label: "Transferred", value: "transferred" },
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
        <Table
          columns={columns}
          rows={students}
          rowKey={(s) => s.id}
          loading={loading}
          emptyTitle="No students found"
          emptyDescription={
            search || className || status
              ? "Try clearing your filters to see more results."
              : "Add your first student to get started."
          }
          emptyAction={
            <Button variant="outline" onClick={openCreate}>
              <Plus className="size-4" />
              Add student
            </Button>
          }
        />
      )}

      <StudentFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        student={editing}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete student?"
        description={
          deleting
            ? `${fullName(deleting)} (${deleting.admissionNo}) will be permanently removed. This cannot be undone.`
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

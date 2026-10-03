"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Cake, Download, Eye, FileText, Pencil, Plus, Search, Trash2, Users, UsersRound, UserCheck, IndianRupee, TrendingDown } from "lucide-react";
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
import { useClassOptions } from "@/hooks/useClassOptions";
import { createStudent, deleteStudent, updateStudent } from "@/lib/api/students";
import { getMySchool, type SchoolProfile } from "@/lib/api/schools";
import { printAdmissionForm } from "@/lib/admissionForm";
import { fullName, type Student, type StudentFormValues, type StudentStatus } from "@/types/student";
import { exportTablePdf } from "@/lib/exportPdf";
import { StudentFormModal } from "./StudentFormModal";
import { BulkAddStudentsModal } from "./BulkAddStudentsModal";

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

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

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

function StudentsPageInner() {
  const { toast } = useToast();
  const { classOptions, defaultClass } = useClassOptions();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState("");
  const [className, setClassName] = useState("");
  const [status, setStatus] = useState("");
  // Quick client-side filter driven by the stat cards (fees due / low attendance).
  const [quick, setQuick] = useState<"all" | "fees" | "low">("all");
  // Birthday-month filter ("10" = October), set when arriving from the dashboard.
  const [birthdayMonth, setBirthdayMonth] = useState("");

  const defaultedClass = useRef(false);

  // Apply dashboard deep-links (?birthdayMonth=10 / ?attendance=below75)
  // REACTIVELY. App Router reuses this page's component when only the query
  // changes (no remount), so a mount-only effect would never fire on a click
  // from the dashboard — this must depend on searchParams. A drill shows the
  // whole school (clears the lowest-class auto-select).
  useEffect(() => {
    const low = searchParams.get("attendance") === "below75";
    const bm = searchParams.get("birthdayMonth") ?? "";
    if (!low && !bm) return;
    defaultedClass.current = true;
    const t = setTimeout(() => {
      setClassName("");
      setQuick(low ? "low" : "all");
      setBirthdayMonth(bm);
    }, 0);
    return () => clearTimeout(t);
  }, [searchParams]);

  // Pre-select the lowest class (e.g. Nursery) once the class list resolves — but
  // never fight a user who later clears it, and skip it entirely for a drill.
  useEffect(() => {
    if (defaultedClass.current || className || !defaultClass) return;
    defaultedClass.current = true;
    const t = setTimeout(() => setClassName(defaultClass), 0);
    return () => clearTimeout(t);
  }, [className, defaultClass]);

  const { students, loading, error, refetch } = useStudents({ search, className, status });

  // Rows shown in the table, after the stat-card quick filter.
  const displayed = useMemo(() => {
    let rows = students;
    if (quick === "fees") rows = rows.filter((s) => s.feeDue > 0);
    else if (quick === "low") rows = rows.filter((s) => s.attendancePercent < 75);
    if (birthdayMonth) {
      rows = rows.filter((s) => (s.dateOfBirth || "").slice(5, 7) === birthdayMonth);
    }
    return rows;
  }, [students, quick, birthdayMonth]);

  const [formOpen, setFormOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState<Student | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [school, setSchool] = useState<SchoolProfile | null>(null);

  // School profile for the printable admission form (header + signature).
  useEffect(() => {
    let cancelled = false;
    getMySchool().then((s) => !cancelled && setSchool(s)).catch(() => {});
    return () => { cancelled = true; };
  }, []);

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

  /** Exports exactly the rows the table is showing, filters included. */
  const handleExportPdf = () => {
    if (displayed.length === 0) {
      toast({
        title: "Nothing to export",
        description: "No students match the current filters.",
        variant: "warning",
      });
      return;
    }
    const parts = [
      className,
      status,
      quick === "fees" ? "Fees pending" : quick === "low" ? "Attendance < 75%" : "",
      search ? `“${search}”` : "",
    ].filter(Boolean);
    const ok = exportTablePdf({
      title: "Students",
      subtitle: parts.length ? `Filtered by ${parts.join(" · ")}` : "All students",
      columns: ["Adm No", "Name", "Class", "Section", "Roll", "Status", "Guardian", "Phone"],
      rows: displayed.map((s) => [
        s.admissionNo,
        fullName(s),
        s.className,
        s.section,
        s.rollNo,
        s.status,
        s.guardian.name,
        s.guardian.phone,
      ]),
    });
    if (!ok) {
      toast({
        title: "Pop-up blocked",
        description: "Allow pop-ups for this site to export a PDF.",
        variant: "error",
      });
    }
  };

  const openEdit = (student: Student) => {
    setEditing(student);
    setFormOpen(true);
  };

  const handleSubmit = async (values: StudentFormValues): Promise<Student | null> => {
    try {
      const saved = editing
        ? await updateStudent(editing.id, values)
        : await createStudent(values);
      toast({
        title: editing ? "Student updated" : "Student added",
        description: `${values.firstName} ${values.lastName}${editing ? "'s record was saved." : " was enrolled."}`,
      });
      refetch();
      return saved;
    } catch (e) {
      toast({
        title: "Could not save student",
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
            onClick={() => printAdmissionForm(s, school)}
            aria-label={`Download admission form for ${fullName(s)}`}
            title="Download admission form"
            className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
          >
            <Download className="size-4" />
          </button>
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
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={handleExportPdf}>
            <FileText className="size-4" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={() => setBulkOpen(true)}>
            <UsersRound className="size-4" />
            Bulk add
          </Button>
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Add student
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total students"
          value={String(stats.total)}
          icon={Users}
          gradient="gradient-indigo"
          active={!search && !className && !status && quick === "all"}
          onClick={() => {
            setSearch("");
            setClassName("");
            setStatus("");
            setQuick("all");
          }}
        />
        <StatCard
          label="Active"
          value={String(stats.active)}
          icon={UserCheck}
          gradient="gradient-emerald"
          active={status === "active"}
          onClick={() => {
            setStatus(status === "active" ? "" : "active");
            setQuick("all");
          }}
        />
        <StatCard
          label="Fees pending"
          value={inr.format(stats.due)}
          icon={IndianRupee}
          gradient="gradient-amber"
          active={quick === "fees"}
          onClick={() => setQuick(quick === "fees" ? "all" : "fees")}
        />
        <StatCard
          label="Attendance < 75%"
          value={String(stats.lowAttendance)}
          icon={TrendingDown}
          gradient="gradient-rose"
          active={quick === "low"}
          onClick={() => setQuick(quick === "low" ? "all" : "low")}
        />
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
            options={classOptions}
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

      {birthdayMonth && (
        <div className="flex items-center gap-2 rounded-lg border border-violet/25 bg-violet/10 px-3.5 py-2 text-sm">
          <Cake className="size-4 text-violet" />
          <span className="font-medium text-text">
            Showing birthdays in {MONTH_NAMES[Number(birthdayMonth) - 1] ?? "this month"}
          </span>
          <button
            onClick={() => setBirthdayMonth("")}
            className="focus-ring ml-auto rounded-md px-2 py-0.5 text-xs font-semibold text-violet transition-colors hover:bg-violet/10"
          >
            Clear
          </button>
        </div>
      )}

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
          rows={displayed}
          rowKey={(s) => s.id}
          loading={loading}
          emptyTitle="No students found"
          emptyDescription={
            search || className || status || quick !== "all"
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
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        student={editing}
        onSubmit={handleSubmit}
      />

      <BulkAddStudentsModal open={bulkOpen} onOpenChange={setBulkOpen} onSaved={refetch} />

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

// useSearchParams must sit under a Suspense boundary for the static build.
export default function StudentsPage() {
  return (
    <Suspense fallback={null}>
      <StudentsPageInner />
    </Suspense>
  );
}

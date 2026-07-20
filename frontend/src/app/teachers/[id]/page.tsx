"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Award,
  BriefcaseBusiness,
  CalendarDays,
  GraduationCap,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Star,
  Trash2,
  UserRound,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  ConfirmDialog,
  EmptyState,
  Skeleton,
  useToast,
} from "@/components/ui";
import { getTeacher, deleteTeacher, updateTeacher } from "@/lib/api/teachers";
import {
  teacherName,
  type Teacher,
  type TeacherFormValues,
  type TeacherStatus,
} from "@/types/teacher";
import { TeacherFormModal } from "../TeacherFormModal";

const STATUS_VARIANT: Record<TeacherStatus, "success" | "warning" | "default" | "danger"> = {
  active: "success",
  "on-leave": "warning",
  inactive: "default",
  resigned: "danger",
};

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-subtle" />
      <div className="min-w-0">
        <p className="text-xs text-subtle">{label}</p>
        <p className="mt-0.5 break-words text-sm text-text">{value || "—"}</p>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  percent,
  tone,
}: {
  label: string;
  value: string;
  percent?: number;
  tone: "primary" | "success" | "warning";
}) {
  const barColor = { primary: "bg-primary", success: "bg-success", warning: "bg-warning" }[tone];

  return (
    <Card>
      <CardContent>
        <p className="text-xs text-muted">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-text">{value}</p>
        {percent !== undefined && (
          <div
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-hover"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={label}
          >
            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${percent}%` }} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="h-9 w-32" />
      <Card>
        <CardContent className="flex items-center gap-5">
          <Skeleton className="size-24 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-40" />
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    </div>
  );
}

export default function TeacherDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Next 16 passes `params` as a Promise; `use` unwraps it in a Client Component.
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // `cancelled` keeps a response for a previous id from overwriting the
    // current one if the route changes mid-flight.
    let cancelled = false;

    (async () => {
      try {
        const data = await getTeacher(id);
        if (!cancelled) setTeacher(data);
      } catch {
        if (!cancelled) setTeacher(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleUpdate = async (values: TeacherFormValues) => {
    try {
      const updated = await updateTeacher(id, values);
      setTeacher(updated);
      setEditOpen(false);
      toast({ title: "Teacher updated", description: `${teacherName(updated)}'s record was saved.` });
    } catch (e) {
      toast({
        title: "Could not save teacher",
        description: e instanceof Error ? e.message : "Something went wrong.",
        variant: "error",
      });
    }
  };

  const handleDelete = async () => {
    if (!teacher) return;
    setIsDeleting(true);
    try {
      await deleteTeacher(teacher.id);
      toast({ title: "Teacher removed", description: `${teacherName(teacher)} was deleted.` });
      router.push("/teachers");
    } catch (e) {
      toast({
        title: "Could not delete teacher",
        description: e instanceof Error ? e.message : "Something went wrong.",
        variant: "error",
      });
      setIsDeleting(false);
    }
  };

  if (loading) return <DetailSkeleton />;

  if (!teacher) {
    return (
      <Card>
        <EmptyState
          icon={<UserRound className="size-5" />}
          title="Teacher not found"
          description={`No teacher exists with the id "${id}". They may have been deleted.`}
          action={
            <Link href="/teachers">
              <Button variant="outline">Back to teachers</Button>
            </Link>
          }
        />
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/teachers"
          className="focus-ring inline-flex items-center gap-2 rounded-md text-sm text-muted transition-colors hover:text-text"
        >
          <ArrowLeft className="size-4" />
          Back to teachers
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            Edit
          </Button>
          <Button variant="danger" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="size-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Identity header */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-5">
          <Avatar name={teacherName(teacher)} src={teacher.avatar} size="xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-semibold text-text">{teacherName(teacher)}</h1>
              <Badge variant={STATUS_VARIANT[teacher.status]} className="capitalize">
                {teacher.status.replace("-", " ")}
              </Badge>
              {teacher.isClassTeacher && <Badge variant="info">Class teacher</Badge>}
            </div>
            <p className="mt-1 text-sm text-muted">
              {teacher.department} · {teacher.qualification}
            </p>
            <p className="mt-0.5 text-xs text-subtle">
              {teacher.employeeId} · Joined {formatDate(teacher.joiningDate)}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {teacher.subjects.map((s) => (
                <Badge key={s} variant="info">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Attendance"
          value={`${teacher.attendancePercent}%`}
          percent={teacher.attendancePercent}
          tone={teacher.attendancePercent < 85 ? "warning" : "success"}
        />
        <MetricCard
          label="Rating"
          value={teacher.rating > 0 ? `${teacher.rating.toFixed(1)} / 5` : "Not rated"}
          percent={teacher.rating > 0 ? (teacher.rating / 5) * 100 : undefined}
          tone="primary"
        />
        <MetricCard label="Weekly periods" value={String(teacher.weeklyPeriods)} tone="primary" />
        <MetricCard label="Monthly salary" value={inr.format(teacher.salary)} tone="success" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-text">Personal &amp; contact</h2>
          </CardHeader>
          <CardContent className="divide-y divide-border py-1">
            <DetailRow icon={Mail} label="Email" value={teacher.email} />
            <DetailRow icon={Phone} label="Phone" value={teacher.phone} />
            <DetailRow icon={CalendarDays} label="Date of birth" value={formatDate(teacher.dateOfBirth)} />
            <DetailRow icon={UserRound} label="Gender" value={teacher.gender} />
            <DetailRow icon={MapPin} label="Address" value={teacher.address} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-text">Employment</h2>
          </CardHeader>
          <CardContent className="divide-y divide-border py-1">
            <DetailRow
              icon={BriefcaseBusiness}
              label="Employment type"
              value={teacher.employmentType.replace("-", " ")}
            />
            <DetailRow icon={GraduationCap} label="Qualification" value={teacher.qualification} />
            <DetailRow icon={Award} label="Experience" value={`${teacher.experienceYears} years`} />
            <DetailRow
              icon={Star}
              label="Assigned classes"
              value={teacher.classes.length ? teacher.classes.join(", ") : "Unassigned"}
            />
            <DetailRow icon={CalendarDays} label="Joining date" value={formatDate(teacher.joiningDate)} />
          </CardContent>
        </Card>
      </div>

      <TeacherFormModal
        open={editOpen}
        onOpenChange={setEditOpen}
        teacher={teacher}
        onSubmit={handleUpdate}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete teacher?"
        description={`${teacherName(teacher)} (${teacher.employeeId}) will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        loading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}

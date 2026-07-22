"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Droplet,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Sparkles,
  Stethoscope,
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
import { getStudent, deleteStudent, updateStudent } from "@/lib/api/students";
import { fullName, type Student, type StudentFormValues, type StudentStatus } from "@/types/student";
import { assessStudent, RISK_META } from "@/lib/insights";
import { cn } from "@/lib/utils";
import { StudentFormModal } from "../StudentFormModal";

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
  const barColor = {
    primary: "bg-primary",
    success: "bg-success",
    warning: "bg-warning",
  }[tone];

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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    </div>
  );
}

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Next 16 passes `params` as a Promise; `use` unwraps it in a Client Component.
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const [student, setStudent] = useState<Student | null>(null);
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
        const data = await getStudent(id);
        if (!cancelled) setStudent(data);
      } catch {
        if (!cancelled) setStudent(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleUpdate = async (values: StudentFormValues) => {
    try {
      const updated = await updateStudent(id, values);
      setStudent(updated);
      setEditOpen(false);
      toast({ title: "Student updated", description: `${fullName(updated)}'s record was saved.` });
    } catch (e) {
      toast({
        title: "Could not save student",
        description: e instanceof Error ? e.message : "Something went wrong.",
        variant: "error",
      });
    }
  };

  const handleDelete = async () => {
    if (!student) return;
    setIsDeleting(true);
    try {
      await deleteStudent(student.id);
      toast({ title: "Student removed", description: `${fullName(student)} was deleted.` });
      router.push("/students");
    } catch (e) {
      toast({
        title: "Could not delete student",
        description: e instanceof Error ? e.message : "Something went wrong.",
        variant: "error",
      });
      setIsDeleting(false);
    }
  };

  if (loading) return <DetailSkeleton />;

  if (!student) {
    return (
      <Card>
        <EmptyState
          icon={<UserRound className="size-5" />}
          title="Student not found"
          description={`No student exists with the id "${id}". It may have been deleted.`}
          action={
            <Link href="/students">
              <Button variant="outline">Back to students</Button>
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
          href="/students"
          className="focus-ring inline-flex items-center gap-2 rounded-md text-sm text-muted transition-colors hover:text-text"
        >
          <ArrowLeft className="size-4" />
          Back to students
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
          <Avatar name={fullName(student)} src={student.avatar} size="xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-semibold text-text">{fullName(student)}</h1>
              <Badge variant={STATUS_VARIANT[student.status]} className="capitalize">
                {student.status}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted">
              {student.className} · Section {student.section} · Roll {student.rollNo}
            </p>
            <p className="mt-0.5 text-xs text-subtle">
              Admission {student.admissionNo} · Enrolled {formatDate(student.admissionDate)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          label="Attendance"
          value={`${student.attendancePercent}%`}
          percent={student.attendancePercent}
          tone={student.attendancePercent < 75 ? "warning" : "success"}
        />
        <MetricCard
          label="Performance"
          value={`${student.performancePercent}%`}
          percent={student.performancePercent}
          tone="primary"
        />
        <MetricCard
          label="Fee due"
          value={student.feeDue > 0 ? inr.format(student.feeDue) : "Cleared"}
          tone={student.feeDue > 0 ? "warning" : "success"}
        />
      </div>

      {/* Rule-based risk assessment — signature "insight" feature */}
      {(() => {
        const risk = assessStudent(student);
        const meta = RISK_META[risk.level];
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <h2 className="text-sm font-semibold text-text">Risk assessment</h2>
                <Badge variant="outline">Rule-based</Badge>
              </div>
              <Badge variant={meta.variant}>
                {meta.label} · {risk.score}/100
              </Badge>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div
                className="h-2 overflow-hidden rounded-full bg-surface-hover"
                role="progressbar"
                aria-valuenow={risk.score}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Risk score"
              >
                <div
                  className={cn(
                    "h-full rounded-full",
                    risk.level === "high" ? "bg-danger" : risk.level === "medium" ? "bg-warning" : "bg-success"
                  )}
                  style={{ width: `${Math.max(4, risk.score)}%` }}
                />
              </div>

              {risk.factors.length > 0 ? (
                <ul className="flex flex-col gap-1.5">
                  {risk.factors.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-border-strong" />
                      {f}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted">
                  No risk factors flagged — attendance, performance and fees are all healthy.
                </p>
              )}

              {risk.recommendation && (
                <p className="rounded-md bg-primary-soft px-3.5 py-2.5 text-sm text-primary-text">
                  <span className="font-semibold">Recommended:</span> {risk.recommendation}
                </p>
              )}

              <p className="text-[11px] text-subtle">
                Computed from a transparent weighted formula, not an AI model. Attendance, academic
                average and fee status drive the score.
              </p>
            </CardContent>
          </Card>
        );
      })()}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-text">Personal &amp; contact</h2>
          </CardHeader>
          <CardContent className="divide-y divide-border py-1">
            <DetailRow icon={Mail} label="Email" value={student.email} />
            <DetailRow icon={Phone} label="Phone" value={student.phone} />
            <DetailRow icon={CalendarDays} label="Date of birth" value={formatDate(student.dateOfBirth)} />
            <DetailRow icon={UserRound} label="Gender" value={student.gender} />
            <DetailRow icon={Droplet} label="Blood group" value={student.bloodGroup} />
            <DetailRow icon={MapPin} label="Address" value={student.address} />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-text">Guardian</h2>
            </CardHeader>
            <CardContent className="divide-y divide-border py-1">
              <DetailRow
                icon={UserRound}
                label={student.guardian.relation}
                value={student.guardian.name}
              />
              <DetailRow icon={Phone} label="Phone" value={student.guardian.phone} />
              <DetailRow icon={Mail} label="Email" value={student.guardian.email} />
              <DetailRow icon={UserRound} label="Occupation" value={student.guardian.occupation} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-text">Medical</h2>
            </CardHeader>
            <CardContent className="py-1">
              <DetailRow
                icon={Stethoscope}
                label="Notes"
                value={student.medicalNotes || "No medical notes on record."}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <StudentFormModal
        open={editOpen}
        onOpenChange={setEditOpen}
        student={student}
        onSubmit={handleUpdate}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete student?"
        description={`${fullName(student)} (${student.admissionNo}) will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        loading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}

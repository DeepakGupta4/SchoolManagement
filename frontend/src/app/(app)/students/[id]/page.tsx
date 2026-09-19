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
import { getStudentRisk, generateRemark, type AiRisk } from "@/lib/api/ai";
import { cn } from "@/lib/utils";
import { StudentFormModal } from "../StudentFormModal";
import { DocumentsCard } from "@/components/DocumentsCard";

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

/**
 * Risk assessment card. Shows the instant rule-based score, and lets the user
 * upgrade to a Gemini-generated assessment and draft a report-card remark. Both
 * AI calls fall back to the rule engine server-side, so they never hard-fail.
 */
function RiskCard({ student }: { student: Student }) {
  const { toast } = useToast();
  const base = assessStudent(student);

  const [ai, setAi] = useState<AiRisk | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [remark, setRemark] = useState<string | null>(null);
  const [drafting, setDrafting] = useState(false);

  // Prefer the AI result once we have it; otherwise the deterministic baseline.
  const level = ai?.level ?? base.level;
  const score = ai?.score ?? base.score;
  const meta = RISK_META[level];
  const usingAi = Boolean(ai);

  const analyze = async () => {
    setAnalyzing(true);
    try {
      const res = await getStudentRisk(student.id);
      setAi(res);
      if (res.source !== "gemini") {
        toast({
          title: "AI not connected",
          description: "Showing the rule-based assessment. Add GEMINI_API_KEY to enable AI.",
          variant: "info",
        });
      }
    } catch {
      toast({ title: "Could not analyze", description: "Please try again.", variant: "error" });
    } finally {
      setAnalyzing(false);
    }
  };

  const draftRemark = async () => {
    setDrafting(true);
    try {
      const res = await generateRemark(student.id);
      setRemark(res.remark);
    } catch {
      toast({ title: "Could not draft remark", description: "Please try again.", variant: "error" });
    } finally {
      setDrafting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-text">Risk assessment</h2>
          <Badge variant={usingAi ? "info" : "outline"}>{usingAi ? "AI (Gemini)" : "Rule-based"}</Badge>
        </div>
        <Badge variant={meta.variant}>
          {meta.label} · {score}/100
        </Badge>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div
          className="h-2 overflow-hidden rounded-full bg-surface-hover"
          role="progressbar"
          aria-valuenow={score}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Risk score"
        >
          <div
            className={cn(
              "h-full rounded-full transition-all",
              level === "high" ? "bg-danger" : level === "medium" ? "bg-warning" : "bg-success"
            )}
            style={{ width: `${Math.max(4, score)}%` }}
          />
        </div>

        {usingAi ? (
          <p className="text-sm text-muted">{ai!.reason}</p>
        ) : base.factors.length > 0 ? (
          <ul className="flex flex-col gap-1.5">
            {base.factors.map((f) => (
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

        {(usingAi ? ai!.recommendation : base.recommendation) && (
          <p className="rounded-md bg-primary-soft px-3.5 py-2.5 text-sm text-primary-text">
            <span className="font-semibold">Recommended:</span>{" "}
            {usingAi ? ai!.recommendation : base.recommendation}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={analyze} disabled={analyzing}>
            <Sparkles className={cn("size-4", analyzing && "animate-pulse")} />
            {analyzing ? "Analyzing…" : usingAi ? "Re-analyze with AI" : "Analyze with AI"}
          </Button>
          <Button variant="ghost" onClick={draftRemark} disabled={drafting}>
            {drafting ? "Drafting…" : "Draft report-card remark"}
          </Button>
        </div>

        {remark && (
          <div className="rounded-md border border-border bg-surface-sunken p-3 text-sm text-text">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-subtle">Suggested remark</p>
            {remark}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

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

  const handleUpdate = async (values: StudentFormValues): Promise<Student | null> => {
    try {
      const updated = await updateStudent(id, values);
      setStudent(updated);
      toast({ title: "Student updated", description: `${fullName(updated)}'s record was saved.` });
      return updated;
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

      {/* Risk assessment — deterministic baseline, upgradable with Gemini */}
      <RiskCard student={student} />

      {/* Student documents — birth certificate, Aadhaar, TC, marksheets */}
      <DocumentsCard ownerType="student" ownerId={student.id} ownerName={fullName(student)} />

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

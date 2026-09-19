"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  IdCard,
  Mail,
  Pencil,
  Phone,
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
import { staffApi, type StaffMember } from "@/lib/api/staff";
import type { StaffSchema } from "@/lib/schemas/staff";
import { StaffFormModal } from "../StaffFormModal";
import { DocumentsCard } from "@/components/DocumentsCard";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

const STATUS_META: Record<string, { variant: BadgeVariant; label: string }> = {
  active: { variant: "success", label: "Active" },
  "on-leave": { variant: "warning", label: "On Leave" },
  inactive: { variant: "default", label: "Inactive" },
};

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

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

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent>
        <p className="text-xs text-muted">{label}</p>
        <p className="mt-1 text-2xl font-semibold text-text">{value}</p>
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

export default function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // Next 16 passes `params` as a Promise; `use` unwraps it in a Client Component.
  const { id } = use(params);
  const router = useRouter();
  const { toast } = useToast();

  const [staff, setStaff] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // `cancelled` keeps a response for a previous id from overwriting the
    // current one if the route changes mid-flight.
    let cancelled = false;

    (async () => {
      try {
        const data = await staffApi.get(id);
        if (!cancelled) setStaff(data);
      } catch {
        if (!cancelled) setStaff(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleUpdate = async (values: StaffSchema): Promise<StaffMember | null> => {
    setSaving(true);
    try {
      const updated = await staffApi.update(id, values);
      setStaff(updated);
      toast({ title: "Staff member updated", description: `${updated.name} was saved.` });
      return updated;
    } catch (e) {
      toast({
        title: "Could not save staff member",
        description: e instanceof Error ? e.message : "Something went wrong.",
        variant: "error",
      });
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!staff) return;
    setIsDeleting(true);
    try {
      await staffApi.remove(staff.id);
      toast({ title: "Staff member removed", description: `${staff.name} was deleted.` });
      router.push("/staff");
    } catch (e) {
      toast({
        title: "Could not delete staff member",
        description: e instanceof Error ? e.message : "Something went wrong.",
        variant: "error",
      });
      setIsDeleting(false);
    }
  };

  if (loading) return <DetailSkeleton />;

  if (!staff) {
    return (
      <Card>
        <EmptyState
          icon={<UserRound className="size-5" />}
          title="Staff member not found"
          description={`No staff member exists with the id "${id}". They may have been deleted.`}
          action={
            <Link href="/staff">
              <Button variant="outline">Back to staff</Button>
            </Link>
          }
        />
      </Card>
    );
  }

  const status = STATUS_META[staff.status] ?? STATUS_META.inactive;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/staff"
          className="focus-ring inline-flex items-center gap-2 rounded-md text-sm text-muted transition-colors hover:text-text"
        >
          <ArrowLeft className="size-4" />
          Back to staff
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
          <Avatar name={staff.name} size="xl" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-semibold text-text">{staff.name}</h1>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted">
              {staff.role} · {staff.dept}
            </p>
            <p className="mt-0.5 text-xs text-subtle">
              {staff.employeeId} · Joined {staff.join}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard label="Monthly salary" value={inr.format(staff.salary)} />
        <MetricCard label="Employment type" value={staff.type} />
        <MetricCard label="Department" value={staff.dept} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-text">Contact</h2>
          </CardHeader>
          <CardContent className="divide-y divide-border py-1">
            <DetailRow icon={Mail} label="Email" value={staff.email} />
            <DetailRow icon={Phone} label="Phone" value={staff.phone} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-text">Employment</h2>
          </CardHeader>
          <CardContent className="divide-y divide-border py-1">
            <DetailRow icon={IdCard} label="Employee ID" value={staff.employeeId} />
            <DetailRow icon={BriefcaseBusiness} label="Role" value={staff.role} />
            <DetailRow icon={Building2} label="Department" value={staff.dept} />
            <DetailRow icon={BriefcaseBusiness} label="Employment type" value={staff.type} />
            <DetailRow icon={CalendarDays} label="Join date" value={staff.join} />
          </CardContent>
        </Card>
      </div>

      {/* Staff documents — ID proofs, contracts, certificates */}
      <DocumentsCard ownerType="staff" ownerId={staff.id} ownerName={staff.name} />

      <StaffFormModal
        open={editOpen}
        onOpenChange={setEditOpen}
        record={staff}
        saving={saving}
        onSubmit={handleUpdate}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete staff member?"
        description={`${staff.name} (${staff.employeeId}) will be permanently removed. This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        loading={isDeleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}

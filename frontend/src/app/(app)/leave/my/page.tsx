"use client";

import { useCallback, useState } from "react";
import { Plus, Clock, CheckCircle, XCircle, CalendarDays } from "lucide-react";
import {
  Badge, Button, Card, CardContent, Input, Modal, PageHeader, Select, StatCard, Table,
  Textarea, useToast, type Column,
} from "@/components/ui";
import { useAsyncList } from "@/hooks/useAsyncList";
import { daysInclusive, isValidDateString, TODAY_ISO } from "@/lib/dates";
import { getMyLeave, applyMyLeave, LEAVE_TYPE_OPTIONS, type LeaveRequest } from "@/lib/api/leaveRequests";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";
const STATUS_VARIANT: Record<string, BadgeVariant> = {
  Pending: "warning",
  Approved: "success",
  Rejected: "danger",
};

export default function MyLeavePage() {
  const { toast } = useToast();
  const [reloadKey, setReloadKey] = useState(0);
  // reloadKey bumps force a refetch after applying; the callback depends on it
  // intentionally even though its body doesn't read it.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetcher = useCallback(() => getMyLeave(), [reloadKey]);
  const { items, loading, error } = useAsyncList<LeaveRequest>(fetcher);
  const [statusFilter, setStatusFilter] = useState("All");

  const [open, setOpen] = useState(false);
  const [type, setType] = useState(LEAVE_TYPE_OPTIONS[0]);
  const [from, setFrom] = useState(TODAY_ISO);
  const [to, setTo] = useState(TODAY_ISO);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const days = isValidDateString(from) && isValidDateString(to) ? daysInclusive(from, to) : 0;
  const canApply = !!type && days >= 1 && reason.trim().length > 0;

  const resetForm = () => {
    setType(LEAVE_TYPE_OPTIONS[0]);
    setFrom(TODAY_ISO);
    setTo(TODAY_ISO);
    setReason("");
  };

  const apply = async () => {
    if (!canApply) return;
    try {
      setSaving(true);
      await applyMyLeave({ type, from, to, reason: reason.trim() });
      toast({ title: "Leave requested", description: "Your request was submitted for approval.", variant: "success" });
      setOpen(false);
      resetForm();
      setReloadKey((k) => k + 1);
    } catch (e) {
      toast({ title: "Could not submit", description: e instanceof Error ? e.message : "Try again.", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const stats = {
    pending: items.filter((l) => l.status === "Pending").length,
    approved: items.filter((l) => l.status === "Approved").length,
    rejected: items.filter((l) => l.status === "Rejected").length,
  };

  // Tiles keep counting the full set; clicking one narrows the table (toggle off to clear).
  const visible = statusFilter === "All" ? items : items.filter((l) => l.status === statusFilter);

  const columns: Column<LeaveRequest>[] = [
    {
      key: "type",
      header: "Leave Type",
      sortable: true,
      render: (l) => <span className="font-medium text-text">{l.type}</span>,
    },
    { key: "from", header: "From", render: (l) => <span className="text-muted">{l.from}</span> },
    { key: "to", header: "To", render: (l) => <span className="text-muted">{l.to}</span> },
    {
      key: "days",
      header: "Days",
      align: "right",
      render: (l) => (
        <span className="inline-flex rounded-sm bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary-text">
          {l.days}d
        </span>
      ),
    },
    { key: "reason", header: "Reason", render: (l) => <span className="block max-w-xs truncate text-muted">{l.reason}</span> },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (l) => <Badge variant={STATUS_VARIANT[l.status] ?? "default"}>{l.status}</Badge>,
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="My Leave"
        description="Request leave and track your own applications."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" />
            Apply for leave
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Pending"
          value={error ? "—" : stats.pending}
          icon={Clock}
          tone="amber"
          active={statusFilter === "Pending"}
          onClick={() => setStatusFilter(statusFilter === "Pending" ? "All" : "Pending")}
        />
        <StatCard
          label="Approved"
          value={error ? "—" : stats.approved}
          icon={CheckCircle}
          tone="emerald"
          active={statusFilter === "Approved"}
          onClick={() => setStatusFilter(statusFilter === "Approved" ? "All" : "Approved")}
        />
        <StatCard
          label="Rejected"
          value={error ? "—" : stats.rejected}
          icon={XCircle}
          tone="rose"
          active={statusFilter === "Rejected"}
          onClick={() => setStatusFilter(statusFilter === "Rejected" ? "All" : "Rejected")}
        />
      </div>

      {error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <p className="text-sm font-medium text-danger">Could not load your leave requests.</p>
            <p className="text-xs text-muted">Reload the page to try again.</p>
          </CardContent>
        </Card>
      ) : (
        <Table
          columns={columns}
          rows={visible}
          rowKey={(l) => l.id}
          loading={loading}
          pageSize={15}
          emptyTitle={statusFilter === "All" ? "No leave requests yet" : `No ${statusFilter.toLowerCase()} requests`}
          emptyDescription={
            statusFilter === "All"
              ? "Click “Apply for leave” to submit your first request."
              : "Nothing matches this status — tap the tile again to clear the filter."
          }
          emptyAction={
            statusFilter === "All" ? (
              <Button variant="outline" onClick={() => setOpen(true)}>
                <Plus className="size-4" />
                Apply for leave
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setStatusFilter("All")}>
                Clear filter
              </Button>
            )
          }
        />
      )}

      <Modal
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) resetForm();
        }}
        title="Apply for leave"
        description="Your name and department are filled in automatically. It starts as Pending for approval."
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={apply} disabled={saving || !canApply}>
              {saving ? "Submitting…" : "Submit request"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <Select
            label="Leave type"
            required
            value={type}
            onChange={(e) => setType(e.target.value)}
            options={LEAVE_TYPE_OPTIONS.map((t) => ({ label: t, value: t }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="From" type="date" required value={from} onChange={(e) => setFrom(e.target.value)} />
            <Input label="To" type="date" required value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <CalendarDays className="size-4 text-subtle" />
            {days >= 1 ? (
              <span>
                <strong className="text-text">{days}</strong> day{days === 1 ? "" : "s"}
              </span>
            ) : (
              <span className="text-danger-text">End date must be on or after the start date.</span>
            )}
          </div>
          <Textarea
            label="Reason"
            required
            rows={3}
            placeholder="Reason for leave…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}

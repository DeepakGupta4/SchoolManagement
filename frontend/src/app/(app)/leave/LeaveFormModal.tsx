"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, Button, Input, Select, Textarea } from "@/components/ui";
import { leaveRequestSchema, type LeaveRequestSchema } from "@/lib/schemas/leaveRequest";
import {
  LEAVE_TYPE_OPTIONS,
  LEAVE_STATUS_OPTIONS,
  LEAVE_DEPT_OPTIONS,
  type LeaveRequest,
} from "@/lib/api/leaveRequests";

const emptyValues: LeaveRequestSchema = {
  code: "",
  name: "",
  role: "",
  dept: LEAVE_DEPT_OPTIONS[0],
  type: LEAVE_TYPE_OPTIONS[0],
  from: "",
  to: "",
  days: 1,
  reason: "",
  status: "Pending",
};

interface LeaveFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode, absent = create mode. */
  record?: LeaveRequest | null;
  saving?: boolean;
  onSubmit: (values: LeaveRequestSchema) => Promise<void>;
}

export function LeaveFormModal({
  open,
  onOpenChange,
  record,
  saving,
  onSubmit,
}: LeaveFormModalProps) {
  const isEdit = Boolean(record);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeaveRequestSchema>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: emptyValues,
  });

  // Repopulate on open so the previous record's values can't leak through.
  useEffect(() => {
    if (!open) return;
    reset(record ? { ...record } : emptyValues);
  }, [open, record, reset]);

  const submit = handleSubmit(onSubmit);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit leave request" : "Apply for leave"}
      description={
        isEdit
          ? "Update this leave request. Changes apply immediately."
          : "Raise a leave request. The request ID must be unique."
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Apply leave"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Request ID" required placeholder="LV011" {...register("code")} error={errors.code?.message} />
          <Input label="Staff member" required placeholder="Mr. Suresh Kumar" {...register("name")} error={errors.name?.message} />
          <Input label="Role" required placeholder="History Teacher" {...register("role")} error={errors.role?.message} />
          <Select label="Department" required options={LEAVE_DEPT_OPTIONS.map((d) => ({ label: d, value: d }))} {...register("dept")} error={errors.dept?.message} />
          <Select label="Leave type" required options={LEAVE_TYPE_OPTIONS.map((t) => ({ label: t, value: t }))} {...register("type")} error={errors.type?.message} />
          <Select label="Status" required options={LEAVE_STATUS_OPTIONS.map((s) => ({ label: s, value: s }))} {...register("status")} error={errors.status?.message} />
          <Input label="From" required placeholder="14 Jul 2025" {...register("from")} error={errors.from?.message} />
          <Input label="To" required placeholder="16 Jul 2025" {...register("to")} error={errors.to?.message} />
          <Input label="Days" type="number" min={1} {...register("days")} error={errors.days?.message} />
        </div>

        <Textarea label="Reason" required placeholder="Fever and cold" {...register("reason")} error={errors.reason?.message} />

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}

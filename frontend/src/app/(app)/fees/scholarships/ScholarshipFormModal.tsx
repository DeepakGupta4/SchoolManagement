"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, Button, Input, Select } from "@/components/ui";
import { scholarshipSchema, type ScholarshipSchema } from "@/lib/schemas/scholarship";
import {
  SCHOLARSHIP_CLASS_OPTIONS,
  SCHOLARSHIP_STATUS_OPTIONS,
  SCHOLARSHIP_TYPE_OPTIONS,
  type Scholarship,
} from "@/lib/api/scholarships";

const emptyValues: ScholarshipSchema = {
  code: "",
  student: "",
  class: SCHOLARSHIP_CLASS_OPTIONS[0],
  type: SCHOLARSHIP_TYPE_OPTIONS[0],
  percentage: 25,
  amount: 0,
  reason: "",
  status: "pending",
  since: "",
};

interface ScholarshipFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode, absent = create mode. */
  record?: Scholarship | null;
  saving?: boolean;
  onSubmit: (values: ScholarshipSchema) => Promise<void>;
}

export function ScholarshipFormModal({
  open,
  onOpenChange,
  record,
  saving,
  onSubmit,
}: ScholarshipFormModalProps) {
  const isEdit = Boolean(record);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ScholarshipSchema>({
    resolver: zodResolver(scholarshipSchema),
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
      size="lg"
      title={isEdit ? "Edit scholarship" : "Add scholarship"}
      description={
        isEdit
          ? "Update this concession. Changes apply immediately."
          : "Award a fee concession. The scholarship ID must be unique."
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create scholarship"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Scholarship ID"
            required
            placeholder="SCH009"
            {...register("code")}
            error={errors.code?.message}
          />
          <Input
            label="Student"
            required
            placeholder="Priya Patel"
            {...register("student")}
            error={errors.student?.message}
          />
          <Select
            label="Class"
            required
            options={SCHOLARSHIP_CLASS_OPTIONS.map((c) => ({ label: c, value: c }))}
            {...register("class")}
            error={errors.class?.message}
          />
          <Select
            label="Type"
            required
            options={SCHOLARSHIP_TYPE_OPTIONS.map((t) => ({ label: t, value: t }))}
            {...register("type")}
            error={errors.type?.message}
          />
          <Input
            label="Concession %"
            type="number"
            min={1}
            max={100}
            {...register("percentage")}
            error={errors.percentage?.message}
          />
          <Input
            label="Amount waived (₹)"
            type="number"
            min={0}
            {...register("amount")}
            error={errors.amount?.message}
          />
          <Select
            label="Status"
            required
            options={SCHOLARSHIP_STATUS_OPTIONS}
            {...register("status")}
            error={errors.status?.message}
          />
          <Input
            label="Since"
            required
            placeholder="Apr 2025"
            {...register("since")}
            error={errors.since?.message}
          />
        </div>

        <Input
          label="Reason"
          required
          placeholder="School Topper"
          {...register("reason")}
          error={errors.reason?.message}
        />

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}

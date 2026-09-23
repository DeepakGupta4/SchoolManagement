"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, Button, Input, Select } from "@/components/ui";
import { useClassOptions } from "@/hooks/useClassOptions";
import { scholarshipSchema, type ScholarshipSchema } from "@/lib/schemas/scholarship";
import {
  SCHOLARSHIP_STATUS_OPTIONS,
  SCHOLARSHIP_TYPE_OPTIONS,
  type Scholarship,
} from "@/lib/api/scholarships";

const emptyValues: ScholarshipSchema = {
  code: "",
  student: "",
  class: "",
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
  /** Existing scholarships — used to block a duplicate scholarship ID. */
  existing?: Scholarship[];
  saving?: boolean;
  onSubmit: (values: ScholarshipSchema) => Promise<void>;
}

export function ScholarshipFormModal({
  open,
  onOpenChange,
  record,
  existing = [],
  saving,
  onSubmit,
}: ScholarshipFormModalProps) {
  const isEdit = Boolean(record);
  const { classOptions } = useClassOptions();
  const [dupError, setDupError] = useState<string | null>(null);

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
    // Deferred: clearing the duplicate error synchronously in an effect trips
    // the react-hooks/set-state-in-effect rule.
    const t = setTimeout(() => setDupError(null), 0);
    return () => clearTimeout(t);
  }, [open, record, reset]);

  // Case-insensitive set of scholarship IDs already taken by *other* records.
  // A student may hold more than one concession, so the ID is the unique key.
  const takenCodes = useMemo(() => {
    const set = new Set<string>();
    for (const s of existing) {
      if (record && s.id === record.id) continue;
      set.add(s.code.trim().toLowerCase());
    }
    return set;
  }, [existing, record]);

  const submit = handleSubmit((values) => {
    const code = values.code.trim();
    if (takenCodes.has(code.toLowerCase())) {
      setDupError(`"${code}" already exists. Pick a different scholarship ID.`);
      return;
    }
    setDupError(null);
    return onSubmit({ ...values, code });
  });

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
            error={errors.code?.message ?? dupError ?? undefined}
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
            placeholder="Select class"
            options={classOptions}
            {...register("class")}
            error={errors.class?.message}
          />
          {/* Type — pick a preset or type a custom concession type. */}
          <Input
            label="Type"
            required
            list="scholarship-type-presets"
            placeholder="Pick or type — e.g. Merit"
            {...register("type")}
            error={errors.type?.message}
          />
          <datalist id="scholarship-type-presets">
            {SCHOLARSHIP_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
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

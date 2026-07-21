"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, Button, Input, MultiSelect, Select } from "@/components/ui";
import { allocationSchema, type AllocationSchema } from "@/lib/schemas/allocation";
import {
  ALLOCATION_CLASS_OPTIONS,
  ALLOCATION_DEPT_OPTIONS,
  MAX_PERIODS,
  type Allocation,
} from "@/lib/api/allocations";

const emptyValues: AllocationSchema = {
  teacher: "",
  empId: "",
  dept: ALLOCATION_DEPT_OPTIONS[0],
  subject: "",
  classes: [],
  periods: 0,
  labs: 0,
  room: "",
};

interface AllocationFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode, absent = create mode. */
  record?: Allocation | null;
  saving?: boolean;
  onSubmit: (values: AllocationSchema) => Promise<void>;
}

export function AllocationFormModal({
  open,
  onOpenChange,
  record,
  saving,
  onSubmit,
}: AllocationFormModalProps) {
  const isEdit = Boolean(record);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<AllocationSchema>({
    resolver: zodResolver(allocationSchema),
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
      title={isEdit ? "Edit allocation" : "Allocate subject"}
      description={
        isEdit
          ? "Update this teacher's subject allocation. Changes apply immediately."
          : `Allocate a subject to a teacher. The cap is ${MAX_PERIODS} periods a week.`
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Allocate subject"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Teacher" required placeholder="Dr. Priya Sharma" {...register("teacher")} error={errors.teacher?.message} />
          <Input label="Employee ID" required placeholder="TCH-1041" {...register("empId")} error={errors.empId?.message} />
          <Select label="Department" required options={ALLOCATION_DEPT_OPTIONS.map((d) => ({ label: d, value: d }))} {...register("dept")} error={errors.dept?.message} />
          <Input label="Subject" required placeholder="Mathematics" {...register("subject")} error={errors.subject?.message} />
          <Input label="Periods / week" type="number" min={0} max={MAX_PERIODS} {...register("periods")} error={errors.periods?.message} />
          <Input label="Lab periods / week" type="number" min={0} {...register("labs")} error={errors.labs?.message} />
          <Input label="Room" required placeholder="R-204" {...register("room")} error={errors.room?.message} />
        </div>

        <Controller
          control={control}
          name="classes"
          render={({ field }) => (
            <MultiSelect
              label="Classes"
              required
              options={ALLOCATION_CLASS_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              error={errors.classes?.message}
            />
          )}
        />

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}

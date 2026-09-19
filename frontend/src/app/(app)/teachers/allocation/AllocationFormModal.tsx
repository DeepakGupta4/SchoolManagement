"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, Button, Input, MultiSelect, Select } from "@/components/ui";
import { allocationSchema, type AllocationSchema } from "@/lib/schemas/allocation";
import { useClassOptions } from "@/hooks/useClassOptions";
import { useSubjectOptions } from "@/hooks/useSubjectOptions";
import { listTeachers } from "@/lib/api/teachers";
import { teacherName, type Teacher } from "@/types/teacher";
import {
  ALLOCATION_DEPT_OPTIONS,
  MAX_PERIODS,
  type Allocation,
} from "@/lib/api/allocations";

const emptyValues: AllocationSchema = {
  teacher: "",
  empId: "",
  dept: "",
  subject: "",
  classes: [],
  periods: 0,
  labs: 0,
  room: "",
};

const DEPT_SELECT_OPTIONS = ALLOCATION_DEPT_OPTIONS.map((d) => ({ label: d, value: d }));

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
  const { classNames } = useClassOptions();
  const { subjectOptions } = useSubjectOptions();
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  // Load real teachers whenever the modal opens so the dropdown reflects
  // whoever is on staff right now.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    listTeachers()
      .then((data) => {
        if (!cancelled) setTeachers(data);
      })
      .catch(() => {
        if (!cancelled) setTeachers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Allocation records store the teacher's display name, so the Select value
  // is the name too. Include the record's saved teacher even if they no longer
  // appear in the list, so editing never blanks the field.
  const teacherOptions = useMemo(() => {
    const names = teachers.map((t) => teacherName(t));
    if (record?.teacher && !names.includes(record.teacher)) {
      names.unshift(record.teacher);
    }
    return names.map((n) => ({ label: n, value: n }));
  }, [teachers, record]);

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
          <Select label="Teacher" required placeholder="Select teacher" options={teacherOptions} {...register("teacher")} error={errors.teacher?.message} />
          <Input label="Employee ID" required placeholder="TCH-1041" {...register("empId")} error={errors.empId?.message} />
          <Select label="Department" required placeholder="Select department" options={DEPT_SELECT_OPTIONS} {...register("dept")} error={errors.dept?.message} />
          <Select label="Subject" required placeholder="Select subject" options={subjectOptions} {...register("subject")} error={errors.subject?.message} />
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
              options={classNames}
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

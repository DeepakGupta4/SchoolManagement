"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Modal, Button, Input, MultiSelect, Select } from "@/components/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { departmentSchema, type DepartmentSchema } from "@/lib/schemas/department";
import {
  DEPARTMENT_BLOCK_OPTIONS,
  DEPARTMENT_STATUS_OPTIONS,
  DEPARTMENT_SUBJECT_OPTIONS,
  type Department,
} from "@/lib/api/departments";

const emptyValues: DepartmentSchema = {
  name: "",
  code: "",
  hod: "",
  block: DEPARTMENT_BLOCK_OPTIONS[0],
  teachers: 0,
  subjects: [],
  budget: 0,
  spent: 0,
  status: "active",
};

interface DepartmentFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode, absent = create mode. */
  record?: Department | null;
  saving?: boolean;
  onSubmit: (values: DepartmentSchema) => Promise<void>;
}

export function DepartmentFormModal({
  open,
  onOpenChange,
  record,
  saving,
  onSubmit,
}: DepartmentFormModalProps) {
  const isEdit = Boolean(record);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<DepartmentSchema>({
    resolver: zodResolver(departmentSchema),
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
      title={isEdit ? "Edit department" : "New department"}
      description={
        isEdit
          ? "Update this department. Changes apply immediately."
          : "Create a department. The department code must be unique."
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create department"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Department name" required placeholder="Mathematics" {...register("name")} error={errors.name?.message} />
          <Input label="Code" required placeholder="MATH" {...register("code")} error={errors.code?.message} />
          <Input label="Head of department" required placeholder="Dr. Priya Sharma" {...register("hod")} error={errors.hod?.message} />
          <Select label="Block" required options={DEPARTMENT_BLOCK_OPTIONS.map((b) => ({ label: b, value: b }))} {...register("block")} error={errors.block?.message} />
          <Input label="Teachers" type="number" min={0} {...register("teachers")} error={errors.teachers?.message} />
          <Select label="Status" required options={DEPARTMENT_STATUS_OPTIONS} {...register("status")} error={errors.status?.message} />
          <Input label="Annual budget (₹)" type="number" min={0} {...register("budget")} error={errors.budget?.message} />
          <Input label="Spent (₹)" type="number" min={0} {...register("spent")} error={errors.spent?.message} />
        </div>

        <Controller
          control={control}
          name="subjects"
          render={({ field }) => (
            <MultiSelect
              label="Subjects"
              required
              options={DEPARTMENT_SUBJECT_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              error={errors.subjects?.message}
            />
          )}
        />

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}

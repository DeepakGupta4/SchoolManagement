"use client";

import { useEffect, useMemo, useState } from "react";
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

// Common department names — offered as a quick pick, but the field stays free
// text so any custom department name works.
const DEPARTMENT_NAME_PRESETS = [
  "Mathematics", "Science", "English", "Hindi", "Sanskrit",
  "Social Studies", "Languages", "Computer Science", "Commerce",
  "Physical Education", "Arts", "Music",
];

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
  /** Existing departments — used to block a duplicate department name. */
  existing?: Department[];
  saving?: boolean;
  onSubmit: (values: DepartmentSchema) => Promise<void>;
}

export function DepartmentFormModal({
  open,
  onOpenChange,
  record,
  existing = [],
  saving,
  onSubmit,
}: DepartmentFormModalProps) {
  const isEdit = Boolean(record);
  const [dupError, setDupError] = useState<string | null>(null);

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
    // Deferred: clearing the duplicate-name error synchronously in an effect
    // trips the react-hooks/set-state-in-effect rule.
    const t = setTimeout(() => setDupError(null), 0);
    return () => clearTimeout(t);
  }, [open, record, reset]);

  // Case-insensitive set of names already taken by *other* departments.
  const takenNames = useMemo(() => {
    const set = new Set<string>();
    for (const d of existing) {
      if (record && d.id === record.id) continue;
      set.add(d.name.trim().toLowerCase());
    }
    return set;
  }, [existing, record]);

  const submit = handleSubmit((values) => {
    const name = values.name.trim();
    if (takenNames.has(name.toLowerCase())) {
      setDupError(`"${name}" already exists. Pick a different department name.`);
      return;
    }
    setDupError(null);
    return onSubmit({
      ...values,
      name,
      code: values.code.trim(),
      hod: values.hod.trim(),
      block: values.block.trim(),
    });
  });

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
          {/* Department name — pick a preset or type a custom one. */}
          <Input
            label="Department name"
            required
            list="department-names"
            placeholder="Pick or type — e.g. Mathematics"
            {...register("name")}
            error={errors.name?.message ?? dupError ?? undefined}
          />
          <datalist id="department-names">
            {DEPARTMENT_NAME_PRESETS.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>

          <Input label="Code" required placeholder="MATH" {...register("code")} error={errors.code?.message} />
          <Input label="Head of department" required placeholder="Dr. Priya Sharma" {...register("hod")} error={errors.hod?.message} />

          {/* Block — pick a preset or type a custom one. */}
          <Input
            label="Block"
            required
            list="department-blocks"
            placeholder="Pick or type — e.g. Science Block"
            {...register("block")}
            error={errors.block?.message}
          />
          <datalist id="department-blocks">
            {DEPARTMENT_BLOCK_OPTIONS.map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>

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

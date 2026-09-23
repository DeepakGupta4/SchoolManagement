"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, Button, Input, Select } from "@/components/ui";
import { subjectSchema, type SubjectSchema } from "@/lib/schemas/subject";
import {
  SUBJECT_DEPARTMENT_OPTIONS,
  SUBJECT_TYPE_OPTIONS,
  COMMON_SUBJECTS,
  suggestSubjectCode,
  type SchoolSubject,
} from "@/lib/api/subjects";

const emptyValues: SubjectSchema = {
  name: "",
  code: "",
  department: "",
  type: "Core",
};

interface SubjectFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode, absent = create mode. */
  record?: SchoolSubject | null;
  /** Existing subjects — used to block a duplicate subject name. */
  existing?: SchoolSubject[];
  saving?: boolean;
  onSubmit: (values: SubjectSchema) => Promise<void>;
}

export function SubjectFormModal({
  open,
  onOpenChange,
  record,
  existing = [],
  saving,
  onSubmit,
}: SubjectFormModalProps) {
  const isEdit = Boolean(record);
  const [dupError, setDupError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SubjectSchema>({
    resolver: zodResolver(subjectSchema),
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

  // Case-insensitive set of names already taken by *other* subjects.
  const takenNames = useMemo(() => {
    const set = new Set<string>();
    for (const s of existing) {
      if (record && s.id === record.id) continue;
      set.add(s.name.trim().toLowerCase());
    }
    return set;
  }, [existing, record]);

  // Auto-fill the code from the name when the operator leaves it blank, and
  // block a duplicate subject name before it reaches the server.
  const submit = handleSubmit((values) => {
    const name = values.name.trim();
    if (takenNames.has(name.toLowerCase())) {
      setDupError(`"${name}" already exists. Pick a different subject name.`);
      return;
    }
    setDupError(null);
    return onSubmit({ ...values, name, code: values.code.trim() || suggestSubjectCode(name) });
  });

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit subject" : "Add new subject"}
      description={
        isEdit
          ? "Update this subject. Changes apply immediately."
          : "Create a subject. The subject name must be unique."
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create subject"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Subject name"
            required
            list="common-subjects"
            placeholder="Pick or type — e.g. Mathematics"
            {...register("name")}
            error={errors.name?.message ?? dupError ?? undefined}
          />
          <datalist id="common-subjects">
            {COMMON_SUBJECTS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <Input label="Code" hint="Leave blank to auto-generate" placeholder="MATH" {...register("code")} error={errors.code?.message} />

          {/* Department — pick a preset or type a custom one. */}
          <Input
            label="Department"
            list="subject-departments"
            placeholder="Pick or type — e.g. Science"
            {...register("department")}
            error={errors.department?.message}
          />
          <datalist id="subject-departments">
            {SUBJECT_DEPARTMENT_OPTIONS.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>

          <Select
            label="Type"
            required
            options={SUBJECT_TYPE_OPTIONS.map((t) => ({ label: t, value: t }))}
            {...register("type")}
            error={errors.type?.message}
          />
        </div>

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}

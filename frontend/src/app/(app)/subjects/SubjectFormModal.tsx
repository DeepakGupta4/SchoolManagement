"use client";

import { useEffect } from "react";
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
  saving?: boolean;
  onSubmit: (values: SubjectSchema) => Promise<void>;
}

export function SubjectFormModal({
  open,
  onOpenChange,
  record,
  saving,
  onSubmit,
}: SubjectFormModalProps) {
  const isEdit = Boolean(record);

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
  }, [open, record, reset]);

  // Auto-fill the code from the name when the operator leaves it blank.
  const submit = handleSubmit((values) =>
    onSubmit({ ...values, code: values.code.trim() || suggestSubjectCode(values.name) })
  );

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
            error={errors.name?.message}
          />
          <datalist id="common-subjects">
            {COMMON_SUBJECTS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
          <Input label="Code" hint="Leave blank to auto-generate" placeholder="MATH" {...register("code")} error={errors.code?.message} />
          <Select
            label="Department"
            placeholder="Select department"
            options={SUBJECT_DEPARTMENT_OPTIONS.map((d) => ({ label: d, value: d }))}
            {...register("department")}
            error={errors.department?.message}
          />
          <Select
            label="Type"
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

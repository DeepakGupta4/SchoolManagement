"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, Button, Input } from "@/components/ui";
import { subjectSchema, type SubjectSchema } from "@/lib/schemas/subject";
import type { SchoolSubject } from "@/lib/api/subjects";

const emptyValues: SubjectSchema = {
  name: "",
  code: "",
  department: "",
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

  const submit = handleSubmit(onSubmit);

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
          <Input label="Subject name" required placeholder="Mathematics" {...register("name")} error={errors.name?.message} />
          <Input label="Code" placeholder="MATH" {...register("code")} error={errors.code?.message} />
          <Input label="Department" placeholder="Science" {...register("department")} error={errors.department?.message} />
        </div>

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}

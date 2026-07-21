"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, Button, Input, Select, MultiSelect } from "@/components/ui";
import { schoolClassSchema, type SchoolClassSchema } from "@/lib/schemas/schoolClass";
import { STREAM_OPTIONS, SECTION_OPTIONS, type SchoolClass } from "@/lib/api/classes";

const emptyValues: SchoolClassSchema = {
  name: "",
  sections: ["A"],
  stream: STREAM_OPTIONS[0],
  classTeacher: "",
  room: "",
  students: 0,
  teachers: 0,
};

interface ClassFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode, absent = create mode. */
  record?: SchoolClass | null;
  saving?: boolean;
  onSubmit: (values: SchoolClassSchema) => Promise<void>;
}

export function ClassFormModal({
  open,
  onOpenChange,
  record,
  saving,
  onSubmit,
}: ClassFormModalProps) {
  const isEdit = Boolean(record);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<SchoolClassSchema>({
    resolver: zodResolver(schoolClassSchema),
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
      title={isEdit ? "Edit class" : "Add new class"}
      description={
        isEdit
          ? "Update this class. Changes apply immediately."
          : "Create a class. The class name must be unique."
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create class"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Class name" required placeholder="Class 6" {...register("name")} error={errors.name?.message} />
          <Select label="Stream" required options={STREAM_OPTIONS.map((s) => ({ label: s, value: s }))} {...register("stream")} error={errors.stream?.message} />
          <Input label="Class teacher" required {...register("classTeacher")} error={errors.classTeacher?.message} />
          <Input label="Room(s)" required placeholder="101-103" {...register("room")} error={errors.room?.message} />
          <Input label="Students" type="number" min={0} {...register("students")} error={errors.students?.message} />
          <Input label="Teachers" type="number" min={0} {...register("teachers")} error={errors.teachers?.message} />
        </div>

        <Controller
          control={control}
          name="sections"
          render={({ field }) => (
            <MultiSelect
              label="Sections"
              required
              options={SECTION_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              error={errors.sections?.message}
            />
          )}
        />

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, Button, Input, MultiSelect, Select, Textarea } from "@/components/ui";
import { useClassOptions } from "@/hooks/useClassOptions";
import { useSubjectOptions } from "@/hooks/useSubjectOptions";
import { listTeachers } from "@/lib/api/teachers";
import { teacherName } from "@/types/teacher";
import { materialSchema, type MaterialSchema } from "@/lib/schemas/material";
import { TAG_OPTIONS, TYPE_OPTIONS, VISIBILITY_OPTIONS, type Material } from "@/lib/api/studyMaterial";

const today = () =>
  new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const emptyValues: MaterialSchema = {
  title: "",
  type: "",
  subject: "",
  klass: "",
  uploader: "",
  uploaded: today(),
  sizeMb: 1,
  downloads: 0,
  visibility: "draft",
  description: "",
  tags: [],
  url: "",
};

interface MaterialFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode, absent = create mode. */
  record?: Material | null;
  saving?: boolean;
  onSubmit: (values: MaterialSchema) => Promise<void>;
}

export function MaterialFormModal({
  open,
  onOpenChange,
  record,
  saving,
  onSubmit,
}: MaterialFormModalProps) {
  const isEdit = Boolean(record);
  const { classOptions } = useClassOptions();
  const { subjectOptions } = useSubjectOptions();
  const [teacherNames, setTeacherNames] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<MaterialSchema>({
    resolver: zodResolver(materialSchema),
    defaultValues: emptyValues,
  });

  // Real teachers power the "Uploaded by" picker so the owner chooses from staff
  // they actually created rather than a static list.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    listTeachers()
      .then((teachers) => {
        if (!cancelled) setTeacherNames(teachers.map(teacherName));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open]);

  // Repopulate on open so the previous record's values can't leak through.
  useEffect(() => {
    if (!open) return;
    reset(
      record
        ? { ...emptyValues, ...record, url: record.url ?? "" }
        : { ...emptyValues, uploaded: today() }
    );
  }, [open, record, reset]);

  const submit = handleSubmit(onSubmit);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit material" : "Upload material"}
      description={
        isEdit
          ? "Update this resource. Changes apply immediately."
          : "Add a resource to the shared library. The title must be unique."
      }
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Upload material"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Title"
            required
            placeholder="Trigonometry — Formula Sheet"
            {...register("title")}
            error={errors.title?.message}
          />
          <Select
            label="Type"
            required
            placeholder="Select type"
            options={TYPE_OPTIONS}
            {...register("type")}
            error={errors.type?.message}
          />
          <Select
            label="Subject"
            required
            placeholder="Select subject"
            options={subjectOptions}
            {...register("subject")}
            error={errors.subject?.message}
          />
          <Select
            label="Class"
            required
            placeholder="Select class"
            options={classOptions}
            {...register("klass")}
            error={errors.klass?.message}
          />
          <Select
            label="Uploaded by"
            required
            placeholder="Select teacher"
            options={teacherNames.map((t) => ({ label: t, value: t }))}
            {...register("uploader")}
            error={errors.uploader?.message}
          />
          <Input
            label="Upload date"
            required
            placeholder="21 Jul 2026"
            {...register("uploaded")}
            error={errors.uploaded?.message}
          />
          <Input
            label="Size (MB)"
            type="number"
            min={0.1}
            step={0.1}
            required
            {...register("sizeMb")}
            error={errors.sizeMb?.message}
          />
          <Input
            label="Downloads"
            type="number"
            min={0}
            {...register("downloads")}
            error={errors.downloads?.message}
          />
          <Select
            label="Visibility"
            required
            options={VISIBILITY_OPTIONS}
            {...register("visibility")}
            error={errors.visibility?.message}
          />
          <Input
            label="Resource link"
            hint="Drive, YouTube or PDF URL — optional."
            placeholder="https://…"
            {...register("url")}
            error={errors.url?.message}
          />
        </div>

        <Textarea
          label="Description"
          placeholder="What does this resource contain?"
          {...register("description")}
          error={errors.description?.message}
        />

        <Controller
          control={control}
          name="tags"
          render={({ field }) => (
            <MultiSelect
              label="Tags"
              options={TAG_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              error={errors.tags?.message}
            />
          )}
        />

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}

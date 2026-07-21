"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, Button, Input, MultiSelect, Select, Textarea } from "@/components/ui";
import { materialSchema, type MaterialSchema } from "@/lib/schemas/material";
import {
  CLASS_OPTIONS,
  SUBJECT_OPTIONS,
  TAG_OPTIONS,
  TYPE_OPTIONS,
  UPLOADER_OPTIONS,
  VISIBILITY_OPTIONS,
  type Material,
} from "@/lib/api/studyMaterial";

const today = () =>
  new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const emptyValues: MaterialSchema = {
  title: "",
  type: TYPE_OPTIONS[0].value,
  subject: SUBJECT_OPTIONS[0],
  klass: CLASS_OPTIONS[0],
  uploader: UPLOADER_OPTIONS[0],
  uploaded: today(),
  sizeMb: 1,
  downloads: 0,
  visibility: "draft",
  description: "",
  tags: [],
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

  // Repopulate on open so the previous record's values can't leak through.
  useEffect(() => {
    if (!open) return;
    reset(record ? { ...record } : { ...emptyValues, uploaded: today() });
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
            options={TYPE_OPTIONS}
            {...register("type")}
            error={errors.type?.message}
          />
          <Select
            label="Subject"
            required
            options={SUBJECT_OPTIONS.map((s) => ({ label: s, value: s }))}
            {...register("subject")}
            error={errors.subject?.message}
          />
          <Select
            label="Class"
            required
            options={CLASS_OPTIONS.map((c) => ({ label: `Class ${c}`, value: c }))}
            {...register("klass")}
            error={errors.klass?.message}
          />
          <Select
            label="Uploaded by"
            required
            options={UPLOADER_OPTIONS.map((u) => ({ label: u, value: u }))}
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

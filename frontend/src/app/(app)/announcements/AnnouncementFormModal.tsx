"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, Button, Input, Select, MultiSelect, Textarea } from "@/components/ui";
import { announcementSchema, type AnnouncementSchema } from "@/lib/schemas/announcement";
import {
  ANNOUNCEMENT_AUTHORS,
  ANNOUNCEMENT_CATEGORIES,
  AUDIENCE_OPTIONS,
  type Announcement,
} from "@/lib/api/announcements";

const emptyValues: AnnouncementSchema = {
  title: "",
  body: "",
  author: ANNOUNCEMENT_AUTHORS[0],
  audience: [...AUDIENCE_OPTIONS],
  category: ANNOUNCEMENT_CATEGORIES[0],
  pinned: false,
  views: 0,
};

interface AnnouncementFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode, absent = create mode. */
  record?: Announcement | null;
  saving?: boolean;
  onSubmit: (values: AnnouncementSchema) => Promise<void>;
}

export function AnnouncementFormModal({
  open,
  onOpenChange,
  record,
  saving,
  onSubmit,
}: AnnouncementFormModalProps) {
  const isEdit = Boolean(record);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<AnnouncementSchema>({
    resolver: zodResolver(announcementSchema),
    defaultValues: emptyValues,
  });

  // Repopulate on open so the previous record's values can't leak through.
  useEffect(() => {
    if (!open) return;
    reset(
      record
        ? {
            title: record.title,
            body: record.body,
            author: record.author,
            audience: [...record.audience],
            category: record.category,
            pinned: record.pinned,
            views: record.views,
          }
        : emptyValues
    );
  }, [open, record, reset]);

  const submit = handleSubmit(onSubmit);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={isEdit ? "Edit announcement" : "New announcement"}
      description={
        isEdit
          ? "Update this announcement. Changes are visible immediately."
          : "Broadcast a message. The title must be unique."
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Publish announcement"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Input
          label="Title"
          required
          placeholder="Annual Sports Day 2025"
          {...register("title")}
          error={errors.title?.message}
        />

        <Textarea
          label="Message"
          required
          rows={4}
          placeholder="Write the announcement as it should appear to readers…"
          {...register("body")}
          error={errors.body?.message}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Select
            label="Category"
            required
            options={ANNOUNCEMENT_CATEGORIES.map((c) => ({ label: c, value: c }))}
            {...register("category")}
            error={errors.category?.message}
          />
          <Select
            label="Posted by"
            required
            options={ANNOUNCEMENT_AUTHORS.map((a) => ({ label: a, value: a }))}
            {...register("author")}
            error={errors.author?.message}
          />
          <Input
            label="Views"
            type="number"
            min={0}
            {...register("views")}
            error={errors.views?.message}
          />
        </div>

        <Controller
          control={control}
          name="audience"
          render={({ field }) => (
            <MultiSelect
              label="Audience"
              required
              options={AUDIENCE_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              error={errors.audience?.message}
            />
          )}
        />

        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            {...register("pinned")}
            className="focus-ring size-4 cursor-pointer rounded-sm accent-primary"
          />
          <span className="text-sm text-text">Pin to the top of the feed</span>
        </label>

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}

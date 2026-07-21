"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, Button, Input, Select, MultiSelect, Textarea } from "@/components/ui";
import { noticeSchema, type NoticeSchema } from "@/lib/schemas/notice";
import {
  NOTICE_AUDIENCE_OPTIONS,
  NOTICE_CATEGORIES,
  NOTICE_DEPARTMENTS,
  NOTICE_PRIORITIES,
  formatNoticeDay,
  type Notice,
} from "@/lib/api/notices";

const emptyValues: NoticeSchema = {
  title: "",
  body: "",
  category: NOTICE_CATEGORIES[0],
  audience: [...NOTICE_AUDIENCE_OPTIONS],
  date: formatNoticeDay(new Date()),
  expiry: "",
  pinned: false,
  priority: "Medium",
  postedBy: NOTICE_DEPARTMENTS[0],
};

interface NoticeFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode, absent = create mode. */
  record?: Notice | null;
  saving?: boolean;
  onSubmit: (values: NoticeSchema) => Promise<void>;
}

export function NoticeFormModal({
  open,
  onOpenChange,
  record,
  saving,
  onSubmit,
}: NoticeFormModalProps) {
  const isEdit = Boolean(record);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<NoticeSchema>({
    resolver: zodResolver(noticeSchema),
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
            category: record.category,
            audience: [...record.audience],
            date: record.date,
            expiry: record.expiry,
            pinned: record.pinned,
            priority: record.priority,
            postedBy: record.postedBy,
          }
        : { ...emptyValues, date: formatNoticeDay(new Date()) }
    );
  }, [open, record, reset]);

  const submit = handleSubmit(onSubmit);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title={isEdit ? "Edit notice" : "Post notice"}
      description={
        isEdit
          ? "Update this notice. Changes appear on the board immediately."
          : "Publish an official notice. The title must be unique."
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Post notice"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Input
          label="Title"
          required
          placeholder="Mid-Term Exam Schedule"
          {...register("title")}
          error={errors.title?.message}
        />

        <Textarea
          label="Notice text"
          required
          rows={4}
          placeholder="Write the notice as it should appear on the board…"
          {...register("body")}
          error={errors.body?.message}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Category"
            required
            options={NOTICE_CATEGORIES.map((c) => ({ label: c, value: c }))}
            {...register("category")}
            error={errors.category?.message}
          />
          <Select
            label="Priority"
            required
            options={NOTICE_PRIORITIES.map((p) => ({ label: p, value: p }))}
            {...register("priority")}
            error={errors.priority?.message}
          />
          <Select
            label="Posted by"
            required
            options={NOTICE_DEPARTMENTS.map((d) => ({ label: d, value: d }))}
            {...register("postedBy")}
            error={errors.postedBy?.message}
          />
          <Input
            label="Posted on"
            required
            placeholder="16 Jul 2025"
            {...register("date")}
            error={errors.date?.message}
          />
          <Input
            label="Expires on"
            required
            placeholder="28 Jul 2025"
            {...register("expiry")}
            error={errors.expiry?.message}
          />
        </div>

        <Controller
          control={control}
          name="audience"
          render={({ field }) => (
            <MultiSelect
              label="Audience"
              required
              options={NOTICE_AUDIENCE_OPTIONS}
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
          <span className="text-sm text-text">Pin to the top of the board</span>
        </label>

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}

"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, Button, Input, Select } from "@/components/ui";
import { bookSchema, type BookSchema } from "@/lib/schemas/book";
import { CATEGORY_OPTIONS, type Book } from "@/lib/api/books";

const emptyValues: BookSchema = {
  title: "",
  author: "",
  category: CATEGORY_OPTIONS[0],
  isbn: "",
  publisher: "",
  year: new Date().getFullYear(),
  total: 1,
  available: 1,
};

interface BookFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present = edit mode, absent = create mode. */
  record?: Book | null;
  saving?: boolean;
  onSubmit: (values: BookSchema) => Promise<void>;
}

export function BookFormModal({
  open,
  onOpenChange,
  record,
  saving,
  onSubmit,
}: BookFormModalProps) {
  const isEdit = Boolean(record);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BookSchema>({
    resolver: zodResolver(bookSchema),
    defaultValues: emptyValues,
  });

  // Repopulate on open so the previous record's values can't leak through.
  useEffect(() => {
    if (!open) return;
    reset(
      record
        ? {
            title: record.title,
            author: record.author,
            category: record.category,
            isbn: record.isbn,
            publisher: record.publisher,
            year: record.year,
            total: record.total,
            available: record.available,
          }
        : emptyValues
    );
  }, [open, record, reset]);

  const submit = handleSubmit(onSubmit);

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Edit book" : "Add new book"}
      description={
        isEdit
          ? "Update this catalog entry. Changes apply immediately."
          : "Add a book to the catalog. The ISBN must be unique."
      }
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add book"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              label="Title"
              required
              placeholder="Mathematics NCERT Class 10"
              {...register("title")}
              error={errors.title?.message}
            />
          </div>
          <Input label="Author" required placeholder="NCERT" {...register("author")} error={errors.author?.message} />
          <Select
            label="Category"
            required
            options={CATEGORY_OPTIONS.map((c) => ({ label: c, value: c }))}
            {...register("category")}
            error={errors.category?.message}
          />
          <Input label="ISBN" required placeholder="978-81-7450-001-1" {...register("isbn")} error={errors.isbn?.message} />
          <Input label="Publisher" required placeholder="NCERT" {...register("publisher")} error={errors.publisher?.message} />
          <Input label="Year" type="number" min={1800} max={2100} {...register("year")} error={errors.year?.message} />
          <Input label="Total copies" type="number" min={0} {...register("total")} error={errors.total?.message} />
          <Input
            label="Available copies"
            type="number"
            min={0}
            {...register("available")}
            error={errors.available?.message}
          />
        </div>

        {/* Enables Enter-to-submit without duplicating the footer button. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}

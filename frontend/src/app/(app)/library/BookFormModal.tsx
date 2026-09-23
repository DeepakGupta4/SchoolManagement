"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, Button, Input } from "@/components/ui";
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
  /** Existing books — used to block a duplicate ISBN. */
  existing?: Book[];
  saving?: boolean;
  onSubmit: (values: BookSchema) => Promise<void>;
}

export function BookFormModal({
  open,
  onOpenChange,
  record,
  existing = [],
  saving,
  onSubmit,
}: BookFormModalProps) {
  const isEdit = Boolean(record);
  const [dupError, setDupError] = useState<string | null>(null);

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
    // Deferred: clearing the duplicate error synchronously in an effect trips
    // the react-hooks/set-state-in-effect rule.
    const t = setTimeout(() => setDupError(null), 0);
    return () => clearTimeout(t);
  }, [open, record, reset]);

  // Case-insensitive set of ISBNs already taken by *other* books.
  const takenIsbns = useMemo(() => {
    const set = new Set<string>();
    for (const b of existing) {
      if (record && b.id === record.id) continue;
      set.add(b.isbn.trim().toLowerCase());
    }
    return set;
  }, [existing, record]);

  // Block a duplicate ISBN before it reaches the server.
  const submit = handleSubmit((values) => {
    const isbn = values.isbn.trim();
    if (takenIsbns.has(isbn.toLowerCase())) {
      setDupError(`ISBN "${isbn}" is already in the catalog.`);
      return;
    }
    setDupError(null);
    return onSubmit({ ...values, isbn });
  });

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

          {/* Category — pick a preset or type a custom one. */}
          <Input
            label="Category"
            required
            list="book-categories"
            placeholder="Pick or type — e.g. Textbook"
            {...register("category")}
            error={errors.category?.message}
          />
          <datalist id="book-categories">
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>

          <Input
            label="ISBN"
            required
            placeholder="978-81-7450-001-1"
            {...register("isbn")}
            error={errors.isbn?.message ?? dupError ?? undefined}
          />
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

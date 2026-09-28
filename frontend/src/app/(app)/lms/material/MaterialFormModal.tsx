"use client";

import { useEffect, useRef, useState } from "react";
import { Controller, useForm, useWatch, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Upload, X } from "lucide-react";
import { Modal, Button, Input, MultiSelect, Select, Textarea, useToast } from "@/components/ui";
import { Field } from "@/components/ui/Input";
import { useClassOptions } from "@/hooks/useClassOptions";
import { useSubjectOptions } from "@/hooks/useSubjectOptions";
import { listTeachers } from "@/lib/api/teachers";
import { teacherName } from "@/types/teacher";
import { readFileAsDataUrl } from "@/lib/image";
import { MAX_DOC_BYTES } from "@/lib/api/documents";
import { materialSchema, type MaterialSchema } from "@/lib/schemas/material";
import { TAG_OPTIONS, TYPE_OPTIONS, VISIBILITY_OPTIONS, type Material } from "@/lib/api/studyMaterial";

const today = () =>
  new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

/** Human-readable file size from a byte count, e.g. "12.4 MB". */
function formatBytes(n: number): string {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/** File picker `accept` filter driven by the chosen material type. */
function acceptFor(type: string): string {
  switch (type) {
    case "pdf":
      return "application/pdf,.pdf";
    case "video":
      return "video/*";
    case "notes":
      return "application/pdf,.pdf,image/*,.txt,.md,.doc,.docx,.ppt,.pptx";
    default:
      return "";
  }
}

/** Per-type copy for the upload / link controls. */
const RESOURCE_COPY: Record<string, { fileLabel: string; linkLabel: string; linkHint: string }> = {
  pdf: { fileLabel: "Upload PDF", linkLabel: "PDF link", linkHint: "Link to a hosted PDF." },
  video: {
    fileLabel: "Upload video",
    linkLabel: "Video link",
    linkHint: "YouTube, Google Drive or any share URL.",
  },
  notes: {
    fileLabel: "Upload file",
    linkLabel: "Link",
    linkHint: "Link to notes — Drive, Docs or a web page.",
  },
};
const RESOURCE_FALLBACK = {
  fileLabel: "Upload file",
  linkLabel: "Resource link",
  linkHint: "Drive, YouTube or PDF URL.",
};

const emptyValues: MaterialSchema = {
  title: "",
  type: "",
  subject: "",
  klass: "",
  uploader: "",
  uploaded: today(),
  sizeMb: 0,
  sizeLabel: "",
  downloads: 0,
  visibility: "draft",
  description: "",
  tags: [],
  url: "",
  fileDataUrl: "",
  fileName: "",
  mimeType: "",
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
  const { toast } = useToast();
  const [teacherNames, setTeacherNames] = useState<string[]>([]);
  const [reading, setReading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm<MaterialSchema>({
    // zodResolver's input vs output typing can diverge from useForm's single
    // form-value type; the cast reconciles them. Values are always seeded from
    // emptyValues, so every field is present at runtime.
    resolver: zodResolver(materialSchema) as unknown as Resolver<MaterialSchema>,
    defaultValues: emptyValues,
  });

  // useWatch (not watch) so the React Compiler can still optimise this component.
  const type = useWatch({ control, name: "type" });
  const fileDataUrl = useWatch({ control, name: "fileDataUrl" });
  const fileName = useWatch({ control, name: "fileName" });
  const sizeLabel = useWatch({ control, name: "sizeLabel" });

  const copy = RESOURCE_COPY[type] ?? RESOURCE_FALLBACK;

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
        ? {
            ...emptyValues,
            ...record,
            url: record.url ?? "",
            fileDataUrl: record.fileDataUrl ?? "",
            fileName: record.fileName ?? "",
            mimeType: record.mimeType ?? "",
            sizeLabel: record.sizeLabel ?? "",
          }
        : { ...emptyValues, uploaded: today() }
    );
    // Deferred: clearing this synchronously in an effect trips the
    // react-hooks/set-state-in-effect rule.
    const t = setTimeout(() => setFileError(null), 0);
    return () => clearTimeout(t);
  }, [open, record, reset]);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setFileError(null);

    // Type-specific guards give a clear reason before we bother reading the file.
    if (type === "pdf" && file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) {
      setFileError("That's not a PDF. Choose a .pdf file or paste a link instead.");
      return;
    }
    if (type === "video" && !file.type.startsWith("video/")) {
      setFileError("That's not a video. Choose a video file or paste a link instead.");
      return;
    }
    if (file.size > MAX_DOC_BYTES) {
      const msg =
        type === "video"
          ? "This video is over the 3.5 MB upload limit. Paste a share link instead."
          : "File is over the 3.5 MB upload limit. Choose a smaller file or paste a link.";
      setFileError(msg);
      toast({ title: "File is too large", description: msg, variant: "error" });
      return;
    }

    setReading(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      // Size is captured automatically — never typed by the user.
      setValue("fileDataUrl", dataUrl, { shouldDirty: true, shouldValidate: true });
      setValue("fileName", file.name, { shouldDirty: true });
      setValue("mimeType", file.type, { shouldDirty: true });
      setValue("sizeMb", Number((file.size / (1024 * 1024)).toFixed(2)), { shouldDirty: true });
      setValue("sizeLabel", formatBytes(file.size), { shouldDirty: true });
      // A file satisfies the "file or link" rule, so drop any stale link error.
      clearErrors("url");
    } catch (e) {
      setFileError(e instanceof Error ? e.message : "Could not read the file.");
    } finally {
      setReading(false);
    }
  };

  const clearFile = () => {
    setValue("fileDataUrl", "", { shouldDirty: true, shouldValidate: true });
    setValue("fileName", "", { shouldDirty: true });
    setValue("mimeType", "", { shouldDirty: true });
    setValue("sizeLabel", "", { shouldDirty: true });
    setValue("sizeMb", 0, { shouldDirty: true });
    setFileError(null);
  };

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
          <Button onClick={submit} disabled={saving || reading}>
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

        {/* Resource: EITHER an uploaded file OR a link. Size is auto-captured. */}
        <Field
          label="Resource"
          required
          error={errors.url?.message}
          hint={
            errors.url?.message
              ? undefined
              : "Upload a file or paste a link — at least one is required. Uploads must be under 3.5 MB."
          }
        >
          <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface-sunken/40 p-3">
            {fileDataUrl ? (
              <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2">
                <FileText className="size-4 shrink-0 text-subtle" />
                <span className="min-w-0 flex-1 truncate text-sm text-text">
                  {fileName || "Uploaded file"}
                </span>
                {sizeLabel ? (
                  <span className="shrink-0 text-xs text-subtle">{sizeLabel}</span>
                ) : null}
                <button
                  type="button"
                  onClick={clearFile}
                  aria-label="Remove file"
                  className="focus-ring rounded-md p-1 text-subtle transition-colors hover:text-danger"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={reading}
                className="focus-ring flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border-strong bg-surface px-4 py-3 text-sm text-muted transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Upload className="size-4 text-subtle" />
                {reading ? "Reading…" : copy.fileLabel}
              </button>
            )}
            <input
              ref={inputRef}
              type="file"
              accept={acceptFor(type)}
              className="sr-only"
              onChange={(e) => {
                handleFile(e.target.files?.[0]);
                e.target.value = ""; // allow re-selecting the same file
              }}
            />
            {fileError ? <p className="text-xs text-danger">{fileError}</p> : null}
            {type === "video" && !fileDataUrl ? (
              <p className="text-xs text-subtle">
                Large videos won&apos;t fit the 3.5 MB upload limit — paste a share link instead.
              </p>
            ) : null}

            <div className="flex items-center gap-3 text-xs text-subtle">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>

            <Input
              aria-label={copy.linkLabel}
              placeholder="https://…"
              hint={copy.linkHint}
              {...register("url")}
            />
          </div>
        </Field>

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

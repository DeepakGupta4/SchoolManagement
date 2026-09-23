"use client";

import { useRef } from "react";
import { FileText, Paperclip, X } from "lucide-react";
import { useToast } from "@/components/ui";
import { Field } from "@/components/ui/Input";
import { MAX_DOC_BYTES } from "@/lib/api/documents";

/**
 * A labelled single-file picker (e.g. "Government ID"). The parent holds the
 * `File | null` and uploads it once the record is saved. Used for the required
 * documents on the teacher form.
 */
export function SingleDocField({
  label,
  required,
  file,
  onChange,
  error,
  hint,
  accept = "image/*,application/pdf",
}: {
  label: string;
  required?: boolean;
  file: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  hint?: string;
  accept?: string;
}) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const pick = (list: FileList | null) => {
    const f = list?.[0];
    if (!f) return;
    if (f.size > MAX_DOC_BYTES) {
      toast({ title: "File is too large", description: "Each file must be under 3.5 MB.", variant: "error" });
      return;
    }
    onChange(f);
  };

  return (
    <Field label={label} required={required} error={error} hint={!file ? hint : undefined}>
      {file ? (
        <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
          <FileText className="size-4 shrink-0 text-subtle" />
          <span className="min-w-0 flex-1 truncate text-sm text-text">{file.name}</span>
          <span className="shrink-0 text-xs text-subtle">{Math.round(file.size / 1024)} KB</span>
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label={`Remove ${file.name}`}
            className="focus-ring rounded-md p-1 text-subtle transition-colors hover:text-danger"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="focus-ring flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border-strong bg-surface-sunken px-4 py-3 text-sm text-muted transition-colors hover:bg-surface-hover"
        >
          <Paperclip className="size-4 text-subtle" />
          Upload {label.toLowerCase()}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => {
          pick(e.target.files);
          e.target.value = "";
        }}
      />
    </Field>
  );
}

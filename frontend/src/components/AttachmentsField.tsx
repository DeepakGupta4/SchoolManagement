"use client";

import { useRef } from "react";
import { FileText, Paperclip, X } from "lucide-react";
import { useToast } from "@/components/ui";
import { MAX_DOC_BYTES } from "@/lib/api/documents";

/**
 * A controlled list of files to attach when creating/editing a person. The
 * parent holds the `File[]` and uploads them (via uploadDocumentFiles) once the
 * record is saved and an id exists. Purely client-side until then.
 */
export function AttachmentsField({
  files,
  onChange,
  hint,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  hint?: string;
}) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const add = (list: FileList | null) => {
    if (!list) return;
    const picked = Array.from(list);
    const tooBig = picked.filter((f) => f.size > MAX_DOC_BYTES);
    if (tooBig.length) {
      toast({ title: "Some files are too large", description: "Each file must be under 3.5 MB.", variant: "error" });
    }
    onChange([...files, ...picked.filter((f) => f.size <= MAX_DOC_BYTES)]);
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="focus-ring flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border-strong bg-surface-sunken px-4 py-4 text-sm text-muted transition-colors hover:bg-surface-hover"
      >
        <Paperclip className="size-4 text-subtle" />
        Attach documents (Aadhaar, certificates…)
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="sr-only"
        onChange={(e) => {
          add(e.target.files);
          e.target.value = "";
        }}
      />
      {hint && files.length === 0 && <p className="text-xs text-subtle">{hint}</p>}

      {files.length > 0 && (
        <ul className="flex flex-col divide-y divide-border rounded-md border border-border">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center gap-2 px-3 py-2">
              <FileText className="size-4 shrink-0 text-subtle" />
              <span className="min-w-0 flex-1 truncate text-sm text-text">{f.name}</span>
              <span className="shrink-0 text-xs text-subtle">{Math.round(f.size / 1024)} KB</span>
              <button
                type="button"
                onClick={() => onChange(files.filter((_, idx) => idx !== i))}
                aria-label={`Remove ${f.name}`}
                className="focus-ring rounded-md p-1 text-subtle transition-colors hover:text-danger"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

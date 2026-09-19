"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Loader2, Upload, X } from "lucide-react";
import { Modal, Button, Select, useToast } from "@/components/ui";
import { listStudents } from "@/lib/api/students";
import { fullName, type Student } from "@/types/student";
import { readFileAsDataUrl } from "@/lib/image";
import { uploadDocument } from "@/lib/api/documents";

const MAX_BYTES = 3.5 * 1024 * 1024;

interface BulkUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful upload so the parent can refresh if needed. */
  onUploaded?: () => void;
}

/**
 * Upload one or more document files to a chosen student. Files are stored on
 * that student's record and appear on their profile's Documents card.
 */
export function BulkUploadModal({ open, onOpenChange, onUploaded }: BulkUploadModalProps) {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [studentId, setStudentId] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    listStudents()
      .then((all) => !cancelled && setStudents(all))
      .catch(() => !cancelled && setStudents([]));
    // Reset selections each open.
    const t = setTimeout(() => {
      setStudentId("");
      setFiles([]);
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [open]);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const picked = Array.from(list);
    const tooBig = picked.filter((f) => f.size > MAX_BYTES);
    if (tooBig.length) {
      toast({ title: "Some files are too large", description: "Each file must be under 3.5 MB.", variant: "error" });
    }
    setFiles((prev) => [...prev, ...picked.filter((f) => f.size <= MAX_BYTES)]);
  };

  const removeFile = (i: number) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const student = students.find((s) => s.id === studentId);

  const handleUpload = async () => {
    if (!student || files.length === 0) return;
    setBusy(true);
    let ok = 0;
    try {
      for (const file of files) {
        const dataUrl = await readFileAsDataUrl(file);
        await uploadDocument({
          ownerType: "student",
          ownerId: student.id,
          ownerName: fullName(student),
          title: file.name.replace(/\.[^.]+$/, ""),
          fileName: file.name,
          mimeType: file.type,
          dataUrl,
          size: file.size,
        });
        ok += 1;
      }
      toast({
        title: "Documents uploaded",
        description: `${ok} file${ok === 1 ? "" : "s"} added to ${fullName(student)}.`,
      });
      onUploaded?.();
      onOpenChange(false);
    } catch (e) {
      toast({
        title: ok > 0 ? `Uploaded ${ok}, then failed` : "Upload failed",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Upload documents"
      description="Pick a student, then add one or more files (PDF or image, under 3.5 MB each)."
      footer={
        <>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={busy || !student || files.length === 0}>
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {busy ? "Uploading…" : `Upload ${files.length || ""}`.trim()}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Select
          label="Student"
          required
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          placeholder="Select a student"
          options={students.map((s) => ({
            label: `${fullName(s)} · ${s.className}-${s.section} · ${s.admissionNo}`,
            value: s.id,
          }))}
        />

        <div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="focus-ring flex w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border-strong bg-surface-sunken px-4 py-6 text-sm text-muted transition-colors hover:bg-surface-hover"
          >
            <Upload className="size-5 text-subtle" />
            Click to choose files
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="sr-only"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        {files.length > 0 && (
          <ul className="flex flex-col divide-y divide-border rounded-md border border-border">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="flex items-center gap-2 px-3 py-2">
                <FileText className="size-4 shrink-0 text-subtle" />
                <span className="min-w-0 flex-1 truncate text-sm text-text">{f.name}</span>
                <span className="shrink-0 text-xs text-subtle">{Math.round(f.size / 1024)} KB</span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
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
    </Modal>
  );
}

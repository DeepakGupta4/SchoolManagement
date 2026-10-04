"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, FileText, Loader2, ShieldCheck, Trash2, Upload, X } from "lucide-react";
import { Modal, Button, Badge, useToast } from "@/components/ui";
import { cn } from "@/lib/utils";
import { readFileAsDataUrl } from "@/lib/image";
import {
  deleteDocument,
  listDocuments,
  setDocumentVerified,
  uploadDocument,
  MAX_DOC_BYTES,
  type StoredDoc,
} from "@/lib/api/documents";

/** The tracked vault slots. `match` maps older docs (no docType) by title. */
export const DOC_SLOTS = [
  { key: "birthCert", label: "Birth Certificate", match: /birth/i },
  { key: "aadhaar", label: "Aadhaar / Government ID", match: /aadhaar|government id|govt/i },
  { key: "tc", label: "Transfer Certificate", match: /transfer|leaving|\btc\b/i },
  { key: "marksheets", label: "Marksheets / Report Card", match: /marksheet|mark sheet|result|report card/i },
  { key: "photo", label: "Photograph", match: /photo|photograph/i },
] as const;

export interface ManagedStudent {
  id: string;
  name: string;
  avatar?: string;
}

interface ManageDocumentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: ManagedStudent | null;
  /** Called after any change so the vault overview can refresh. */
  onChanged?: () => void;
}

export function ManageDocumentsModal({ open, onOpenChange, student, onChanged }: ManageDocumentsModalProps) {
  const { toast } = useToast();
  const [docs, setDocs] = useState<StoredDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const load = useCallback(() => {
    if (!student) return;
    setLoading(true);
    listDocuments("student", student.id)
      .then(setDocs)
      .catch(() => setDocs([]))
      .finally(() => setLoading(false));
  }, [student]);

  useEffect(() => {
    if (!open || !student) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [open, student, load]);

  const docForSlot = (slot: (typeof DOC_SLOTS)[number]) =>
    docs.find((d) => d.docType === slot.key || (!d.docType && slot.match.test(d.title)));

  const handleUpload = async (slot: (typeof DOC_SLOTS)[number], file: File | undefined) => {
    if (!student || !file) return;
    if (file.size > MAX_DOC_BYTES) {
      toast({ title: "File too large", description: "Each file must be under 3.5 MB.", variant: "error" });
      return;
    }
    setBusyKey(slot.key);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      await uploadDocument({
        ownerType: "student",
        ownerId: student.id,
        ownerName: student.name,
        title: slot.label,
        docType: slot.key,
        fileName: file.name,
        mimeType: file.type,
        dataUrl,
        size: file.size,
      });
      toast({ title: "Uploaded", description: `${slot.label} added for ${student.name}.` });
      load();
      onChanged?.();
    } catch (e) {
      toast({ title: "Upload failed", description: e instanceof Error ? e.message : "Please try again.", variant: "error" });
    } finally {
      setBusyKey(null);
    }
  };

  const handleVerify = async (doc: StoredDoc, verified: boolean, key: string) => {
    setBusyKey(key);
    try {
      await setDocumentVerified(doc.id, verified);
      load();
      onChanged?.();
    } catch {
      toast({ title: "Couldn't update", description: "Please try again.", variant: "error" });
    } finally {
      setBusyKey(null);
    }
  };

  const handleDelete = async (doc: StoredDoc, key: string) => {
    setBusyKey(key);
    try {
      await deleteDocument(doc.id);
      load();
      onChanged?.();
    } catch {
      toast({ title: "Couldn't delete", description: "Please try again.", variant: "error" });
    } finally {
      setBusyKey(null);
    }
  };

  const view = (doc: StoredDoc) => {
    const w = window.open();
    if (w) w.document.write(`<iframe src="${doc.dataUrl}" style="border:0;width:100%;height:100%"></iframe>`);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={student ? `Documents — ${student.name}` : "Documents"}
      description="Upload each required document, then verify it against the original. Files under 3.5 MB (PDF or image)."
      size="lg"
      footer={
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Done
        </Button>
      }
    >
      {loading ? (
        <div className="grid place-items-center py-12 text-muted">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-md border border-border">
          {DOC_SLOTS.map((slot) => {
            const doc = docForSlot(slot);
            const isPhotoViaAvatar = slot.key === "photo" && !doc && Boolean(student?.avatar);
            const busy = busyKey === slot.key;
            const state = doc ? (doc.verified ? "verified" : "pending") : isPhotoViaAvatar ? "verified" : "missing";
            return (
              <li key={slot.key} className="flex flex-wrap items-center gap-3 px-3 py-3">
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <FileText className="size-4 shrink-0 text-subtle" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text">{slot.label}</p>
                    <p className="truncate text-xs text-subtle">
                      {doc
                        ? doc.fileName || "Uploaded file"
                        : isPhotoViaAvatar
                          ? "Profile photo on file"
                          : "Not uploaded"}
                    </p>
                  </div>
                </div>

                <Badge
                  variant={state === "verified" ? "success" : state === "pending" ? "warning" : "danger"}
                  className="shrink-0 capitalize"
                >
                  {state}
                </Badge>

                <div className="flex shrink-0 items-center gap-1">
                  {busy && <Loader2 className="size-4 animate-spin text-subtle" />}

                  {doc && (
                    <>
                      <button
                        type="button"
                        onClick={() => view(doc)}
                        title="View / download"
                        aria-label={`View ${slot.label}`}
                        className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
                      >
                        <Eye className="size-4" />
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleVerify(doc, !doc.verified, slot.key)}
                        title={doc.verified ? "Mark as not verified" : "Mark verified"}
                        aria-label={doc.verified ? `Un-verify ${slot.label}` : `Verify ${slot.label}`}
                        className={cn(
                          "focus-ring rounded-md p-1.5 transition-colors disabled:opacity-40",
                          doc.verified
                            ? "text-success hover:bg-success-soft"
                            : "text-subtle hover:bg-surface-hover hover:text-text"
                        )}
                      >
                        <ShieldCheck className="size-4" />
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleDelete(doc, slot.key)}
                        title="Delete"
                        aria-label={`Delete ${slot.label}`}
                        className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-danger-soft hover:text-danger disabled:opacity-40"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </>
                  )}

                  {!doc && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busy}
                        onClick={() => inputRefs.current[slot.key]?.click()}
                      >
                        <Upload className="size-4" />
                        {isPhotoViaAvatar ? "Replace" : "Upload"}
                      </Button>
                      <input
                        ref={(el) => {
                          inputRefs.current[slot.key] = el;
                        }}
                        type="file"
                        accept=".pdf,image/*"
                        className="sr-only"
                        onChange={(e) => {
                          handleUpload(slot, e.target.files?.[0]);
                          e.target.value = "";
                        }}
                      />
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Any extra (untracked) documents on file. */}
      {!loading && docs.some((d) => !DOC_SLOTS.some((s) => d.docType === s.key || (!d.docType && s.match.test(d.title)))) && (
        <div className="mt-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-subtle">Other files</p>
          <ul className="flex flex-col divide-y divide-border rounded-md border border-border">
            {docs
              .filter((d) => !DOC_SLOTS.some((s) => d.docType === s.key || (!d.docType && s.match.test(d.title))))
              .map((d) => (
                <li key={d.id} className="flex items-center gap-2 px-3 py-2">
                  <FileText className="size-4 shrink-0 text-subtle" />
                  <span className="min-w-0 flex-1 truncate text-sm text-text">{d.title || d.fileName}</span>
                  <button
                    type="button"
                    onClick={() => view(d)}
                    aria-label={`View ${d.title}`}
                    className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
                  >
                    <Eye className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(d, d.id)}
                    aria-label={`Delete ${d.title}`}
                    className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-danger-soft hover:text-danger"
                  >
                    <X className="size-3.5" />
                  </button>
                </li>
              ))}
          </ul>
        </div>
      )}
    </Modal>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Download, Eye, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { Badge, Card, CardContent, CardHeader, ConfirmDialog, useToast } from "@/components/ui";
import { readFileAsDataUrl } from "@/lib/image";
import {
  listDocuments,
  uploadDocument,
  deleteDocument,
  type StoredDoc,
  type DocumentOwnerType,
} from "@/lib/api/documents";

// Max original file size. The API body cap is 5 MB and base64 adds ~33%, so we
// keep the raw file comfortably under that.
const MAX_BYTES = 3.5 * 1024 * 1024;

function formatBytes(n: number): string {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/** Turns a base64 data URL back into a Blob so it can be opened/downloaded. */
function dataUrlToBlob(dataUrl: string): Blob {
  const [meta, b64] = dataUrl.split(",");
  const mime = /:(.*?);/.exec(meta)?.[1] ?? "application/octet-stream";
  const bytes = atob(b64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

function openDoc(doc: StoredDoc) {
  const url = URL.createObjectURL(dataUrlToBlob(doc.dataUrl));
  window.open(url, "_blank", "noopener,noreferrer");
  // Give the new tab time to load before releasing the object URL.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

function downloadDoc(doc: StoredDoc) {
  const url = URL.createObjectURL(dataUrlToBlob(doc.dataUrl));
  const a = document.createElement("a");
  a.href = url;
  a.download = doc.fileName || `${doc.title}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

interface DocumentsCardProps {
  ownerType: DocumentOwnerType;
  ownerId: string;
  ownerName: string;
  /** Hide upload/delete for read-only viewers. */
  canEdit?: boolean;
}

export function DocumentsCard({ ownerType, ownerId, ownerName, canEdit = true }: DocumentsCardProps) {
  const { toast } = useToast();
  const [docs, setDocs] = useState<StoredDoc[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<StoredDoc | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listDocuments(ownerType, ownerId)
      .then((d) => !cancelled && setDocs(d))
      .catch(() => !cancelled && setDocs([]));
    return () => {
      cancelled = true;
    };
  }, [ownerType, ownerId]);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      toast({
        title: "File too large",
        description: `Please choose a file under ${formatBytes(MAX_BYTES)}.`,
        variant: "error",
      });
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const title = file.name.replace(/\.[^.]+$/, "");
      const created = await uploadDocument({
        ownerType,
        ownerId,
        ownerName,
        title,
        fileName: file.name,
        mimeType: file.type,
        dataUrl,
        size: file.size,
      });
      setDocs((prev) => [created, ...(prev ?? [])]);
      toast({ title: "Document uploaded", description: file.name });
    } catch (e) {
      toast({
        title: "Upload failed",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteDocument(pendingDelete.id);
      setDocs((prev) => (prev ?? []).filter((d) => d.id !== pendingDelete.id));
      toast({ title: "Document removed", description: pendingDelete.title });
      setPendingDelete(null);
    } catch {
      toast({ title: "Could not delete", variant: "error" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-text">Documents</h2>
          {docs && <Badge variant="default">{docs.length}</Badge>}
        </div>
        {canEdit && (
          <label>
            <span className="focus-ring inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text transition-colors hover:border-border-strong hover:bg-surface-hover">
              {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />}
              {uploading ? "Uploading…" : "Upload"}
            </span>
            <input
              type="file"
              className="sr-only"
              disabled={uploading}
              onChange={(e) => {
                handleFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </CardHeader>

      <CardContent>
        {docs === null ? (
          <p className="py-6 text-center text-sm text-muted">Loading…</p>
        ) : docs.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            No documents yet.{canEdit ? " Use Upload to add certificates, marksheets or ID proofs." : ""}
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {docs.map((doc) => (
              <li key={doc.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary-text">
                  <FileText className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text">{doc.title}</p>
                  <p className="truncate text-xs text-subtle">
                    {doc.fileName}
                    {doc.size ? ` · ${formatBytes(doc.size)}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => openDoc(doc)}
                    title="View in new tab"
                    aria-label={`View ${doc.title}`}
                    className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
                  >
                    <Eye className="size-4" />
                  </button>
                  <button
                    onClick={() => downloadDoc(doc)}
                    title="Download"
                    aria-label={`Download ${doc.title}`}
                    className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
                  >
                    <Download className="size-4" />
                  </button>
                  {canEdit && (
                    <button
                      onClick={() => setPendingDelete(doc)}
                      title="Delete"
                      aria-label={`Delete ${doc.title}`}
                      className="focus-ring rounded-md p-1.5 text-subtle transition-colors hover:bg-danger-soft hover:text-danger"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete document?"
        description={pendingDelete ? `"${pendingDelete.title}" will be permanently removed.` : ""}
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />
    </Card>
  );
}

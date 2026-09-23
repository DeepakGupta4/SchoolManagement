import { apiRequest } from "./client";

export type DocumentOwnerType = "student" | "teacher" | "staff";

export interface StoredDoc {
  id: string;
  ownerType: DocumentOwnerType;
  ownerId: string;
  ownerName: string;
  title: string;
  fileName: string;
  mimeType: string;
  dataUrl: string;
  size: number;
  createdAt: string;
}

export interface UploadDocumentInput {
  ownerType: DocumentOwnerType;
  ownerId: string;
  ownerName: string;
  title: string;
  fileName: string;
  mimeType: string;
  dataUrl: string;
  size: number;
}

export function listDocuments(ownerType: DocumentOwnerType, ownerId: string) {
  return apiRequest<StoredDoc[]>("/api/documents", { query: { ownerType, ownerId } });
}

export function uploadDocument(input: UploadDocumentInput) {
  return apiRequest<StoredDoc>("/api/documents", { method: "POST", body: input });
}

export function deleteDocument(id: string) {
  return apiRequest<void>(`/api/documents/${id}`, { method: "DELETE" });
}

// Re-exported so form modals can read a File without importing from lib/image.
import { readFileAsDataUrl } from "@/lib/image";

/** Max original file size (API body cap is 5 MB; base64 adds ~33%). */
export const MAX_DOC_BYTES = 3.5 * 1024 * 1024;

/**
 * Uploads a single file under an explicit title (e.g. "Government ID"), so a
 * required document is identifiable later on the profile. Best-effort: returns
 * whether it succeeded and never throws.
 */
export async function uploadLabeledDocument(
  ownerType: DocumentOwnerType,
  ownerId: string,
  ownerName: string,
  title: string,
  file: File
): Promise<boolean> {
  try {
    const dataUrl = await readFileAsDataUrl(file);
    await uploadDocument({
      ownerType,
      ownerId,
      ownerName,
      title,
      fileName: file.name,
      mimeType: file.type,
      dataUrl,
      size: file.size,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Uploads a batch of picked files as documents for one owner. Best-effort:
 * returns how many succeeded, and never throws (so a form save isn't lost if
 * one attachment fails).
 */
export async function uploadDocumentFiles(
  ownerType: DocumentOwnerType,
  ownerId: string,
  ownerName: string,
  files: File[]
): Promise<{ uploaded: number; failed: number }> {
  let uploaded = 0;
  let failed = 0;
  for (const file of files) {
    try {
      const dataUrl = await readFileAsDataUrl(file);
      await uploadDocument({
        ownerType,
        ownerId,
        ownerName,
        title: file.name.replace(/\.[^.]+$/, ""),
        fileName: file.name,
        mimeType: file.type,
        dataUrl,
        size: file.size,
      });
      uploaded += 1;
    } catch {
      failed += 1;
    }
  }
  return { uploaded, failed };
}

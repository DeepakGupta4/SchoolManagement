import { apiRequest } from "./client";

export type DocumentOwnerType = "student" | "teacher";

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

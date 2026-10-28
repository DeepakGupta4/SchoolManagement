import { api } from "./client";

/** Homework = Assignment on the backend (fields: `class`, `due`, not className/dueDate). */
export interface Homework {
  id?: string;
  code?: string;
  title: string;
  subject?: string;
  class: string;
  teacher?: string;
  given?: string;
  due?: string;
  status?: string;
  description?: string;
  /** Inline base64 data URL (photo/PDF). Only returned on the DETAIL fetch. */
  fileDataUrl?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
}

export const listHomework = (klass?: string) =>
  api<Homework[]>(`/api/assignments?limit=200${klass ? `&class=${encodeURIComponent(klass)}` : ""}`);

export const getHomework = (id: string) => api<Homework>(`/api/assignments/${id}`);
export const createHomework = (body: Homework) => api<Homework>("/api/assignments", { method: "POST", body });
export const updateHomework = (id: string, body: Partial<Homework>) =>
  api<Homework>(`/api/assignments/${id}`, { method: "PUT", body });

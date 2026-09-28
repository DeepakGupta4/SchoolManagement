import { createApiResource } from "./createApiResource";

export interface Material {
  id: string;
  title: string;
  type: string;
  subject: string;
  klass: string;
  uploader: string;
  uploaded: string;
  sizeMb: number;
  downloads: number;
  visibility: string;
  description: string;
  tags: string[];
  /** Link to the resource (Drive/YouTube/PDF URL). Empty when a file is used instead. */
  url: string;
  /**
   * Uploaded file stored inline as a base64 data URL. A material is EITHER a
   * file OR a link — these fields are empty when a link is used. Optional so
   * older records (link-only) keep working.
   */
  fileDataUrl?: string;
  fileName?: string;
  mimeType?: string;
  /** Human-readable size captured from the uploaded file, e.g. "12.4 MB". */
  sizeLabel?: string;
}

export interface MaterialFilters {
  search?: string;
  type?: string;
  subject?: string;
  klass?: string;
}

export const TYPE_OPTIONS = [
  { label: "PDF", value: "pdf" },
  { label: "Video", value: "video" },
  { label: "Notes", value: "notes" },
];

export const VISIBILITY_OPTIONS = [
  { label: "Published", value: "published" },
  { label: "Draft", value: "draft" },
];

/** Curriculum tags used to group material across subjects. */
export const TAG_OPTIONS = [
  "Board exam",
  "Revision",
  "Homework",
  "Practical",
  "Reference",
];

export const studyMaterialApi = createApiResource<Material, MaterialFilters>(
  "/api/study-material"
);

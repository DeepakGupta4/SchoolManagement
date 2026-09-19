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
  /** Link to the resource (Drive/YouTube/PDF URL). Empty when none is attached. */
  url: string;
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

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

export const SUBJECT_OPTIONS = [
  "Accountancy", "Biology", "Chemistry", "Computer Science", "Electronics",
  "English", "French", "Hindi", "History", "Mathematics", "Physics", "Sanskrit",
];

export const CLASS_OPTIONS = ["VII", "VIII", "IX", "X", "XI", "XII"];

export const UPLOADER_OPTIONS = [
  "Dr. Priya Sharma", "Mr. Amit Joshi", "Mr. Naveen Chawla", "Mr. Rahul Verma",
  "Mr. Rakesh Yadav", "Mr. Suresh Kumar", "Ms. Anita Patel", "Ms. Deepa Nair",
  "Ms. Elena D'Souza", "Ms. Kavita Singh", "Ms. Lata Trivedi", "Ms. Meenakshi Rao",
  "Ms. Ritu Bansal",
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

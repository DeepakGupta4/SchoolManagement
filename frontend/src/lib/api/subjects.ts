import { createApiResource } from "./createApiResource";

export interface SchoolSubject {
  id: string;
  name: string;
  code: string;
  department: string;
  type: string;
}

export interface SubjectFilters {
  search?: string;
  department?: string;
  type?: string;
}

/** Academic departments a subject can belong to. */
export const SUBJECT_DEPARTMENT_OPTIONS = [
  "Science",
  "Mathematics",
  "Languages",
  "Social Studies",
  "Computer Science",
  "Commerce",
  "Arts",
  "Physical Education",
  "General",
];

export const SUBJECT_TYPE_OPTIONS = ["Core", "Elective", "Language", "Co-curricular"];

/** Suggests a short code from a subject name, e.g. "Social Science" → "SS". */
export function suggestSubjectCode(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  if (words.length > 1) return words.map((w) => w[0]).join("").toUpperCase().slice(0, 5);
  return words[0].replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase();
}

export const subjectsApi = createApiResource<SchoolSubject, SubjectFilters>("/api/subjects");

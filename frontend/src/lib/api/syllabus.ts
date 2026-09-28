import { createApiResource } from "./createApiResource";

export interface SyllabusChapter {
  id: string;
  className: string;
  subject: string;
  teacher: string;
  /** Academic year the chapter is tracked under, e.g. "2026-27". */
  academicYear: string;
  unit: string;
  chapter: string;
  topics: number;
  completedTopics: number;
  status: string;
  date: string;
}

export interface SyllabusFilters {
  search?: string;
  className?: string;
  subject?: string;
  academicYear?: string;
  status?: string;
  /** Row cap for the request; a class rarely has more chapters than this. */
  limit?: number;
}

export const STATUS_OPTIONS = ["completed", "in-progress", "pending"];

export const syllabusApi = createApiResource<SyllabusChapter, SyllabusFilters>("/api/syllabus");

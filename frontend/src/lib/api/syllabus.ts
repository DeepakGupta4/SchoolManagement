import { createApiResource } from "./createApiResource";

export interface SyllabusChapter {
  id: string;
  className: string;
  subject: string;
  teacher: string;
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
  status?: string;
}

export const STATUS_OPTIONS = ["completed", "in-progress", "pending"];

export const syllabusApi = createApiResource<SyllabusChapter, SyllabusFilters>("/api/syllabus");

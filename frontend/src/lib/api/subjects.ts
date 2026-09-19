import { createApiResource } from "./createApiResource";

export interface SchoolSubject {
  id: string;
  name: string;
  code: string;
  department: string;
}

export interface SubjectFilters {
  search?: string;
  department?: string;
}

export const subjectsApi = createApiResource<SchoolSubject, SubjectFilters>("/api/subjects");

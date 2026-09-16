import { createApiResource } from "./createApiResource";

export interface SchoolClass {
  id: string;
  name: string;
  sections: string[];
  stream: string;
  classTeacher: string;
  room: string;
  students: number;
  teachers: number;
}

export interface ClassFilters {
  search?: string;
  stream?: string;
}

export const STREAM_OPTIONS = ["General", "Science", "Commerce", "Arts", "Science/Commerce"];
export const SECTION_OPTIONS = ["A", "B", "C", "D"];

export const classesApi = createApiResource<SchoolClass, ClassFilters>("/api/classes");

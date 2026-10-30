import { api } from "./client";

export interface SchoolClass {
  id: string;
  name: string;
  sections: string[];
}

/** Classes + their sections — used to offer the section picker for a chosen class. */
export const listClasses = () => api<SchoolClass[]>("/api/classes?limit=200");

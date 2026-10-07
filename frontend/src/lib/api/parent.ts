import { apiRequest } from "./client";
import { createApiResource } from "./createApiResource";

export type ParentRelation = "Father" | "Mother" | "Guardian";

export interface Parent {
  id: string;
  name: string;
  relation: ParentRelation;
  phone: string;
  email: string;
  occupation: string;
  address: string;
  /**
   * Linked student ids — each is the `id` the students API returns (the Mongo
   * `_id`), used to resolve a parent's children live from the students data.
   */
  students: string[];
}

export interface ParentFilters {
  search?: string;
  relation?: string;
}

export const RELATION_OPTIONS: { label: string; value: ParentRelation }[] = [
  { label: "Father", value: "Father" },
  { label: "Mother", value: "Mother" },
  { label: "Guardian", value: "Guardian" },
];

export const parentApi = createApiResource<Parent, ParentFilters>("/api/parents");

export interface ParentChild {
  id: string;
  name: string;
  className: string;
  section: string;
}

/**
 * A directory row: parents DERIVED from students' guardian/father/mother data
 * (deduped by phone/email, with their children resolved server-side), merged with
 * any manually-added Parent records. `source: "manual"` rows are editable; `"student"`
 * rows are auto-derived and read-only (edit the student to change them).
 */
export interface ParentDirectoryEntry {
  id: string;
  name: string;
  relation: string;
  phone: string;
  email: string;
  occupation: string;
  address: string;
  source: "student" | "manual";
  /** Linked student ids. */
  students: string[];
  children: ParentChild[];
  childCount: number;
}

/** The populated parents directory (auto-derived from students + manual records). */
export async function getParentDirectory(): Promise<ParentDirectoryEntry[]> {
  return apiRequest<ParentDirectoryEntry[]>("/api/parents/directory");
}

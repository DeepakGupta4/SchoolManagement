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

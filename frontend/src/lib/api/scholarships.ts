import { createApiResource } from "./createApiResource";

export interface Scholarship {
  id: string;
  /** Human-facing scholarship code, e.g. "SCH001". Must stay unique. */
  code: string;
  student: string;
  class: string;
  type: string;
  percentage: number;
  amount: number;
  reason: string;
  status: string;
  since: string;
}

export interface ScholarshipFilters {
  search?: string;
  status?: string;
}

export const SCHOLARSHIP_TYPE_OPTIONS = ["Merit", "Need-Based", "Sports", "Cultural"];

export const SCHOLARSHIP_CLASS_OPTIONS = [
  "6-A",
  "6-B",
  "7-A",
  "7-B",
  "8-A",
  "8-B",
  "9-A",
  "9-B",
  "10-A",
  "10-B",
  "11-A",
  "11-B",
  "12-A",
  "12-B",
];

export const SCHOLARSHIP_STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Pending", value: "pending" },
  { label: "Expired", value: "expired" },
];

export const scholarshipsApi = createApiResource<Scholarship, ScholarshipFilters>(
  "/api/scholarships"
);

import { createApiResource } from "./createApiResource";

export interface StaffMember {
  id: string;
  /** Human-facing employee code, e.g. "ST001". Must stay unique. */
  employeeId: string;
  name: string;
  role: string;
  dept: string;
  type: string;
  status: string;
  phone: string;
  email: string;
  join: string;
  salary: number;
}

export interface StaffFilters {
  search?: string;
  dept?: string;
  type?: string;
  status?: string;
}

export const STAFF_DEPT_OPTIONS = [
  "Administration",
  "Finance",
  "HR",
  "IT",
  "Library",
  "Security",
  "Transport",
  "Health",
  "Canteen",
];

export const STAFF_TYPE_OPTIONS = ["Full-time", "Part-time"];

export const STAFF_STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "On Leave", value: "on-leave" },
  { label: "Inactive", value: "inactive" },
];

export const staffApi = createApiResource<StaffMember, StaffFilters>("/api/staff");

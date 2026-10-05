import { apiList } from "./client";
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
  gender: string;
  dateOfBirth: string;
  qualification: string;
  experienceYears: number;
  phone: string;
  email: string;
  address: string;
  join: string;
  salary: number;
  /** Passport-style photo (data URL), printed on the staff ID card. */
  avatar?: string;
}

export interface StaffFilters {
  search?: string;
  dept?: string;
  type?: string;
  status?: string;
  /** Browse page size; raised above the 200 default so stats/export see the roster. */
  limit?: number;
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

export interface StaffPage {
  data: StaffMember[];
  meta: { total: number; page: number; limit: number; pages: number };
}

/** One page of staff, keeping `meta` (total/pages). */
export async function listStaffPage(
  filters: StaffFilters & { page?: number } = {}
): Promise<StaffPage> {
  return apiList<StaffMember>("/api/staff", {
    query: {
      search: filters.search,
      dept: filters.dept,
      type: filters.type,
      status: filters.status,
      page: filters.page,
      limit: filters.limit ?? 200,
    },
  });
}

/** EVERY matching staff member across all pages — for complete browse / ID cards / export. */
export async function fetchAllStaff(filters: StaffFilters = {}): Promise<StaffMember[]> {
  const first = await listStaffPage({ ...filters, page: 1, limit: 500 });
  const byId = new Map<string, StaffMember>();
  for (const s of first.data) byId.set(s.id, s);
  const rawPages = first.meta?.pages ?? 1;
  const pages = Number.isFinite(rawPages) && rawPages > 1 ? Math.floor(rawPages) : 1;
  for (let p = 2; p <= pages; p++) {
    const next = await listStaffPage({ ...filters, page: p, limit: 500 });
    for (const s of next.data) byId.set(s.id, s);
  }
  return [...byId.values()];
}

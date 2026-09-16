import { createApiResource } from "./createApiResource";

export interface HostelStudent {
  id: string;
  /** School-facing admission code, e.g. "S001". Shown under the name. */
  studentId: string;
  name: string;
  class: string;
  hostel: string;
  room: string;
  type: string;
  fees: string;
  joinDate: string;
  contact: string;
}

export interface HostelStudentFilters {
  search?: string;
  /** "All" | "Boys" | "Girls" — mirrors the page tabs. */
  type?: string;
  hostel?: string;
  fees?: string;
}

export const HOSTEL_OPTIONS = [
  "Boys Hostel A",
  "Boys Hostel B",
  "Girls Hostel A",
  "Girls Hostel B",
];

export const HOSTEL_TYPE_OPTIONS = ["Boys", "Girls"];

export const FEE_STATUS_OPTIONS = ["Paid", "Pending", "Overdue"];

export const hostelStudentsApi = createApiResource<HostelStudent, HostelStudentFilters>(
  "/api/hostel-students"
);

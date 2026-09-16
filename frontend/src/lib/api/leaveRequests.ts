import { createApiResource } from "./createApiResource";

export interface LeaveRequest {
  id: string;
  /** Human-facing request code, e.g. "LV001". Must stay unique. */
  code: string;
  name: string;
  role: string;
  type: string;
  from: string;
  to: string;
  days: number;
  reason: string;
  status: string;
  dept: string;
}

export interface LeaveFilters {
  search?: string;
  status?: string;
  type?: string;
}

export const LEAVE_TYPE_OPTIONS = [
  "Sick Leave",
  "Casual Leave",
  "Earned Leave",
  "Maternity Leave",
];

export const LEAVE_STATUS_OPTIONS = ["Pending", "Approved", "Rejected"];

export const LEAVE_DEPT_OPTIONS = [
  "Teaching",
  "Administration",
  "Finance",
  "HR",
  "Library",
  "Security",
  "Canteen",
  "Transport",
];

export const leaveRequestsApi = createApiResource<LeaveRequest, LeaveFilters>(
  "/api/leave-requests"
);

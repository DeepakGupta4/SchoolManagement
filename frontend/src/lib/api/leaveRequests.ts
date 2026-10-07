import { apiRequest } from "./client";
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
  /** Applicant's login email — set when they filed it themselves (self-service). */
  email?: string;
}

export interface LeaveFilters {
  search?: string;
  status?: string;
  type?: string;
  /** Browse page size; raised above the 200 default so stats/export see all requests. */
  limit?: number;
}

export const LEAVE_TYPE_OPTIONS = [
  "Sick Leave",
  "Casual Leave",
  "Earned Leave",
  "Maternity Leave",
];

export const LEAVE_STATUS_OPTIONS = ["Pending", "Approved", "Rejected"];

/**
 * Default annual entitlement (days) per leave type. The remaining balance is
 * quota minus approved days taken this year — so approving a leave auto-reduces
 * it. Per-staff overrides are a future enhancement; these are the baseline.
 */
export const LEAVE_QUOTA: Record<string, number> = {
  "Casual Leave": 12,
  "Sick Leave": 10,
  "Earned Leave": 15,
  "Maternity Leave": 180,
};

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

/** The signed-in user's OWN leave requests (self-service, any role). */
export async function getMyLeave(): Promise<LeaveRequest[]> {
  return apiRequest<LeaveRequest[]>("/api/leave-requests/mine");
}

/** File a leave for oneself. Name/department are stamped server-side; starts Pending. */
export async function applyMyLeave(payload: {
  type: string;
  from: string;
  to: string;
  reason: string;
}): Promise<LeaveRequest> {
  return apiRequest<LeaveRequest>("/api/leave-requests/mine", { method: "POST", body: payload });
}

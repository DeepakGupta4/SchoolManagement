import { apiRequest } from "./client";

/**
 * Super Admin — school registration requests and approvals.
 *
 * These endpoints are platform-level (not tenant-scoped); the server restricts
 * them to `super_admin`, and the sidebar only surfaces the page to that role.
 */

export type RequestStatus = "pending" | "approved" | "rejected";
export type TrialStatus =
  | "trial"
  | "active"
  | "expired"
  | "suspended"
  | "cancelled"
  | "payment_pending";

export interface SchoolRequest {
  id: string;
  schoolName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  studentCount: number;
  teacherCount: number;
  schoolType: string;
  website: string;
  message: string;
  status: RequestStatus;
  reviewedBy: string;
  reviewedAt: string | null;
  rejectionReason: string;
  schoolId: string;
  createdAt: string;
  /** Live subscription state of the created school (approved rows only). */
  trialStatus: TrialStatus | null;
  trialEndDate: string | null;
}

export interface RequestStats {
  totalSchools: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  activeTrials: number;
  trialsExpired: number;
  paidSchools: number;
  suspendedSchools: number;
  revenue: number;
}

export interface ApproveResult {
  schoolId: string;
  email: string;
  /** Shown once so the admin can relay it if email delivery is off. */
  temporaryPassword: string;
  emailDelivered: boolean;
  trialStartDate: string;
  trialEndDate: string;
  userId: string;
}

export async function listSchoolRequests(filters: {
  status?: RequestStatus | "all";
  search?: string;
} = {}): Promise<SchoolRequest[]> {
  return apiRequest<SchoolRequest[]>("/api/school-requests", {
    query: { status: filters.status ?? "all", search: filters.search },
  });
}

export async function getRequestStats(): Promise<RequestStats> {
  return apiRequest<RequestStats>("/api/school-requests/stats/overview");
}

export async function approveSchoolRequest(id: string): Promise<ApproveResult> {
  return apiRequest<ApproveResult>(`/api/school-requests/${id}/approve`, { method: "POST" });
}

export async function rejectSchoolRequest(id: string, reason?: string): Promise<SchoolRequest> {
  return apiRequest<SchoolRequest>(`/api/school-requests/${id}/reject`, {
    method: "POST",
    body: { reason },
  });
}

/** Removes the request and everything it created (school + user logins). */
export async function deleteSchoolRequest(id: string): Promise<void> {
  await apiRequest<void>(`/api/school-requests/${id}`, { method: "DELETE" });
}

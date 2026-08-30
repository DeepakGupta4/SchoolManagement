import { apiRequest } from "./client";
import type { SubscriptionStatus } from "./subscription";

/**
 * Super Admin — manage a tenant school's subscription. All of these are
 * platform-owner only (enforced on the server).
 */

export interface SchoolAccess {
  status: SubscriptionStatus;
  allowed: boolean;
  daysRemaining: number | null;
  trialEndDate: string | null;
  paidEndDate: string | null;
}

export interface ManagedSchool {
  id: string;
  schoolId: string;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  /** Figures the school claimed at sign-up. */
  studentCount: number;
  teacherCount: number;
  /** Real usage — records actually created in the system. */
  studentsAdded: number;
  staffAdded: number;
  status: "active" | "suspended";
  subscription: {
    plan: "trial" | "monthly" | "yearly";
    status: SubscriptionStatus;
    trialEndDate: string | null;
    paidEndDate: string | null;
    freeAccess: boolean;
  };
  access: SchoolAccess;
  createdAt: string;
}

export async function listSchools(): Promise<ManagedSchool[]> {
  return apiRequest<ManagedSchool[]>("/api/schools");
}

export async function extendTrial(schoolId: string, days: number): Promise<ManagedSchool> {
  return apiRequest<ManagedSchool>(`/api/schools/${schoolId}/extend`, {
    method: "POST",
    body: { days },
  });
}

export async function activateFree(schoolId: string): Promise<ManagedSchool> {
  return apiRequest<ManagedSchool>(`/api/schools/${schoolId}/activate-free`, { method: "POST" });
}

export async function activatePaid(
  schoolId: string,
  plan: "monthly" | "yearly"
): Promise<ManagedSchool> {
  return apiRequest<ManagedSchool>(`/api/schools/${schoolId}/activate-paid`, {
    method: "POST",
    body: { plan },
  });
}

export async function suspendSchool(schoolId: string): Promise<ManagedSchool> {
  return apiRequest<ManagedSchool>(`/api/schools/${schoolId}/suspend`, { method: "POST" });
}

export async function resumeSchool(schoolId: string): Promise<ManagedSchool> {
  return apiRequest<ManagedSchool>(`/api/schools/${schoolId}/resume`, { method: "POST" });
}

export async function setTrialEnd(schoolId: string, trialEndDate: string): Promise<ManagedSchool> {
  return apiRequest<ManagedSchool>(`/api/schools/${schoolId}/trial`, {
    method: "PATCH",
    body: { trialEndDate },
  });
}

export interface ResetPasswordResult {
  email: string;
  temporaryPassword: string;
  emailDelivered: boolean;
}

export async function resetSchoolPassword(schoolId: string): Promise<ResetPasswordResult> {
  return apiRequest<ResetPasswordResult>(`/api/schools/${schoolId}/reset-password`, {
    method: "POST",
  });
}

/** Permanently delete a school, its logins and its registration request. */
export async function deleteSchool(schoolId: string): Promise<void> {
  await apiRequest<void>(`/api/schools/${schoolId}`, { method: "DELETE" });
}

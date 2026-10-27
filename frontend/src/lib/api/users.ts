import { apiRequest } from "./client";
import type { UserRole } from "@/types";

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  /** When role is "custom", the key of the Role document that holds its permissions. */
  customRoleKey?: string;
  schoolId: string;
  avatar: string;
  isActive?: boolean;
}

export async function listUsers(): Promise<ManagedUser[]> {
  return apiRequest<ManagedUser[]>("/api/auth/users");
}

export async function updateUser(
  id: string,
  updates: { name?: string; email?: string; role?: UserRole; customRoleKey?: string; isActive?: boolean }
): Promise<ManagedUser> {
  return apiRequest<ManagedUser>(`/api/auth/users/${id}`, {
    method: "PATCH",
    body: updates,
  });
}

/** Login credentials, returned ONCE when an account is created or its password reset. */
export interface UserCredentials {
  email: string;
  password: string;
}

export interface CreateUserResult {
  user: ManagedUser;
  credentials: UserCredentials;
  /** Whether the credentials email was delivered (false = relay the popup manually). */
  emailed: boolean;
}

/** Admin creates a login. The server generates + emails a temporary password. */
export async function createUser(input: {
  name: string;
  email: string;
  role: UserRole;
  customRoleKey?: string;
}): Promise<CreateUserResult> {
  return apiRequest<CreateUserResult>("/api/auth/register", { method: "POST", body: input });
}

/** Admin resets a user's password — returns the new one once and emails it. */
export async function resetUserPassword(
  id: string
): Promise<{ credentials: UserCredentials; emailed: boolean }> {
  return apiRequest(`/api/auth/users/${id}/reset-password`, { method: "POST" });
}

export interface SampleStaffResult {
  created: { name: string; email: string; role: UserRole }[];
  skipped: string[];
  /** The shared temporary password for all created sample accounts (shown once). */
  password: string;
  emailed: number;
}

/**
 * One-click onboarding: create ready-to-use sample staff accounts (teacher,
 * principal, accountant, librarian) in the admin's own school. Idempotent.
 */
export async function addSampleStaff(): Promise<SampleStaffResult> {
  return apiRequest<SampleStaffResult>("/api/auth/users/sample-staff", { method: "POST" });
}

/** A few sample account holders of a role, with the totals. */
export interface RoleHolderSummary {
  total: number;
  active: number;
  sample: { id: string; name: string; email: string; isActive: boolean }[];
}

/**
 * Per-role account summary for the Roles page — counts + a few sample holders,
 * computed server-side so the page never fetches the whole school's users.
 */
export interface RoleSummary {
  /** Built-in role name -> summary (e.g. "school_admin", "principal", "teacher"). */
  roles: Record<string, RoleHolderSummary>;
  /** Custom role key -> summary. */
  custom: Record<string, RoleHolderSummary>;
  totalAccounts: number;
}

/** Group a full user list into the per-role summary shape (client-side fallback). */
function summarizeUsers(users: ManagedUser[]): RoleSummary {
  const roles: Record<string, RoleHolderSummary> = {};
  const custom: Record<string, RoleHolderSummary> = {};
  for (const u of users) {
    const isCustom = u.role === "custom";
    const key = isCustom ? u.customRoleKey ?? "" : u.role;
    if (isCustom && !key) continue; // a custom user with no role key can't be grouped
    const bucket = isCustom ? custom : roles;
    const entry = (bucket[key] ??= { total: 0, active: 0, sample: [] });
    const active = u.isActive !== false; // undefined (not exposed) counts as active
    entry.total += 1;
    if (active) entry.active += 1;
    if (entry.sample.length < 5) entry.sample.push({ id: u.id, name: u.name, email: u.email, isActive: active });
  }
  return { roles, custom, totalAccounts: users.length };
}

/**
 * Prefers the efficient server summary, but falls back to deriving it from the
 * full user list when that endpoint isn't available yet (backend not redeployed,
 * or an older MongoDB) — so the Roles page shows accounts either way.
 */
export async function getRoleSummary(): Promise<RoleSummary> {
  try {
    return await apiRequest<RoleSummary>("/api/auth/users/role-summary");
  } catch {
    return summarizeUsers(await listUsers());
  }
}

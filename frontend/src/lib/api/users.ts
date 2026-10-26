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

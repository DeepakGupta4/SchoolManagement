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
  updates: { name?: string; role?: UserRole; customRoleKey?: string; isActive?: boolean }
): Promise<ManagedUser> {
  return apiRequest<ManagedUser>(`/api/auth/users/${id}`, {
    method: "PATCH",
    body: updates,
  });
}

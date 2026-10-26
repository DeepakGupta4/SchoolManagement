import { createApiResource } from "./createApiResource";
import type { PermissionMap } from "@/lib/permissions";

/** A school-defined custom role (built-in roles are not stored here). */
export interface CustomRole {
  id: string;
  /** Stable slug — a user's customRoleKey points at this. */
  key: string;
  name: string;
  description?: string;
  permissions: PermissionMap;
  isActive: boolean;
}

export interface CustomRoleFilters {
  search?: string;
}

export const rolesApi = createApiResource<CustomRole, CustomRoleFilters>("/api/roles");

/** Turns a role name into a stable, URL-safe key (slug). */
export function slugifyRoleKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/** Count of sections a role can access (view or edit). */
export function grantedModuleCount(permissions: PermissionMap | undefined): number {
  if (!permissions) return 0;
  return Object.values(permissions).filter((l) => l === "view" || l === "edit").length;
}

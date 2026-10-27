import type { PermissionMap } from "@/lib/permissions";

export type UserRole =
  | "super_admin"
  | "school_admin"
  | "principal"
  | "teacher"
  | "accountant"
  | "librarian"
  | "parent"
  | "student"
  | "staff"
  | "driver"
  // A school-defined custom role; its actual access lives in `permissions`.
  | "custom";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  schoolId?: string;
  /** For a custom role: which Role document (its key) and its resolved access. */
  customRoleKey?: string;
  roleName?: string;
  permissions?: PermissionMap;
  /** Whether authenticator-app 2FA is on for this account. */
  twoFactorEnabled?: boolean;
}

export interface School {
  id: string;
  name: string;
  logo?: string;
  address: string;
  phone: string;
  email: string;
  board: string;
  plan: "starter" | "growth" | "enterprise";
  isActive: boolean;
}

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  badge?: number;
  children?: NavItem[];
}

export interface StatsCard {
  title: string;
  value: string | number;
  change: number;
  icon: string;
  color: string;
}

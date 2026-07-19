export type UserRole = "super_admin" | "school_admin" | "teacher" | "student" | "parent" | "staff";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  schoolId?: string;
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

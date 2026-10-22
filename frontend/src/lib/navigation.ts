import {
  LayoutDashboard, Users, GraduationCap, BookOpen, ClipboardList,
  DollarSign, Bus, FlaskConical, Library, Home, Calendar,
  Bell, Settings, School, UserCheck, Award,
  FileText, BarChart3, MessageSquare, ShieldCheck, Cpu, Globe,
  Smartphone, Package, Utensils, HeartPulse, Trophy, Workflow,
  IdCard, Building2, BookMarked, CalendarX, Contact, type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/types";

export interface NavChild {
  title: string;
  href: string;
}

export interface NavEntry {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Roadmap item with no page yet — rendered inert so it can't 404. */
  soon?: boolean;
  /**
   * Personal self-service item that only makes sense for the individual employee
   * (e.g. "My Leave"). Hidden from full-access admin roles — admins/principals
   * manage everyone's leave in "Leave Management" rather than filing their own.
   */
  hideFromFullAccess?: boolean;
  children?: NavChild[];
}

export interface NavGroup {
  label: string;
  items: NavEntry[];
  /**
   * Who sees this group:
   *  - "platform": the platform owner (super_admin) only
   *  - "school":   school users only (the tenant modules) — the default
   *  - "both":     everyone signed in
   */
  scope?: "platform" | "school" | "both";
}

export const navGroups: NavGroup[] = [
  {
    label: "Main",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "Analytics", href: "/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Platform Admin",
    scope: "platform",
    items: [
      { title: "Overview", href: "/overview", icon: LayoutDashboard },
      { title: "School Requests", href: "/school-requests", icon: Building2 },
      { title: "Schools", href: "/schools", icon: School },
    ],
  },
  {
    label: "People",
    items: [
      {
        title: "Students", href: "/students", icon: GraduationCap,
        children: [
          { title: "All Students", href: "/students" },
          { title: "Admissions", href: "/students/admissions" },
          { title: "Promotions", href: "/students/promotions" },
          { title: "Transfers", href: "/students/transfers" },
          { title: "Alumni", href: "/students/alumni" },
          { title: "ID Cards", href: "/students/id-cards" },
          { title: "Documents", href: "/students/documents" },
        ],
      },
      {
        title: "Teachers", href: "/teachers", icon: Users,
        children: [
          { title: "All Teachers", href: "/teachers" },
          { title: "Departments", href: "/teachers/departments" },
          { title: "Subject Allocation", href: "/teachers/allocation" },
          { title: "Substitutions", href: "/teachers/substitutions" },
          { title: "ID Cards", href: "/teachers/id-cards" },
        ],
      },
      {
        title: "Staff & HR", href: "/staff", icon: UserCheck,
        children: [
          { title: "Staff Management", href: "/staff" },
          { title: "Attendance", href: "/staff/attendance" },
          { title: "Recruitment", href: "/recruitment" },
          { title: "Applicants", href: "/recruitment/applicants" },
          { title: "Leave Management", href: "/leave" },
          { title: "Leave Balances", href: "/leave/balances" },
          { title: "Performance", href: "/performance" },
          { title: "ID Cards", href: "/staff/id-cards" },
        ],
      },
      { title: "Parents", href: "/parents", icon: Contact },
      { title: "My Leave", href: "/leave/my", icon: CalendarX, hideFromFullAccess: true },
      { title: "My ID Card", href: "/id-cards/me", icon: IdCard, hideFromFullAccess: true },
    ],
  },
  {
    label: "Academic",
    items: [
      { title: "Classes & Sections", href: "/classes", icon: School },
      { title: "Subjects", href: "/subjects", icon: BookMarked },
      { title: "Timetable", href: "/timetable", icon: Calendar },
      { title: "Attendance", href: "/attendance", icon: UserCheck },
      { title: "Holidays", href: "/holidays", icon: CalendarX },
      {
        title: "Examinations", href: "/exams", icon: ClipboardList,
        children: [
          { title: "All Exams", href: "/exams" },
          { title: "Exam Schedule", href: "/exams/schedule" },
          { title: "Admit Cards", href: "/exams/admit-cards" },
          { title: "Mark Entry", href: "/exams/marks" },
          { title: "Report Cards", href: "/exams/report-cards" },
          { title: "Merit List", href: "/exams/merit-list" },
        ],
      },
      { title: "Assignments", href: "/assignments", icon: BookOpen },
      { title: "Syllabus", href: "/syllabus", icon: FileText },
      {
        title: "LMS", href: "/lms", icon: Globe,
        children: [
          { title: "Overview", href: "/lms" },
          { title: "Online Classes", href: "/lms/classes" },
          { title: "Study Material", href: "/lms/material" },
        ],
      },
    ],
  },
  {
    label: "Cards & Documents",
    items: [
      {
        title: "ID Cards", href: "/id-cards", icon: IdCard,
        children: [
          { title: "Overview", href: "/id-cards" },
          { title: "Student ID Cards", href: "/students/id-cards" },
          { title: "Teacher ID Cards", href: "/teachers/id-cards" },
          { title: "Staff ID Cards", href: "/staff/id-cards" },
        ],
      },
      { title: "Admit Cards", href: "/exams/admit-cards", icon: FileText },
      { title: "Certificates", href: "/certificates", icon: Award },
    ],
  },
  {
    label: "Finance",
    items: [
      {
        title: "Fee Management", href: "/fees", icon: DollarSign,
        children: [
          { title: "Fee Overview", href: "/fees" },
          { title: "Fee Structure", href: "/fees/structure" },
          { title: "Collect Fee", href: "/fees/collect" },
          { title: "Receipts", href: "/fees/receipts" },
          { title: "Fee Dues", href: "/fees/defaulters" },
          { title: "Scholarships", href: "/fees/scholarships" },
        ],
      },
      { title: "Expenses", href: "/expenses", icon: Package },
      { title: "Payroll", href: "/payroll", icon: Award },
      { title: "Subscription", href: "/subscription", icon: DollarSign },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Transport", href: "/transport", icon: Bus },
      { title: "Hostel", href: "/hostel", icon: Home },
      { title: "Library", href: "/library", icon: Library },
      { title: "Inventory", href: "/inventory", icon: Package },
      { title: "Canteen", href: "/canteen", icon: Utensils },
      { title: "Health", href: "/health", icon: HeartPulse },
      { title: "Labs", href: "/labs", icon: FlaskConical },
    ],
  },
  {
    label: "Communication",
    items: [
      { title: "Announcements", href: "/announcements", icon: Bell },
      { title: "Messages", href: "/messages", icon: MessageSquare },
      { title: "Notice Board", href: "/notices", icon: FileText },
      { title: "Events", href: "/events", icon: Trophy },
      { title: "Visitor Management", href: "/visitors", icon: ShieldCheck },
    ],
  },
  {
    label: "Platform",
    items: [
      { title: "AI Suite", href: "/ai", icon: Cpu },
      { title: "Workflow Builder", href: "/workflows", icon: Workflow },
      { title: "Mobile Apps", href: "/mobile", icon: Smartphone },
    ],
  },
  {
    label: "System",
    scope: "both",
    items: [
      { title: "Settings", href: "/settings", icon: Settings },
      { title: "Security", href: "/security", icon: ShieldCheck },
    ],
  },
];

export interface FlatNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  group: string;
  /** Parent title for child routes, e.g. "Examinations". */
  parent?: string;
  soon?: boolean;
}

/** Every navigable destination, flattened — used by the command palette. */
export const flatNav: FlatNavItem[] = navGroups.flatMap((group) =>
  group.items.flatMap((item) => [
    { title: item.title, href: item.href, icon: item.icon, group: group.label, soon: item.soon },
    ...(item.children ?? [])
      // The first child usually points at the parent's own route; skip it so
      // the palette doesn't list the same destination twice.
      .filter((child) => child.href !== item.href)
      .map((child) => ({
        title: child.title,
        href: child.href,
        icon: item.icon,
        group: group.label,
        parent: item.title,
      })),
  ])
);

/* ------------------------------------------------------------------ */
/* Role-based access                                                    */
/* ------------------------------------------------------------------ */

/**
 * Sidebar links a teacher may see. Anything not listed is an admin-only module
 * and is hidden from teachers (fees, payroll, admissions, settings→reset, etc.).
 * These are the hrefs as they appear in `navGroups` (parents + children).
 */
const TEACHER_NAV_HREFS = new Set<string>([
  "/dashboard",
  // Teaching essentials
  "/attendance",
  "/timetable",
  "/assignments",
  "/syllabus",
  "/exams/marks",
  "/exams/report-cards",
  "/lms",
  "/lms/classes",
  "/lms/material",
  // Own classes' students (view)
  "/students",
  // Communication
  "/announcements",
  "/messages",
  "/notices",
  "/events",
  "/holidays",
  // Self-service
  "/leave/my",
  "/id-cards/me",
  // Settings is role-aware: a teacher sees only their own profile here (name/photo/
  // password), never the school config or data-reset danger zone.
  "/settings",
]);

/**
 * Sidebar links an accounts/reception person may see — everything fees &
 * finance, student lookup, front-desk (visitors) and communication.
 */
const ACCOUNTANT_NAV_HREFS = new Set<string>([
  "/dashboard",
  // Fees & finance
  "/fees",
  "/fees/structure",
  "/fees/collect",
  "/fees/receipts",
  "/fees/defaulters",
  "/fees/scholarships",
  "/expenses",
  "/payroll",
  // Student lookup (view)
  "/students",
  // Front desk & communication
  "/visitors",
  "/announcements",
  "/messages",
  "/notices",
  // Profile
  "/settings",
]);

/** Sidebar links a parent may see — their portal dashboard plus read-only school info. */
const PARENT_NAV_HREFS = new Set<string>(["/dashboard", "/holidays", "/notices"]);

/** A student: their own portal dashboard (attendance/classes/updates) + read-only school info. */
const STUDENT_NAV_HREFS = new Set<string>(["/dashboard", "/holidays", "/notices"]);

/** Non-teaching staff: self-service home, their own leave, and read-only school info. */
const STAFF_NAV_HREFS = new Set<string>(["/dashboard", "/leave/my", "/holidays", "/notices"]);

/** A driver: their routes dashboard + read-only school info. */
const DRIVER_NAV_HREFS = new Set<string>(["/dashboard", "/holidays", "/notices"]);

/** A librarian: the library module they run, plus their dashboard and school info. */
const LIBRARIAN_NAV_HREFS = new Set<string>(["/dashboard", "/library", "/holidays", "/notices"]);

/** Roles whose navigation is restricted to a specific allow-list. */
const RESTRICTED_ROLE_HREFS: Partial<Record<UserRole, Set<string>>> = {
  teacher: TEACHER_NAV_HREFS,
  accountant: ACCOUNTANT_NAV_HREFS,
  parent: PARENT_NAV_HREFS,
  student: STUDENT_NAV_HREFS,
  staff: STAFF_NAV_HREFS,
  driver: DRIVER_NAV_HREFS,
  librarian: LIBRARIAN_NAV_HREFS,
};

/**
 * Roles that see the full school navigation (the platform owner is separate).
 * Kept as strings because the backend role set (which includes "principal") is
 * wider than the frontend `UserRole` union.
 */
const FULL_ACCESS_ROLES = new Set<string>(["super_admin", "school_admin", "principal"]);

/**
 * Hrefs a near-full role may NOT see even though it otherwise has full access. The
 * principal runs the school day-to-day but is NOT the account owner, so the
 * SaaS-account items — billing/subscription, the Security page, and the platform
 * setup tools (Workflow Builder, Mobile Apps) — stay with super_admin /
 * school_admin. (The Settings "reset all data" danger zone is gated inside the
 * Settings page itself, since the rest of Settings IS the principal's.)
 */
const DENIED_HREFS_BY_ROLE: Partial<Record<string, Set<string>>> = {
  principal: new Set<string>(["/subscription", "/security", "/workflows", "/mobile"]),
};

function deniedHrefsFor(role: UserRole | undefined): Set<string> | undefined {
  return role ? DENIED_HREFS_BY_ROLE[role] : undefined;
}

/** True when a full-access role is nonetheless denied this path (exact or a sub-route). */
function isDeniedForRole(role: UserRole | undefined, pathname: string): boolean {
  const denied = deniedHrefsFor(role);
  if (!denied) return false;
  if (denied.has(pathname)) return true;
  for (const base of denied) if (pathname.startsWith(`${base}/`)) return true;
  return false;
}

/**
 * Personal self-service hrefs (flagged `hideFromFullAccess`, e.g. "/leave/my") that
 * full-access admins/principals should neither see in nav nor open. Collected from
 * `navGroups` so it stays in sync with the flag.
 */
const SELF_SERVICE_ONLY_HREFS = new Set<string>(
  navGroups.flatMap((g) => g.items.filter((it) => it.hideFromFullAccess).map((it) => it.href))
);

/**
 * Minimal fallback for any other signed-in role (librarian/parent/student/driver/
 * staff) that has no explicit allow-list yet — the dashboard only, never the admin
 * modules (Staff, Payroll, Performance, …). Without this, an unlisted role fell
 * through to full admin access.
 */
const MINIMAL_NAV_HREFS = new Set<string>(["/dashboard"]);

/** The nav allow-list for a role, or `undefined` when the role may see everything. */
function allowedHrefsFor(role: UserRole | undefined): Set<string> | undefined {
  if (!role || FULL_ACCESS_ROLES.has(role)) return undefined;
  return RESTRICTED_ROLE_HREFS[role] ?? MINIMAL_NAV_HREFS;
}

/** Student sub-routes that stay admin-only even though /students is allowed. */
const STUDENT_ADMIN_SUBROUTES = new Set([
  "admissions",
  "promotions",
  "transfers",
  "alumni",
  "id-cards",
  "documents",
]);

/** True when `pathname` is reachable by `role`. Unlisted roles are unrestricted. */
export function isPathAllowed(role: UserRole | undefined, pathname: string): boolean {
  const allowed = allowedHrefsFor(role);
  // Full-access roles may open everything except personal self-service pages
  // (e.g. "/leave/my") and anything on their role's deny-list (the principal
  // can't open the account-owner pages).
  if (!allowed) return !SELF_SERVICE_ONLY_HREFS.has(pathname) && !isDeniedForRole(role, pathname);
  if (pathname === "/" || pathname === "/dashboard") return true;

  // Exact allowed pages.
  if (allowed.has(pathname)) return true;

  // /students/<id> detail is fine (viewing a student), but the named admin
  // sub-routes under /students are not.
  if (allowed.has("/students") && pathname.startsWith("/students/")) {
    const seg = pathname.slice("/students/".length).split("/")[0];
    return !STUDENT_ADMIN_SUBROUTES.has(seg);
  }

  // Detail / sub-routes of any other allowed base, e.g. /fees/collect,
  // /assignments/<id>, /lms/classes.
  for (const base of allowed) {
    if (base !== "/students" && pathname.startsWith(`${base}/`)) return true;
  }
  return false;
}

/** Filters the nav tree to what `role` should see. */
export function navGroupsForRole(role: UserRole | undefined): NavGroup[] {
  const isSuper = role === "super_admin";
  const allowed = allowedHrefsFor(role);

  return navGroups
    .filter((g) => {
      const scope = g.scope ?? "school";
      if (scope === "both") return true;
      if (scope === "platform") return isSuper;
      return !isSuper; // "school"
    })
    .map((g) => {
      if (!allowed) {
        // Full-access roles see every module EXCEPT personal self-service items
        // (e.g. "My Leave") and anything on their role's deny-list (the principal
        // doesn't see the account-owner items).
        const denied = deniedHrefsFor(role);
        const items = g.items
          .filter((it) => !it.hideFromFullAccess)
          .filter((it) => !denied || !denied.has(it.href))
          .map((it) =>
            denied && it.children ? { ...it, children: it.children.filter((c) => !denied.has(c.href)) } : it
          );
        return { ...g, items };
      }
      // Restricted roles see only their allowed items; parent items keep only
      // the children they may open.
      const items = g.items
        .map((it) => {
          const children = it.children?.filter((c) => allowed.has(c.href));
          return children && it.children ? { ...it, children } : it;
        })
        .filter((it) => allowed.has(it.href) || (it.children?.length ?? 0) > 0)
        // A teacher's student list is only their own class, so "All Students"
        // reads as "My Class".
        .map((it) =>
          role === "teacher" && it.children
            ? {
                ...it,
                children: it.children.map((c) =>
                  c.href === "/students" ? { ...c, title: "My Class" } : c
                ),
              }
            : it
        );
      return { ...g, items };
    })
    .filter((g) => g.items.length > 0);
}

/** Human-readable trail for the current pathname, e.g. Academic → Examinations → Mark Entry. */
export function breadcrumbFor(pathname: string, role?: UserRole): string[] {
  // A teacher only ever sees their own class, so "All Students" reads as "My Class".
  const relabel = (trail: string[]) =>
    role === "teacher" ? trail.map((t) => (t === "All Students" ? "My Class" : t)) : trail;
  for (const group of navGroups) {
    for (const item of group.items) {
      const child = item.children?.find((c) => c.href === pathname);
      if (child) return relabel([group.label, item.title, child.title]);
      if (item.href === pathname) return relabel([group.label, item.title]);
      // Detail routes like /students/stu_001 sit under their list page.
      if (pathname.startsWith(`${item.href}/`)) return relabel([group.label, item.title, "Details"]);
    }
  }
  return [];
}

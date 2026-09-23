import {
  LayoutDashboard, Users, GraduationCap, BookOpen, ClipboardList,
  DollarSign, Bus, FlaskConical, Library, Home, Calendar,
  Bell, Settings, School, UserCheck, Award,
  FileText, BarChart3, MessageSquare, ShieldCheck, Cpu, Globe,
  Smartphone, Package, Utensils, HeartPulse, Trophy, Workflow,
  IdCard, Building2, BookMarked, CalendarX, type LucideIcon,
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
          { title: "ID Cards", href: "/teachers/id-cards" },
        ],
      },
      {
        title: "Staff & HR", href: "/staff", icon: UserCheck,
        children: [
          { title: "Staff Management", href: "/staff" },
          { title: "Recruitment", href: "/recruitment" },
          { title: "Leave Management", href: "/leave" },
          { title: "Performance", href: "/performance" },
        ],
      },
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
          { title: "Defaulters", href: "/fees/defaulters" },
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
  // Profile & leave
  "/settings",
  "/leave",
]);

/** Student sub-routes that stay admin-only even though /students is allowed. */
const STUDENT_ADMIN_SUBROUTES = new Set([
  "admissions",
  "promotions",
  "transfers",
  "alumni",
  "id-cards",
  "documents",
]);

/** True when `pathname` is reachable by `role`. Non-teachers are unrestricted. */
export function isPathAllowed(role: UserRole | undefined, pathname: string): boolean {
  if (role !== "teacher") return true;
  if (pathname === "/" || pathname === "/dashboard") return true;

  // Exact allowed pages (and their dynamic detail routes below).
  if (TEACHER_NAV_HREFS.has(pathname)) return true;

  // /students/<id> detail is fine (viewing a student), but the named admin
  // sub-routes under /students are not.
  if (pathname.startsWith("/students/")) {
    const seg = pathname.slice("/students/".length).split("/")[0];
    return !STUDENT_ADMIN_SUBROUTES.has(seg);
  }

  // Sub-routes of allowed sections.
  if (pathname.startsWith("/lms/")) return true;
  if (pathname.startsWith("/exams/marks") || pathname.startsWith("/exams/report-cards")) return true;

  // Detail routes for other allowed list pages, e.g. /assignments/<id>.
  const ALLOWED_PREFIXES = ["/attendance", "/timetable", "/assignments", "/syllabus", "/settings", "/leave", "/messages", "/notices", "/events", "/announcements", "/holidays"];
  return ALLOWED_PREFIXES.some((p) => pathname.startsWith(`${p}/`));
}

/** Filters the nav tree to what `role` should see. */
export function navGroupsForRole(role: UserRole | undefined): NavGroup[] {
  const isSuper = role === "super_admin";
  const isTeacher = role === "teacher";

  return navGroups
    .filter((g) => {
      const scope = g.scope ?? "school";
      if (scope === "both") return true;
      if (scope === "platform") return isSuper;
      return !isSuper; // "school"
    })
    .map((g) => {
      if (!isTeacher) return g;
      // Teachers see only their allowed items; parent items keep only the
      // children a teacher may open.
      const items = g.items
        .map((it) => {
          const children = it.children?.filter((c) => TEACHER_NAV_HREFS.has(c.href));
          return children && it.children ? { ...it, children } : it;
        })
        .filter(
          (it) =>
            TEACHER_NAV_HREFS.has(it.href) ||
            (it.children?.length ?? 0) > 0
        );
      return { ...g, items };
    })
    .filter((g) => g.items.length > 0);
}

/** Human-readable trail for the current pathname, e.g. Academic → Examinations → Mark Entry. */
export function breadcrumbFor(pathname: string): string[] {
  for (const group of navGroups) {
    for (const item of group.items) {
      const child = item.children?.find((c) => c.href === pathname);
      if (child) return [group.label, item.title, child.title];
      if (item.href === pathname) return [group.label, item.title];
      // Detail routes like /students/stu_001 sit under their list page.
      if (pathname.startsWith(`${item.href}/`)) return [group.label, item.title, "Details"];
    }
  }
  return [];
}

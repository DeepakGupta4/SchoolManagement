import {
  LayoutDashboard, Users, GraduationCap, BookOpen, ClipboardList,
  DollarSign, Bus, FlaskConical, Library, Home, Calendar,
  Bell, Settings, School, UserCheck, Award,
  FileText, BarChart3, MessageSquare, ShieldCheck, Cpu, Globe,
  Smartphone, Package, Utensils, HeartPulse, Trophy, Workflow,
  IdCard, Building2, type LucideIcon,
} from "lucide-react";

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
  /** Shown only to the platform owner (super_admin). */
  superAdminOnly?: boolean;
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
    superAdminOnly: true,
    items: [
      { title: "School Requests", href: "/school-requests", icon: Building2 },
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
      { title: "Timetable", href: "/timetable", icon: Calendar },
      { title: "Attendance", href: "/attendance", icon: UserCheck },
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

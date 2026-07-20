import {
  LayoutDashboard, Users, GraduationCap, BookOpen, ClipboardList,
  DollarSign, Bus, FlaskConical, Library, Home, Calendar,
  Bell, Settings, School, UserCheck, Award,
  FileText, BarChart3, MessageSquare, ShieldCheck, Cpu, Globe,
  Smartphone, Package, Utensils, HeartPulse, Trophy, Workflow,
  type LucideIcon,
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
    label: "Academic",
    items: [
      { title: "Students", href: "/students", icon: GraduationCap },
      { title: "Teachers", href: "/teachers", icon: Users },
      { title: "Classes & Sections", href: "/classes", icon: School },
      { title: "Timetable", href: "/timetable", icon: Calendar },
      { title: "Attendance", href: "/attendance", icon: UserCheck },
      {
        title: "Examinations", href: "/exams", icon: ClipboardList,
        children: [
          { title: "Exam Schedule", href: "/exams/schedule" },
          { title: "Mark Entry", href: "/exams/marks" },
          { title: "Report Cards", href: "/exams/report-cards" },
          { title: "Merit List", href: "/exams/merit-list" },
        ],
      },
      { title: "Assignments", href: "/assignments", icon: BookOpen },
      { title: "Syllabus", href: "/syllabus", icon: FileText },
    ],
  },
  {
    label: "Finance",
    items: [
      {
        title: "Fee Management", href: "/fees", icon: DollarSign,
        children: [
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
    ],
  },
  {
    label: "HR & Staff",
    items: [
      { title: "Staff Management", href: "/staff", icon: Users },
      { title: "Recruitment", href: "/recruitment", icon: UserCheck },
      { title: "Leave Management", href: "/leave", icon: Calendar },
      { title: "Performance", href: "/performance", icon: Trophy },
    ],
  },
  {
    label: "Communication",
    items: [
      { title: "Announcements", href: "/announcements", icon: Bell },
      { title: "Messages", href: "/messages", icon: MessageSquare },
      { title: "Notice Board", href: "/notices", icon: FileText },
    ],
  },
  {
    label: "Platform",
    items: [
      { title: "LMS", href: "/lms", icon: Globe, soon: true },
      { title: "AI Suite", href: "/ai", icon: Cpu, soon: true },
      { title: "Workflow Builder", href: "/workflows", icon: Workflow, soon: true },
      { title: "Events", href: "/events", icon: Trophy, soon: true },
      { title: "Visitor Management", href: "/visitors", icon: ShieldCheck, soon: true },
      { title: "Mobile Apps", href: "/mobile", icon: Smartphone, soon: true },
      { title: "Labs", href: "/labs", icon: FlaskConical, soon: true },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Settings", href: "/settings", icon: Settings, soon: true },
      { title: "Security", href: "/security", icon: ShieldCheck, soon: true },
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
    ...(item.children ?? []).map((child) => ({
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
      if (item.href === pathname) return [group.label, item.title];
      const child = item.children?.find((c) => c.href === pathname);
      if (child) return [group.label, item.title, child.title];
      // Detail routes like /students/stu_001 sit under their list page.
      if (pathname.startsWith(`${item.href}/`)) return [group.label, item.title, "Details"];
    }
  }
  return [];
}

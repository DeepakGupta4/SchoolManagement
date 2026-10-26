/**
 * Frontend catalog of grantable sections (modules) for custom roles. The KEYS
 * here MUST match the backend catalog (backend/src/modules/roles/permissionModules.ts)
 * — the backend authorises the API by the same keys. Here each module also lists
 * the nav hrefs it unlocks, so a custom role's sidebar/route-guard is derived from
 * its permissions.
 */

export type PermissionLevel = "none" | "view" | "edit";

export const PERMISSION_LEVELS: PermissionLevel[] = ["none", "view", "edit"];

export const PERMISSION_LEVEL_LABELS: Record<PermissionLevel, string> = {
  none: "No access",
  view: "View only",
  edit: "View + Edit",
};

export interface PermissionModule {
  key: string;
  label: string;
  /** UI grouping for the permissions matrix. */
  group: string;
  /** Nav hrefs this module unlocks for a custom role (first is the primary page). */
  hrefs: string[];
}

export const PERMISSION_MODULES: PermissionModule[] = [
  // People
  { key: "students", label: "Students", group: "People", hrefs: ["/students", "/students/admissions", "/students/promotions", "/students/transfers", "/students/alumni", "/students/documents"] },
  { key: "teachers", label: "Teachers", group: "People", hrefs: ["/teachers", "/teachers/departments", "/teachers/allocation", "/teachers/substitutions"] },
  { key: "staff", label: "Staff & HR", group: "People", hrefs: ["/staff", "/staff/attendance", "/recruitment", "/recruitment/applicants", "/leave", "/leave/balances", "/performance"] },
  { key: "parents", label: "Parents", group: "People", hrefs: ["/parents"] },
  // Academic
  { key: "classes", label: "Classes & Sections", group: "Academic", hrefs: ["/classes"] },
  { key: "subjects", label: "Subjects", group: "Academic", hrefs: ["/subjects"] },
  { key: "timetable", label: "Timetable", group: "Academic", hrefs: ["/timetable"] },
  { key: "attendance", label: "Attendance", group: "Academic", hrefs: ["/attendance"] },
  { key: "holidays", label: "Holidays", group: "Academic", hrefs: ["/holidays"] },
  { key: "exams", label: "Examinations", group: "Academic", hrefs: ["/exams", "/exams/schedule", "/exams/admit-cards", "/exams/marks", "/exams/report-cards", "/exams/merit-list"] },
  { key: "assignments", label: "Assignments", group: "Academic", hrefs: ["/assignments"] },
  { key: "syllabus", label: "Syllabus", group: "Academic", hrefs: ["/syllabus"] },
  { key: "lms", label: "LMS (online classes & material)", group: "Academic", hrefs: ["/lms", "/lms/classes", "/lms/material"] },
  { key: "certificates", label: "Certificates", group: "Academic", hrefs: ["/certificates"] },
  // Finance
  { key: "fees", label: "Fees", group: "Finance", hrefs: ["/fees", "/fees/structure", "/fees/collect", "/fees/receipts", "/fees/defaulters", "/fees/scholarships"] },
  { key: "expenses", label: "Expenses", group: "Finance", hrefs: ["/expenses"] },
  { key: "payroll", label: "Payroll", group: "Finance", hrefs: ["/payroll"] },
  // Operations
  { key: "transport", label: "Transport", group: "Operations", hrefs: ["/transport"] },
  { key: "hostel", label: "Hostel", group: "Operations", hrefs: ["/hostel"] },
  { key: "library", label: "Library", group: "Operations", hrefs: ["/library"] },
  { key: "inventory", label: "Inventory", group: "Operations", hrefs: ["/inventory"] },
  { key: "canteen", label: "Canteen", group: "Operations", hrefs: ["/canteen"] },
  { key: "health", label: "Health / Infirmary", group: "Operations", hrefs: ["/health"] },
  { key: "labs", label: "Labs", group: "Operations", hrefs: ["/labs"] },
  // Communication
  { key: "announcements", label: "Announcements", group: "Communication", hrefs: ["/announcements"] },
  { key: "messages", label: "Messages", group: "Communication", hrefs: ["/messages"] },
  { key: "notices", label: "Notices", group: "Communication", hrefs: ["/notices"] },
  { key: "events", label: "Events", group: "Communication", hrefs: ["/events"] },
  { key: "visitors", label: "Visitors", group: "Communication", hrefs: ["/visitors"] },
  // Insights
  { key: "analytics", label: "Analytics & dashboards", group: "Insights", hrefs: ["/analytics"] },
  { key: "ai", label: "AI Assistant", group: "Insights", hrefs: ["/ai"] },
];

/** The permission map a user carries: moduleKey -> level. Absent = "none". */
export type PermissionMap = Record<string, PermissionLevel>;

/** Every grantable module at "edit" — the full-access template. */
const ALL_EDIT: PermissionMap = Object.fromEntries(
  PERMISSION_MODULES.map((m) => [m.key, "edit" as PermissionLevel])
);

export interface BuiltinRoleInfo {
  /** The UserRole literal. */
  role: string;
  name: string;
  note: string;
  /** A sensible default access profile, used as the starting point when cloning. */
  defaultPermissions: PermissionMap;
}

/**
 * The built-in roles shown (read-only) in Roles & Permissions, so an admin can
 * see what each covers and CLONE one into an editable custom role. super_admin is
 * deliberately absent — it's the SchoolDeck platform owner, never a school role.
 * These profiles are a convenient starting point for a clone, not the exact
 * hardcoded gating (which stays fixed for the built-in roles themselves).
 */
export const BUILTIN_ROLES: BuiltinRoleInfo[] = [
  { role: "school_admin", name: "School Admin", note: "Account owner — full access to everything.", defaultPermissions: ALL_EDIT },
  { role: "principal", name: "Principal", note: "Runs the school day-to-day; full access minus billing & security.", defaultPermissions: ALL_EDIT },
  {
    role: "accountant",
    name: "Accountant",
    note: "Finance — fees, expenses, payroll.",
    defaultPermissions: { fees: "edit", expenses: "edit", payroll: "edit", analytics: "view", students: "view" },
  },
  {
    role: "teacher",
    name: "Teacher",
    note: "Teaching — classes, attendance, marks, assignments, material.",
    defaultPermissions: {
      students: "view", classes: "view", subjects: "view", timetable: "view",
      attendance: "edit", exams: "edit", assignments: "edit", syllabus: "edit",
      lms: "edit", messages: "edit", announcements: "view",
    },
  },
  { role: "librarian", name: "Librarian", note: "Library circulation.", defaultPermissions: { library: "edit" } },
  { role: "driver", name: "Driver", note: "Transport routes.", defaultPermissions: { transport: "view" } },
  { role: "staff", name: "Staff", note: "General staff — minimal, mostly self-service.", defaultPermissions: {} },
  { role: "parent", name: "Parent", note: "Parent portal — their children's information.", defaultPermissions: {} },
  { role: "student", name: "Student", note: "Student portal.", defaultPermissions: {} },
];

/** Every signed-in user can reach their dashboard, whatever their permissions. */
export const ALWAYS_ALLOWED_HREFS = ["/dashboard"];

const norm = (p: string) => (p.endsWith("/") && p.length > 1 ? p.slice(0, -1) : p);

/** The nav hrefs a custom role may see, from its permission map (view or edit). */
export function allowedHrefsForPermissions(permissions: PermissionMap | undefined): Set<string> {
  const set = new Set<string>(ALWAYS_ALLOWED_HREFS);
  if (!permissions) return set;
  for (const mod of PERMISSION_MODULES) {
    const level = permissions[mod.key];
    if (level === "view" || level === "edit") mod.hrefs.forEach((h) => set.add(h));
  }
  return set;
}

/** Whether a custom role (with these permissions) may open a path. */
export function customRoleCanAccessPath(
  permissions: PermissionMap | undefined,
  pathname: string
): boolean {
  const allowed = allowedHrefsForPermissions(permissions);
  const path = norm(pathname);
  for (const href of allowed) {
    const h = norm(href);
    if (path === h || path.startsWith(h + "/")) return true;
  }
  return false;
}

/** Whether these permissions grant edit (write) on the module owning a path. */
export function customRoleCanEditPath(
  permissions: PermissionMap | undefined,
  pathname: string
): boolean {
  if (!permissions) return false;
  const path = norm(pathname);
  for (const mod of PERMISSION_MODULES) {
    if (permissions[mod.key] !== "edit") continue;
    if (mod.hrefs.some((h) => path === norm(h) || path.startsWith(norm(h) + "/"))) return true;
  }
  return false;
}

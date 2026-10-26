/**
 * The catalog of grantable "sections" (modules) a custom role's permissions are
 * expressed over. Each module maps to the API path prefixes it owns, so a single
 * gate (see middleware/auth.ts `customRolePermissionGate`) can authorise any
 * request by matching its path to a module and checking the role's level.
 *
 * The KEYS here are the contract shared with the frontend catalog
 * (frontend/src/lib/permissions.ts) — keep the two in lockstep.
 *
 * Deliberately EXCLUDED (owner-only, never grantable to a custom role): user
 * management, security, subscription/billing, workflow builder, mobile apps,
 * platform-admin and school settings. Those stay with the account owner.
 */

export type PermissionLevel = "none" | "view" | "edit";

export interface PermissionModule {
  key: string;
  label: string;
  /** API path prefixes this module owns (matched against req.path). */
  apiPrefixes: string[];
  /** When true, any granted level (view) may also write — e.g. using the AI assistant. */
  writeAtView?: boolean;
}

export const PERMISSION_MODULES: PermissionModule[] = [
  { key: "students", label: "Students", apiPrefixes: ["/api/students", "/api/admissions", "/api/transfers", "/api/alumni", "/api/student-documents"] },
  { key: "teachers", label: "Teachers", apiPrefixes: ["/api/teachers", "/api/departments", "/api/allocations", "/api/substitutions"] },
  { key: "staff", label: "Staff & HR", apiPrefixes: ["/api/staff", "/api/staff-attendance", "/api/job-postings", "/api/applications", "/api/leave-requests"] },
  { key: "parents", label: "Parents", apiPrefixes: ["/api/parents"] },
  { key: "classes", label: "Classes & Sections", apiPrefixes: ["/api/classes"] },
  { key: "subjects", label: "Subjects", apiPrefixes: ["/api/subjects"] },
  { key: "timetable", label: "Timetable", apiPrefixes: ["/api/timetable"] },
  { key: "attendance", label: "Attendance", apiPrefixes: ["/api/attendance"] },
  { key: "holidays", label: "Holidays", apiPrefixes: ["/api/holidays"] },
  { key: "exams", label: "Examinations", apiPrefixes: ["/api/exams", "/api/exam-schedule", "/api/marks"] },
  { key: "assignments", label: "Assignments", apiPrefixes: ["/api/assignments"] },
  { key: "syllabus", label: "Syllabus", apiPrefixes: ["/api/syllabus"] },
  { key: "lms", label: "LMS (online classes & material)", apiPrefixes: ["/api/online-classes", "/api/study-material"] },
  { key: "certificates", label: "Certificates", apiPrefixes: ["/api/certificates"] },
  { key: "fees", label: "Fees", apiPrefixes: ["/api/fees", "/api/fee-structures", "/api/scholarships"] },
  { key: "expenses", label: "Expenses", apiPrefixes: ["/api/expenses"] },
  { key: "payroll", label: "Payroll", apiPrefixes: ["/api/payroll"] },
  { key: "transport", label: "Transport", apiPrefixes: ["/api/bus-routes"] },
  { key: "hostel", label: "Hostel", apiPrefixes: ["/api/hostel-students"] },
  { key: "library", label: "Library", apiPrefixes: ["/api/books", "/api/book-issues"] },
  { key: "inventory", label: "Inventory", apiPrefixes: ["/api/inventory"] },
  { key: "canteen", label: "Canteen", apiPrefixes: ["/api/menu-items"] },
  { key: "health", label: "Health / Infirmary", apiPrefixes: ["/api/patients", "/api/medicines"] },
  { key: "labs", label: "Labs", apiPrefixes: ["/api/labs"] },
  { key: "announcements", label: "Announcements", apiPrefixes: ["/api/announcements"] },
  { key: "messages", label: "Messages", apiPrefixes: ["/api/messages"] },
  { key: "notices", label: "Notices", apiPrefixes: ["/api/notices"] },
  { key: "events", label: "Events", apiPrefixes: ["/api/events"] },
  { key: "visitors", label: "Visitors", apiPrefixes: ["/api/visitors"] },
  { key: "analytics", label: "Analytics & dashboards", apiPrefixes: ["/api/dashboard"] },
  { key: "ai", label: "AI Assistant", apiPrefixes: ["/api/ai"], writeAtView: true },
];

/** Valid module keys, for validating a role's permission map. */
export const PERMISSION_MODULE_KEYS: string[] = PERMISSION_MODULES.map((m) => m.key);

/**
 * Tenant API paths every signed-in user may use regardless of role — profile,
 * session, notifications, the school's own identity (document headers) and the
 * shared document service. These are never module-gated.
 */
export const CUSTOM_ROLE_BASELINE_PREFIXES: string[] = ["/api/documents"];

const norm = (p: string) => (p.endsWith("/") ? p.slice(0, -1) : p);

/** True when `path` is `prefix` or a sub-path of it (prefix-boundary aware). */
function underPrefix(path: string, prefix: string): boolean {
  const a = norm(path);
  const b = norm(prefix);
  return a === b || a.startsWith(b + "/");
}

/** The module that owns a request path, or null if none does. */
export function moduleForPath(path: string): PermissionModule | null {
  for (const m of PERMISSION_MODULES) {
    if (m.apiPrefixes.some((pre) => underPrefix(path, pre))) return m;
  }
  return null;
}

/** Whether a path is always allowed for any signed-in user (not module-gated). */
export function isBaselinePath(path: string): boolean {
  return CUSTOM_ROLE_BASELINE_PREFIXES.some((pre) => underPrefix(path, pre));
}

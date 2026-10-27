/**
 * Subscription TIERS — per-student pricing plus the feature (module) set each tier
 * unlocks. Module keys match the RBAC catalog (modules/roles/permissionModules.ts),
 * so the tier gate can reuse `moduleForPath` to decide, per SCHOOL, whether a
 * requested module is in that school's plan.
 *
 * Tiers are cumulative: Standard = Starter + more, Premium = everything.
 */

export type Tier = "starter" | "standard" | "premium";
export const TIERS_ORDER: Tier[] = ["starter", "standard", "premium"];

// Core school operations — every school needs these from day one.
const STARTER_MODULES = [
  "students", "teachers", "staff", "parents",
  "classes", "subjects", "timetable", "attendance", "holidays",
  "fees",
  "announcements", "notices", "messages", "certificates",
];

// + academics, LMS and the main operations.
const STANDARD_MODULES = [
  ...STARTER_MODULES,
  "exams", "assignments", "syllabus", "lms",
  "library", "transport", "hostel", "events", "visitors",
];

// Everything, incl. finance depth, AI and analytics.
const PREMIUM_MODULES = [
  ...STANDARD_MODULES,
  "expenses", "payroll", "inventory", "canteen", "health", "labs",
  "analytics", "ai",
];

export interface TierDef {
  id: Tier;
  name: string;
  blurb: string;
  /** ₹ per student per month (yearly bills 10 months — 2 free). */
  perStudentMonthlyInr: number;
  perStudentYearlyInr: number;
  /** Module keys this tier unlocks (cumulative). */
  modules: string[];
}

export const TIERS: TierDef[] = [
  {
    id: "starter",
    name: "Starter",
    blurb: "Core school operations — students, staff, attendance, fees and communication.",
    perStudentMonthlyInr: 10,
    perStudentYearlyInr: 100,
    modules: STARTER_MODULES,
  },
  {
    id: "standard",
    name: "Standard",
    blurb: "Everything in Starter plus exams, LMS, library, transport and hostel.",
    perStudentMonthlyInr: 12,
    perStudentYearlyInr: 120,
    modules: STANDARD_MODULES,
  },
  {
    id: "premium",
    name: "Premium",
    blurb: "The complete suite — AI, analytics, payroll, inventory, health and labs.",
    perStudentMonthlyInr: 15,
    perStudentYearlyInr: 150,
    modules: PREMIUM_MODULES,
  },
];

export function tierDef(id: string | null | undefined): TierDef | null {
  return TIERS.find((t) => t.id === id) ?? null;
}

/** Whether a tier unlocks a module key. Premium unlocks everything. */
export function tierAllowsModule(tier: Tier, moduleKey: string): boolean {
  const def = tierDef(tier);
  return def ? def.modules.includes(moduleKey) : false;
}

/** The per-student price for a tier + billing cycle, in rupees. */
export function tierPriceInr(tier: Tier, cycle: "monthly" | "yearly"): number {
  const def = tierDef(tier);
  if (!def) return 0;
  return cycle === "yearly" ? def.perStudentYearlyInr : def.perStudentMonthlyInr;
}

/** Billed student count floored to a sensible minimum so a tiny school still pays a real amount. */
export const MIN_BILLED_STUDENTS = 20;

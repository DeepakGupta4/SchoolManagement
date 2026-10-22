/**
 * Fee provisioning — the single place that turns a class's fee STRUCTURE plus a
 * student's active SCHOLARSHIPS into the billed heads of a fee account.
 *
 * Each head carries a FREQUENCY (monthly / one-time / per-exam). The ledger bills
 * the SESSION (annual) amount per head — unit × periods (e.g. monthly tuition ×
 * months/year) — and the office collects it in instalments. The per-period `unit`
 * is kept on each head so the collection screen can offer "1 month = ₹unit".
 */
import { FeeStructure, type FeeStructureAttrs } from "../feeStructures/feeStructure.model.js";
import { Scholarship } from "../scholarships/scholarship.model.js";
import { Student, type StudentDoc } from "../students/student.model.js";
import { BusRoute } from "../busRoutes/busRoute.model.js";
import {
  FeeAccount,
  CURRENT_SESSION,
  balanceOf,
  totalPaid,
  type FeeAccountDoc,
} from "./fee.model.js";

export { CURRENT_SESSION };

export type FeeFrequency = "monthly" | "one-time" | "per-exam";

export interface GrossHead {
  head: string;
  /** Session (annual) amount = unit × periods. */
  billed: number;
  frequency: FeeFrequency;
  /** Per-period amount (e.g. one month's tuition); the collection unit. */
  unit: number;
}

/**
 * Legacy fee-structure columns → head names, for structures created before the
 * flexible `heads` array existed.
 */
const STRUCTURE_HEADS = [
  { key: "tuition", label: "Tuition" },
  { key: "transport", label: "Transport" },
  { key: "lab", label: "Lab" },
  { key: "library", label: "Library" },
  { key: "sports", label: "Sports" },
  { key: "misc", label: "Misc" },
] as const;

/** The canonical transport head name (billed per student from their bus route). */
export const TRANSPORT_HEAD = "Transport";

/** How many times a frequency is charged across a session. */
function periodsFor(freq: FeeFrequency, months: number, exams: number): number {
  return freq === "monthly" ? months : freq === "per-exam" ? exams : 1;
}

/** A sensible frequency for a legacy/unknown head name. */
function freqForName(name: string): FeeFrequency {
  const n = name.trim().toLowerCase();
  if (n.includes("tuition") || n.includes("transport")) return "monthly";
  // Exam fee and report-card fee are separate heads, both charged per exam/term.
  if (n.includes("exam") || n.includes("report card")) return "per-exam";
  return "one-time";
}

function monthsOf(structure: FeeStructureAttrs): number {
  return Math.max(1, Math.round(Number(structure.monthsPerYear ?? 12)));
}
function examsOf(structure: FeeStructureAttrs): number {
  return Math.max(0, Math.round(Number(structure.examsPerYear ?? 3)));
}

/**
 * Non-zero billed heads derived from a fee structure, ANNUALISED by frequency
 * (unit × periods). New structures carry a flexible `heads` array; structures
 * created before that are read from the legacy fixed columns as a fallback.
 */
export function deriveGrossHeads(structure: FeeStructureAttrs | null | undefined): GrossHead[] {
  if (!structure) return [];
  const months = monthsOf(structure);
  const exams = examsOf(structure);
  const flexible = (structure.heads ?? []) as { name: string; amount: number; frequency?: string }[];
  if (flexible.length > 0) {
    const mapped = flexible
      .map((h) => {
        const head = String(h.name ?? "").trim();
        const unit = Math.max(0, Math.round(Number(h.amount) || 0));
        const frequency = (h.frequency as FeeFrequency) || freqForName(head);
        return { head, unit, frequency, billed: unit * periodsFor(frequency, months, exams) };
      })
      .filter((h) => h.head.length > 0 && h.billed > 0);
    // Only trust the flexible heads when they actually bill something; if a heads
    // array nets to nothing (all zeroed) fall through to the legacy columns.
    if (mapped.length > 0) return mapped;
  }
  // Legacy fixed columns were ALWAYS billed once as the stored amount — they were
  // never per-period units. Keep billing them once (one-time) so an old structure
  // is not silently annualised (×12) the moment it's read; that would 12× a real
  // tenant's tuition/transport dues. Schools migrate to flexible heads to get true
  // monthly instalments.
  return STRUCTURE_HEADS.map(({ key, label }) => {
    const unit = Math.max(0, Math.round(Number(structure[key]) || 0));
    return { head: label, unit, frequency: "one-time" as FeeFrequency, billed: unit };
  }).filter((h) => h.billed > 0);
}

/**
 * Applies per-student transport billing. Transport is NOT a flat class fee: a
 * student who rides the bus is billed their ROUTE's monthly fee × months. So:
 *   - not required           → drop any Transport head (they don't take the bus);
 *   - a route fee is set     → bill it (annualised);
 *   - required but no route   → fall back to the structure's flat Transport head.
 */
export function applyTransportHead(
  gross: GrossHead[],
  opts: { transportRequired?: boolean | null; routeFee?: number | null; monthsPerYear?: number }
): GrossHead[] {
  const isTransport = (h: GrossHead) => h.head.trim().toLowerCase() === TRANSPORT_HEAD.toLowerCase();
  const rest = gross.filter((h) => !isTransport(h));
  if (!opts.transportRequired) return rest;
  const fallback = gross.find(isTransport);
  if (opts.routeFee != null && opts.routeFee > 0) {
    const months = Math.max(1, Math.round(Number(opts.monthsPerYear ?? 12)));
    const unit = Math.round(opts.routeFee);
    return [...rest, { head: TRANSPORT_HEAD, billed: unit * months, unit, frequency: "monthly" }];
  }
  return fallback ? [...rest, fallback] : rest;
}

/** Deducts a concession off the billed heads in order, so the balance nets it out. */
export function applyConcession(heads: GrossHead[], concession: number): GrossHead[] {
  let left = Math.max(0, Math.round(concession));
  return heads.map((h) => {
    if (left <= 0) return h;
    const cut = Math.min(h.billed, left);
    left -= cut;
    return { ...h, billed: h.billed - cut };
  });
}

/**
 * Finds the fee structure covering a class, matched exactly but
 * case-insensitively (the admission form matches the same way).
 */
export async function matchStructure(schoolId: string, className: string) {
  const name = (className ?? "").trim();
  if (!name) return null;
  const rx = new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
  return FeeStructure.findOne({ schoolId, class: rx });
}

/** Sum of ACTIVE scholarship waivers linked to a student (by studentId). */
export async function scholarshipConcessionFor(
  schoolId: string,
  studentId: string
): Promise<number> {
  const rows = await Scholarship.find({ schoolId, studentId, status: "active" });
  return rows.reduce((sum, r) => sum + Math.max(0, Math.round(Number(r.amount) || 0)), 0);
}

/** The net (concession-applied) heads and concession a student should be billed. */
export function netHeadsFor(gross: GrossHead[], concession: number) {
  const grossTotal = gross.reduce((sum, h) => sum + h.billed, 0);
  const applied = Math.min(Math.max(0, Math.round(concession)), grossTotal);
  const heads = applyConcession(gross, applied).filter((h) => h.billed > 0);
  return { heads, concession: applied };
}

export interface AccountHead {
  head: string;
  billed: number;
  paid: number;
  frequency: FeeFrequency;
  unit: number;
}

/** A GrossHead turned into a freshly-billed account head (nothing paid yet). */
export function toAccountHeads(heads: GrossHead[]): AccountHead[] {
  return heads.map((h) => ({ head: h.head, billed: h.billed, paid: 0, frequency: h.frequency, unit: h.unit }));
}

/**
 * A read-only fee-account view for a student who has no stored account yet —
 * billed from the class fee structure, net of any active scholarship.
 */
export interface ProvisionalAccount {
  id: string;
  studentId: string;
  admissionNo: string;
  name: string;
  className: string;
  section: string;
  rollNo: string;
  guardian: string;
  guardianPhone: string;
  session: string;
  heads: AccountHead[];
  concession: number;
  lateFee: number;
  lastPaymentDate: string | null;
  dueDate: string | null;
  provisional: true;
}

export function provisionalAccountFor(
  student: StudentDoc,
  gross: GrossHead[],
  concession: number
): ProvisionalAccount {
  const net = netHeadsFor(gross, concession);
  return {
    id: String(student._id),
    studentId: String(student._id),
    admissionNo: student.admissionNo,
    name: `${student.firstName} ${student.lastName}`.trim(),
    className: student.className,
    section: student.section,
    rollNo: student.rollNo,
    guardian: student.guardian.name,
    guardianPhone: student.guardian.phone,
    session: CURRENT_SESSION,
    heads: toAccountHeads(net.heads),
    concession: net.concession,
    lateFee: 0,
    lastPaymentDate: null,
    dueDate: null,
    provisional: true,
  };
}

/**
 * Re-derives and rewrites a student's fee account so it reflects their current
 * active scholarships. Called after a scholarship is created, edited or removed.
 *
 * Deliberately conservative: it only touches an account that has NOT collected
 * anything yet, and only when the class has a fee structure to reconstruct the
 * gross bill from. Once collection has begun, or with no structure to rebuild
 * from, the concession is left exactly as it was so a ledger is never disturbed.
 */
export async function syncStudentConcession(
  schoolId: string,
  studentId: string | null | undefined
): Promise<void> {
  if (!studentId) return;

  const account = await FeeAccount.findOne({ schoolId, studentId, session: CURRENT_SESSION });
  if (!account) return; // accountless students are billed live at read/collect time
  if (totalPaid(account) > 0) return; // never disturb a ledger that has collections

  const student = await Student.findOne({ _id: studentId, schoolId });
  if (!student) return;

  const structure = await matchStructure(schoolId, student.className);
  if (!structure) return; // no gross to reconstruct the bill from

  const route =
    student.transportRequired && student.transportRouteCode
      ? await BusRoute.findOne({ schoolId, code: student.transportRouteCode })
      : null;
  const gross = applyTransportHead(deriveGrossHeads(structure), {
    transportRequired: student.transportRequired,
    routeFee: route?.fee ?? null,
    monthsPerYear: monthsOf(structure),
  });
  const grossTotal = gross.reduce((sum, h) => sum + h.billed, 0);

  // Only re-bill an account that was actually billed FROM this structure — its
  // current gross (net heads + the concession baked out of them) equals the
  // structure total. A custom or lump-sum bill is left untouched.
  const accountGross =
    account.heads.reduce((sum, h) => sum + h.billed, 0) + (account.concession ?? 0);
  if (accountGross !== grossTotal) return;

  const concession = await scholarshipConcessionFor(schoolId, studentId);
  const net = netHeadsFor(gross, concession);

  account.set("heads", toAccountHeads(net.heads));
  account.concession = net.concession;
  await account.save();

  student.feeDue = balanceOf(account as FeeAccountDoc);
  await student.save();
}

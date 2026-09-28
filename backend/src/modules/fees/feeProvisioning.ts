/**
 * Fee provisioning — the single place that turns a class's fee STRUCTURE plus a
 * student's active SCHOLARSHIPS into the billed heads of a fee account.
 *
 * Historically a fee account only existed once someone opened it (at admission
 * or from the Fees screens), so students admitted before that step had no
 * account at all and never appeared on the collection screen. These helpers let
 * every screen work from the class's real students instead: an account is
 * synthesised for display and lazily created the moment money is actually
 * collected, always billed from the same source of truth.
 */
import { FeeStructure, type FeeStructureAttrs } from "../feeStructures/feeStructure.model.js";
import { Scholarship } from "../scholarships/scholarship.model.js";
import { Student, type StudentDoc } from "../students/student.model.js";
import {
  FeeAccount,
  CURRENT_SESSION,
  balanceOf,
  totalPaid,
  type FeeAccountDoc,
} from "./fee.model.js";

export { CURRENT_SESSION };

export interface GrossHead {
  head: string;
  billed: number;
}

/**
 * Fee-structure columns → the head names billed on the ledger, in the order a
 * concession is netted off (earliest first). The labels MUST match the ones the
 * admission form bills with, so a structure billed there and one derived here
 * produce the same heads. See `StudentFormModal.buildFeeHeads` on the frontend.
 */
const STRUCTURE_HEADS = [
  { key: "tuition", label: "Tuition" },
  { key: "transport", label: "Transport" },
  { key: "lab", label: "Lab" },
  { key: "library", label: "Library" },
  { key: "sports", label: "Sports" },
  { key: "misc", label: "Misc" },
] as const;

/** Non-zero billed heads derived from a fee structure. */
export function deriveGrossHeads(structure: FeeStructureAttrs | null | undefined): GrossHead[] {
  if (!structure) return [];
  return STRUCTURE_HEADS.map(({ key, label }) => ({
    head: label,
    billed: Math.max(0, Math.round(Number(structure[key]) || 0)),
  })).filter((h) => h.billed > 0);
}

/** Deducts a concession off the billed heads in order, so the balance nets it out. */
export function applyConcession(heads: GrossHead[], concession: number): GrossHead[] {
  let left = Math.max(0, Math.round(concession));
  return heads.map((h) => {
    if (left <= 0) return h;
    const cut = Math.min(h.billed, left);
    left -= cut;
    return { head: h.head, billed: h.billed - cut };
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

/**
 * A read-only fee-account view for a student who has no stored account yet —
 * billed from the class fee structure, net of any active scholarship. Marked
 * `provisional` so the client knows the account will be created on first
 * collection. Its `id` is the student id, which keeps list rows uniquely keyed.
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
  heads: { head: string; billed: number; paid: number }[];
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
    heads: net.heads.map((h) => ({ head: h.head, billed: h.billed, paid: 0 })),
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

  const gross = deriveGrossHeads(structure);
  const grossTotal = gross.reduce((sum, h) => sum + h.billed, 0);

  // Only re-bill an account that was actually billed FROM this structure — its
  // current gross (net heads + the concession baked out of them) equals the
  // structure total. A custom or lump-sum bill is left untouched so we never
  // silently replace a manually-set amount.
  const accountGross =
    account.heads.reduce((sum, h) => sum + h.billed, 0) + (account.concession ?? 0);
  if (accountGross !== grossTotal) return;

  const concession = await scholarshipConcessionFor(schoolId, studentId);
  const net = netHeadsFor(gross, concession);

  account.set(
    "heads",
    net.heads.map((h) => ({ head: h.head, billed: h.billed, paid: 0 }))
  );
  account.concession = net.concession;
  await account.save();

  student.feeDue = balanceOf(account as FeeAccountDoc);
  await student.save();
}

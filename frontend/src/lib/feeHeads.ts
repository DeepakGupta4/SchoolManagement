import {
  structureHeads,
  periodsFor,
  DEFAULT_EXAMS_PER_YEAR,
  DEFAULT_MONTHS_PER_YEAR,
  type FeeFrequency,
  type FeeStructure,
} from "@/lib/api/feeStructures";

/**
 * Shared fee-head builder — the single client-side mirror of the backend
 * `deriveGrossHeads` + `applyTransportHead`, used by BOTH the admission form and
 * the fee-setup screen so the two always ask the server to bill the same thing.
 */

export type FeeMode = "none" | "structure" | "custom";

/** One billed account head — annual `billed` plus the per-period `unit`/`frequency`. */
export interface BuiltFeeHead {
  head: string;
  /** Session (annual) amount = unit × periods. */
  billed: number;
  frequency: FeeFrequency;
  unit: number;
}

/**
 * The billed fee heads to open the account with — either every non-zero head of
 * the chosen structure (ANNUALISED by frequency, with transport applied
 * per-student), or a single "Tuition Fee" head for a lump-sum total. The
 * concession is applied server-side, so heads here are the gross amounts.
 *
 * Each head is annualised exactly like the backend `deriveGrossHeads`: the
 * per-period amount × how many times it recurs (monthly × months, per-exam ×
 * exams, one-time × 1). The per-period `unit` is kept so the collect screen can
 * take one instalment at a time.
 *
 * Transport is NOT a flat structure head: a student who rides the bus is billed
 * their ROUTE's fee × months. The transport step mirrors the backend
 * `applyTransportHead` EXACTLY, so the account opened here matches what the
 * server would bill the same student.
 */
export function buildFeeHeads(
  mode: FeeMode,
  structure: FeeStructure | null,
  total: number,
  transport: { required: boolean; routeFee: number | null }
): BuiltFeeHead[] {
  if (mode === "structure" && structure) {
    const months = structure.monthsPerYear ?? DEFAULT_MONTHS_PER_YEAR;
    const exams = structure.examsPerYear ?? DEFAULT_EXAMS_PER_YEAR;
    const base: BuiltFeeHead[] = structureHeads(structure).map((h) => {
      // Round the per-period unit FIRST, then annualise — identical to the backend
      // deriveGrossHeads. Otherwise a fractional amount (e.g. 50000/12 = 4166.67)
      // rounds differently here vs the server, so the account opened at admission
      // under-bills by a rupee or two AND syncStudentConcession's gross-equality
      // guard never matches (scholarships then silently never re-apply).
      const unit = Math.max(0, Math.round(h.amount));
      return {
        head: h.name,
        unit,
        frequency: h.frequency,
        billed: unit * periodsFor(h.frequency, months, exams),
      };
    });
    // Mirror backend applyTransportHead: drop any flat "Transport" head, then —
    // only when the student rides the bus — bill their route fee × months,
    // falling back to the structure's flat Transport head when the route has none.
    const isTransport = (h: BuiltFeeHead) => h.head.trim().toLowerCase() === "transport";
    const rest = base.filter((h) => !isTransport(h));
    if (!transport.required) return rest;
    const fallback = base.find(isTransport);
    if (transport.routeFee != null && transport.routeFee > 0) {
      const unit = Math.round(transport.routeFee);
      return [...rest, { head: "Transport", unit, frequency: "monthly", billed: unit * months }];
    }
    return fallback ? [...rest, fallback] : rest;
  }
  if (mode === "custom" && total > 0) {
    const unit = Math.round(total);
    return [{ head: "Tuition Fee", billed: unit, frequency: "one-time", unit }];
  }
  return [];
}

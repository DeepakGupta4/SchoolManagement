/**
 * Date helpers and bounds for `<input type="date">` fields and their schemas.
 *
 * A native date input otherwise accepts up to a 6-digit year (e.g. 444444),
 * so every date field gets a min/max bound in the UI plus a matching schema
 * check here.
 */

const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * Today as yyyy-mm-dd in LOCAL time, re-evaluated on every call.
 *
 * `toISOString()` is UTC: for an IST user (UTC+5:30), between local midnight and
 * 05:30 it reports YESTERDAY's date — which would mark today's exam "upcoming",
 * a fee due today "not overdue", and reject a today-dated record as "in the
 * future". Computing from the local calendar fixes that, and being a FUNCTION
 * (not a frozen const) means a tab left open past midnight rolls over correctly.
 */
export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/**
 * Today as yyyy-mm-dd (local), captured at module load. Fine for `<input>`
 * min/max bounds and form defaults; for freshness-critical comparisons (exam /
 * fee / assignment status, future-date validation) call `todayIso()` instead.
 */
export const TODAY_ISO = todayIso();

/**
 * Current Indian academic year (Apr–Mar) derived from `iso` (local today by
 * default). Returns a session label ("2026-27") and the matching validity date
 * ("31 Mar 2027") — used for ID cards so the year is never hardcoded/stale.
 */
export function academicYear(iso: string = TODAY_ISO): { label: string; validTill: string } {
  const y = Number(iso.slice(0, 4));
  const m = Number(iso.slice(5, 7));
  const start = m >= 4 ? y : y - 1;
  const end = start + 1;
  return { label: `${start}-${String(end).slice(2)}`, validTill: `31 Mar ${end}` };
}

/** yyyy-mm-dd for `years` before today, in local time. */
export function isoYearsAgo(years: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** DOB bounds for an adult (teacher / staff): 18–100 years old. */
export const MIN_ADULT_DOB = isoYearsAgo(100);
export const MAX_ADULT_DOB = isoYearsAgo(18);

/** DOB bounds for a student: 2–25 years old (nursery through senior). */
export const MIN_STUDENT_DOB = isoYearsAgo(25);
export const MAX_STUDENT_DOB = isoYearsAgo(2);

/** Earliest sensible joining/admission date. */
export const MIN_RECORD_DATE = "1970-01-01";

/**
 * True for a real yyyy-mm-dd string with a 4-digit year (rejects 444444) AND a
 * valid calendar day. `Date.parse` alone silently rolls over impossible dates
 * ("2021-02-30" → Mar 2, "2023-02-29" → Mar 1), so we rebuild the date and
 * require every component to round-trip — otherwise a bad CSV import stores a
 * date that later renders as a different month.
 */
export function isValidDateString(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const year = Number(s.slice(0, 4));
  const month = Number(s.slice(5, 7));
  const day = Number(s.slice(8, 10));
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  // Build at UTC noon so no timezone offset can shift the calendar day.
  const dt = new Date(Date.UTC(year, month - 1, day, 12));
  return (
    dt.getUTCFullYear() === year && dt.getUTCMonth() === month - 1 && dt.getUTCDate() === day
  );
}

/** ISO date strings compare correctly as plain strings (fixed yyyy-mm-dd). */
export function isWithin(s: string, min: string, max: string): boolean {
  return s >= min && s <= max;
}

const WEEKDAYS = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
] as const;

/**
 * Weekday name ("Monday"…) for a yyyy-mm-dd string, or "" if invalid. Built at
 * UTC noon (like the validators above) so no timezone offset shifts the day, and
 * deterministic from its input — safe to call in render / useMemo.
 */
export function weekdayName(s: string): string {
  if (!isValidDateString(s)) return "";
  const year = Number(s.slice(0, 4));
  const month = Number(s.slice(5, 7));
  const day = Number(s.slice(8, 10));
  return WEEKDAYS[new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay()] ?? "";
}

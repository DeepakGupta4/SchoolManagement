/**
 * Date helpers and bounds for `<input type="date">` fields and their schemas.
 *
 * A native date input otherwise accepts up to a 6-digit year (e.g. 444444),
 * so every date field gets a min/max bound in the UI plus a matching schema
 * check here. The bounds are computed once at module load — good enough, since
 * they only shift by a day.
 */

/** Today as yyyy-mm-dd (local). */
export const TODAY_ISO = new Date().toISOString().slice(0, 10);

/** yyyy-mm-dd for `years` before today. */
export function isoYearsAgo(years: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().slice(0, 10);
}

/** DOB bounds for an adult (teacher / staff): 18–100 years old. */
export const MIN_ADULT_DOB = isoYearsAgo(100);
export const MAX_ADULT_DOB = isoYearsAgo(18);

/** DOB bounds for a student: 2–25 years old (nursery through senior). */
export const MIN_STUDENT_DOB = isoYearsAgo(25);
export const MAX_STUDENT_DOB = isoYearsAgo(2);

/** Earliest sensible joining/admission date. */
export const MIN_RECORD_DATE = "1970-01-01";

/** True for a real yyyy-mm-dd string with a 4-digit year (rejects 444444). */
export function isValidDateString(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  return !Number.isNaN(Date.parse(s));
}

/** ISO date strings compare correctly as plain strings (fixed yyyy-mm-dd). */
export function isWithin(s: string, min: string, max: string): boolean {
  return s >= min && s <= max;
}

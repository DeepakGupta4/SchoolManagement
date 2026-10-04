/** Shared date validation for route schemas (students, teachers, …). */

export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * A real calendar date, not just a regex-shaped string. `Date.parse` silently
 * rolls impossible dates over ("2021-02-30" → Mar 2), so rebuild the date and
 * require every component to round-trip.
 */
export function isRealDate(s: string): boolean {
  if (!ISO_DATE.test(s)) return false;
  const y = Number(s.slice(0, 4));
  const mo = Number(s.slice(5, 7));
  const d = Number(s.slice(8, 10));
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, mo - 1, d, 12));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

/** Server-UTC "today" — fine as the upper bound for a date always in the past (DOB). */
export const serverToday = () => new Date().toISOString().slice(0, 10);

/**
 * Upper bound for "today"-ish fields. The frontend computes "today" in LOCAL time;
 * a UTC server clock can be a day behind for UTC-ahead users (e.g. IST before
 * 05:30), which would reject a default-dated (local-today) record. One day of
 * grace absorbs that offset.
 */
export const maxToday = () => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};

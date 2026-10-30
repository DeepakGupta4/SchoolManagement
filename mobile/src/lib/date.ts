/** Calendar-date helpers (local timezone), kept apart from relative time. */

/** Device-local date as YYYY-MM-DD (NOT UTC, so it never slips a day). */
export function todayIso(d: Date = new Date()): string {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

/** Shift a YYYY-MM-DD by n days. */
export function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return todayIso(d);
}

/** Sunday is the weekly holiday. */
export function isSundayIso(iso: string): boolean {
  return new Date(`${iso}T00:00:00`).getDay() === 0;
}

/** "Mon, 28 Oct" for display. */
export function prettyDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

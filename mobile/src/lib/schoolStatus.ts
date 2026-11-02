import { todayIso, isSundayIso } from "./date";

// Must match the web dashboard badge defaults (frontend dashboard page).
const DEFAULT_OPENING = "08:00";
const DEFAULT_CLOSING = "15:00";

/** "14:30" → "2:30 PM". */
function to12h(hhmm: string): string {
  const [h, m] = hhmm.split(":");
  let hour = Number(h);
  const suffix = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${m ?? "00"} ${suffix}`;
}

export interface SchoolStatus {
  open: boolean;
  /** Short label for the hero chip: "Open" or "Closed". */
  label: string;
  /** Why it's closed (Sunday / holiday name / "Reopens 3:00 PM"), else null. */
  reason: string | null;
}

/**
 * Today's Open/Closed state — MIRRORS the web dashboard badge so the app and the
 * website never disagree: a Sunday or a recorded holiday closes the whole day;
 * otherwise the school's opening/closing window is checked against the current
 * local time (so it reads "Closed" outside school hours, not a misleading "Open").
 */
export function computeSchoolStatus(params: {
  openingTime?: string | null;
  closingTime?: string | null;
  holidays: { date: string; name?: string }[];
  now?: Date;
}): SchoolStatus {
  const today = todayIso();
  const now = params.now ?? new Date();

  if (isSundayIso(today)) return { open: false, label: "Closed", reason: "Sunday" };
  const holiday = params.holidays.find((h) => h.date === today);
  if (holiday) return { open: false, label: "Closed", reason: holiday.name ?? "Holiday" };

  const open = (params.openingTime || "").trim() || DEFAULT_OPENING;
  const close = (params.closingTime || "").trim() || DEFAULT_CLOSING;
  const cur = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  // Handle a window that crosses midnight too, exactly like the web.
  const within = open <= close ? cur >= open && cur < close : cur >= open || cur < close;
  if (within) return { open: true, label: "Open", reason: null };

  return { open: false, label: "Closed", reason: cur < open ? `Opens ${to12h(open)}` : `Reopens ${to12h(open)}` };
}

import { apiRequest } from "./client";
import { TODAY_ISO } from "@/lib/dates";

export type AttendanceStatus = "present" | "absent" | "late" | "half-day" | "leave";

export interface AttendanceMark {
  studentId: string;
  studentName: string;
  roll: number;
  status: AttendanceStatus;
}

/** Saved roll-call for a class + section on a date (empty if never saved). */
export async function getAttendance(
  className: string,
  section: string,
  date: string
): Promise<AttendanceMark[]> {
  return apiRequest<AttendanceMark[]>("/api/attendance", {
    query: { className, section, date },
  });
}

export async function saveAttendance(payload: {
  className: string;
  section: string;
  date: string;
  records: AttendanceMark[];
}): Promise<{ saved: number }> {
  return apiRequest<{ saved: number }>("/api/attendance", { method: "POST", body: payload });
}

/** One active student's attendance tally over a date range (the register row). */
export interface AttendanceStudentSummary {
  studentId: string;
  studentName: string;
  roll: number;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  leave: number;
  total: number;
  /** Fair attendance %: round((present + late + 0.5*half-day) / (present +
   *  absent + late + half-day) * 100). Leave is excused. 0 when denominator 0. */
  percent: number;
}

/** Per-day roll-up across the class, for the weekly/overview charts. */
export interface AttendanceDaySummary {
  date: string;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  leave: number;
  total: number;
  /** round(present / total * 100); 0 when total is 0. */
  presentPercent: number;
}

export interface AttendanceSummary {
  students: AttendanceStudentSummary[];
  daily: AttendanceDaySummary[];
}

/**
 * Attendance register for a class + section over [from, to] (both YYYY-MM-DD).
 * Lists every currently-active student (with zeros when unmarked) plus a
 * per-day roll-up. Powers the weekly overview and the monthly report.
 */
export async function getAttendanceSummary(
  className: string,
  section: string,
  from: string,
  to: string
): Promise<AttendanceSummary> {
  return apiRequest<AttendanceSummary>("/api/attendance/summary", {
    query: { className, section, from, to },
  });
}

/** One mark in a student's own attendance history. */
export interface StudentAttendanceRecord {
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
}

/** A single student's attendance history + fair-percent tally (newest first). */
export interface StudentAttendanceHistory {
  student: { id: string; name: string; className: string; section: string; rollNo: string | number };
  summary: {
    present: number;
    absent: number;
    late: number;
    halfDay: number;
    leave: number;
    total: number;
    /** Fair attendance %: (present + late + 0.5*half-day) / (present + absent + late + half-day). */
    percent: number;
  };
  records: StudentAttendanceRecord[];
  /**
   * True when the figures came from the FALLBACK (the long-standing class/section
   * `/summary` endpoint) because the per-student route isn't live on the server
   * yet — the tally is real but the per-day `records` are unavailable until the
   * backend is redeployed. Absent/false on the real endpoint.
   */
  partial?: boolean;
}

/**
 * One student's own attendance — identity, an all-status tally with the fair
 * percent, and every mark newest-first (optionally within [from, to]). Powers the
 * "View attendance" action on the students list. Staff-only on the server.
 *
 * Resilient: if the per-student route isn't deployed yet it FALLS BACK to the
 * class/section summary endpoint (which has been live for ages) to still show the
 * real tally — flagged `partial`, with no per-day history — instead of erroring.
 * Pass the student's `className`/`section` to enable that fallback.
 */
export async function getStudentAttendance(
  studentId: string,
  opts?: { from?: string; to?: string; className?: string; section?: string }
): Promise<StudentAttendanceHistory> {
  try {
    return await apiRequest<StudentAttendanceHistory>(`/api/attendance/student/${studentId}`, {
      query: { from: opts?.from, to: opts?.to },
    });
  } catch (e) {
    if (opts?.className && opts?.section) {
      try {
        const summary = await getAttendanceSummary(
          opts.className,
          opts.section,
          opts.from ?? "2000-01-01",
          opts.to ?? TODAY_ISO
        );
        const row = summary.students.find((s) => s.studentId === studentId);
        if (row) {
          return {
            student: {
              id: studentId,
              name: row.studentName,
              className: opts.className,
              section: opts.section,
              rollNo: row.roll,
            },
            summary: {
              present: row.present,
              absent: row.absent,
              late: row.late,
              halfDay: row.halfDay,
              leave: row.leave,
              total: row.total,
              percent: row.percent,
            },
            records: [],
            partial: true,
          };
        }
      } catch {
        // Fallback also failed (e.g. inactive student not in the active roster) —
        // surface the original error below.
      }
    }
    throw e;
  }
}

/** Outcome of an explicit absence-alert run (all best-effort counts). */
export interface NotifyAbsenteesResult {
  /** Students saved as absent on the date. */
  total: number;
  /** Guardians an email was actually delivered to. */
  emailed: number;
  /** Absentees with no usable email address on file. */
  noContact: number;
  /** Whether the server has a mailer configured at all. */
  emailConfigured: boolean;
}

/**
 * Explicitly email the guardians of every student SAVED as absent on the given
 * class-day. Best-effort — the result reports honestly how many were emailed vs.
 * had no contact, and whether email is configured on the server.
 */
export async function notifyAbsentees(
  className: string,
  section: string,
  date: string
): Promise<NotifyAbsenteesResult> {
  return apiRequest<NotifyAbsenteesResult>("/api/attendance/notify-absentees", {
    method: "POST",
    body: { className, section, date },
  });
}

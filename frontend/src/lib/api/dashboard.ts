import { apiRequest } from "./client";
import { todayIso } from "@/lib/dates";

/**
 * Admin dashboard insights — a single server-computed payload.
 *
 * Every figure is aggregated over the WHOLE school on the server, so the numbers
 * are correct at any size and the response stays tiny (counts + a capped risk
 * list, never the full roster). The client sends its local `today` so all
 * date-relative figures match the user's calendar day.
 */

export interface DashboardAttentionCandidate {
  id: string;
  firstName: string;
  lastName: string;
  className: string;
  section: string;
  attendancePercent: number;
  performancePercent: number;
  feeDue: number;
}

export interface DashboardInsightsResponse {
  counts: {
    students: number;
    teachers: number;
    classes: number;
    subjects: number;
    timetableEntries: number;
    activeStudents: number;
  };
  teachersOnLeave: number;
  admissionsWaiting: number;
  birthdaysThisMonth: number;
  lowAttendance: number;
  upcomingExams: number;
  nextExam: { name: string; date: string } | null;
  attendanceBands: { band: string; students: number }[];
  /** Top risk candidates (capped). The client re-scores these to rank/explain. */
  attention: DashboardAttentionCandidate[];
  schoolOpen: { open: boolean; reason: string | null };
}

export async function getDashboardInsights(): Promise<DashboardInsightsResponse> {
  return apiRequest<DashboardInsightsResponse>("/api/dashboard/insights", {
    query: { today: todayIso() },
  });
}

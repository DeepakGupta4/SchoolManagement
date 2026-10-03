"use client";

import { useEffect, useState } from "react";
import { getDashboardInsights, type DashboardAttentionCandidate } from "@/lib/api/dashboard";
import { getFeeSummary, feeAccountsApi, balanceOf, type FeeSummary } from "@/lib/api/feeLedger";
import { getMySchool, type SchoolProfile } from "@/lib/api/schools";
import { listStudents } from "@/lib/api/students";
import { listTeachers } from "@/lib/api/teachers";
import { admissionsApi } from "@/lib/api/admissions";
import { examsApi, examStatus } from "@/lib/api/exams";
import { classesApi } from "@/lib/api/classes";
import { subjectsApi } from "@/lib/api/subjects";
import { timetableApi } from "@/lib/api/timetable";
import { assessStudent } from "@/lib/insights";
import { todayIso } from "@/lib/dates";

export interface AttentionStudent {
  student: DashboardAttentionCandidate;
  score: number;
  reason: string;
}

export interface DashboardInsights {
  teachersOnLeave: number;
  feesPending: number;
  feeDefaulters: number;
  admissionsWaiting: number;
  birthdaysThisMonth: number;
  upcomingExams: number;
  nextExamName: string | null;
  lowAttendance: number;
  attention: AttentionStudent[];
  attendanceBands: { band: string; students: number }[];
  totalStudents: number;
  activeStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalSubjects: number;
  totalTimetableEntries: number;
  schoolName: string | null;
  schoolLogo: string | null;
  schoolOpen: { open: boolean; reason: string | null };
  feeSummary: FeeSummary | null;
  feeError: boolean;
}

const ATTENDANCE_BANDS: { band: string; min: number; max: number }[] = [
  { band: "<75%", min: -Infinity, max: 75 },
  { band: "75–85%", min: 75, max: 85 },
  { band: "85–95%", min: 85, max: 95 },
  { band: "95%+", min: 95, max: Infinity },
];

/** Shared: turn the capped risk candidates into the top-5 flagged list. */
function topAttention(candidates: DashboardAttentionCandidate[]): AttentionStudent[] {
  return candidates
    .map((student) => ({ student, assessment: assessStudent(student) }))
    .filter((r) => r.assessment.level !== "low")
    .sort((a, b) => b.assessment.score - a.assessment.score)
    .slice(0, 5)
    .map((r) => ({
      student: r.student,
      score: r.assessment.score,
      reason: r.assessment.factors[0] ?? "Flagged by risk model",
    }));
}

/**
 * Fallback for backends that don't yet expose /api/dashboard/insights (e.g. an
 * older deployment). Reconstructs the same shape from the individual list
 * endpoints the server has always had. Less efficient than the aggregate
 * endpoint (and bounded by the list page size), but it keeps the dashboard fully
 * working during a rollout instead of showing a wall of errors.
 */
async function buildFromLegacy(
  feeSummary: FeeSummary | null,
  school: SchoolProfile | null
): Promise<DashboardInsights> {
  const [students, teachers, admissions, exams, classes, subjects, timetable] = await Promise.all([
    listStudents(),
    listTeachers(),
    admissionsApi.list(),
    examsApi.list(),
    classesApi.list(),
    subjectsApi.list(),
    timetableApi.list(),
  ]);

  const active = students.filter((s) => s.status === "active");
  const month = todayIso().slice(5, 7);

  const upcoming = exams
    .filter((e) => examStatus(e) === "upcoming")
    .sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  // Fees: prefer the server summary; fall back to the ledger only if needed.
  let feesPending = feeSummary?.outstanding ?? 0;
  let feeDefaulters = feeSummary?.defaulters ?? 0;
  if (!feeSummary) {
    try {
      const accounts = await feeAccountsApi.list();
      feesPending = accounts.reduce((sum, a) => sum + balanceOf(a), 0);
      feeDefaulters = accounts.filter((a) => balanceOf(a) > 0).length;
    } catch {
      /* leave zeros */
    }
  }

  const candidates: DashboardAttentionCandidate[] = active.map((s) => ({
    id: s.id,
    firstName: s.firstName,
    lastName: s.lastName,
    className: s.className,
    section: s.section,
    attendancePercent: s.attendancePercent,
    performancePercent: s.performancePercent,
    feeDue: s.feeDue,
  }));

  const dow = new Date().getDay();

  return {
    teachersOnLeave: teachers.filter((t) => t.status === "on-leave").length,
    feesPending,
    feeDefaulters,
    admissionsWaiting: admissions.filter((a) => a.stage !== "approved" && a.stage !== "rejected").length,
    birthdaysThisMonth: active.filter((s) => (s.dateOfBirth || "").slice(5, 7) === month).length,
    upcomingExams: upcoming.length,
    nextExamName: upcoming[0]?.name ?? null,
    lowAttendance: active.filter((s) => s.attendancePercent < 75).length,
    attention: topAttention(candidates),
    attendanceBands: ATTENDANCE_BANDS.map((b) => ({
      band: b.band,
      students: active.filter((s) => s.attendancePercent >= b.min && s.attendancePercent < b.max).length,
    })),
    totalStudents: students.length,
    activeStudents: active.length,
    totalTeachers: teachers.length,
    totalClasses: classes.length,
    totalSubjects: subjects.length,
    totalTimetableEntries: timetable.length,
    schoolName: school?.name?.trim() || null,
    schoolLogo: school?.logo?.trim() || null,
    schoolOpen: { open: dow !== 0, reason: dow === 0 ? "Sunday" : null },
    feeSummary,
    feeError: !feeSummary,
  };
}

/**
 * Derives the Principal's "Overview" from ONE server-side aggregate endpoint
 * (every count is over the whole school, not a truncated page) plus the fee
 * summary and the school profile. Resilient: the three sources are awaited with
 * allSettled, and if the aggregate endpoint isn't available it falls back to the
 * individual list endpoints so the dashboard still works end-to-end.
 */
export function useDashboardInsights() {
  const [data, setData] = useState<DashboardInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const [insightsR, feeR, schoolR] = await Promise.allSettled([
        getDashboardInsights(),
        getFeeSummary(),
        getMySchool(),
      ]);
      if (cancelled) return;

      const feeSummary = feeR.status === "fulfilled" ? feeR.value : null;
      const school = schoolR.status === "fulfilled" ? schoolR.value : null;

      if (insightsR.status === "fulfilled") {
        const insights = insightsR.value;
        setData({
          teachersOnLeave: insights.teachersOnLeave,
          feesPending: feeSummary?.outstanding ?? 0,
          feeDefaulters: feeSummary?.defaulters ?? 0,
          admissionsWaiting: insights.admissionsWaiting,
          birthdaysThisMonth: insights.birthdaysThisMonth,
          upcomingExams: insights.upcomingExams,
          nextExamName: insights.nextExam?.name ?? null,
          lowAttendance: insights.lowAttendance,
          attention: topAttention(insights.attention),
          attendanceBands: insights.attendanceBands,
          totalStudents: insights.counts.students,
          activeStudents: insights.counts.activeStudents,
          totalTeachers: insights.counts.teachers,
          totalClasses: insights.counts.classes,
          totalSubjects: insights.counts.subjects,
          totalTimetableEntries: insights.counts.timetableEntries,
          schoolName: school?.name?.trim() || null,
          schoolLogo: school?.logo?.trim() || null,
          schoolOpen: insights.schoolOpen,
          feeSummary,
          feeError: feeR.status !== "fulfilled",
        });
        setLoading(false);
        return;
      }

      // Aggregate endpoint unavailable — reconstruct from the list endpoints.
      try {
        const legacy = await buildFromLegacy(feeSummary, school);
        if (cancelled) return;
        setData(legacy);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Could not load dashboard data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}

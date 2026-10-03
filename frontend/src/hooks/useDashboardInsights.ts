"use client";

import { useEffect, useState } from "react";
import { getDashboardInsights, type DashboardAttentionCandidate } from "@/lib/api/dashboard";
import { getFeeSummary, type FeeSummary } from "@/lib/api/feeLedger";
import { getMySchool } from "@/lib/api/schools";
import { assessStudent } from "@/lib/insights";

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
  /** Live distribution of active students across attendance bands (for the chart). */
  attendanceBands: { band: string; students: number }[];
  /** Totals used to detect a brand-new (empty) school for onboarding. */
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  totalSubjects: number;
  totalTimetableEntries: number;
  /** Real tenant identity, for the header (null while unknown). */
  schoolName: string | null;
  schoolLogo: string | null;
  /** Derived open/closed state for today (Sunday / holiday aware). */
  schoolOpen: { open: boolean; reason: string | null };
  /** Fee day-book figures for the Fee Collection chart (null if it failed to load). */
  feeSummary: FeeSummary | null;
  /** True when the fee figures couldn't be fetched (vs. genuinely zero). */
  feeError: boolean;
}

/**
 * Derives the Principal's "Overview" from ONE server-side aggregate endpoint
 * (every count is over the whole school, not a truncated page) plus the fee
 * summary and the school profile. Each source is awaited with allSettled so a
 * single slow/failing call degrades only its own slice — the board no longer
 * blanks wholesale when one request fails. The risk candidates come back capped
 * and are re-scored here with the shared `assessStudent`, so the ranking and the
 * reason strings stay the single source of truth on the client.
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

      // The counts ARE the dashboard — if that core call fails, surface it.
      if (insightsR.status !== "fulfilled") {
        const e = insightsR.reason;
        setError(e instanceof Error ? e.message : "Could not load dashboard data.");
        setLoading(false);
        return;
      }
      const insights = insightsR.value;

      const feeSummary = feeR.status === "fulfilled" ? feeR.value : null;
      const feeError = feeR.status !== "fulfilled";
      const school = schoolR.status === "fulfilled" ? schoolR.value : null;

      // Re-score the capped candidate set with the shared rule engine, then keep
      // the genuinely-flagged top 5 — identical logic to the student profile.
      const attention: AttentionStudent[] = insights.attention
        .map((student) => ({ student, assessment: assessStudent(student) }))
        .filter((r) => r.assessment.level !== "low")
        .sort((a, b) => b.assessment.score - a.assessment.score)
        .slice(0, 5)
        .map((r) => ({
          student: r.student,
          score: r.assessment.score,
          reason: r.assessment.factors[0] ?? "Flagged by risk model",
        }));

      setData({
        teachersOnLeave: insights.teachersOnLeave,
        feesPending: feeSummary?.outstanding ?? 0,
        feeDefaulters: feeSummary?.defaulters ?? 0,
        admissionsWaiting: insights.admissionsWaiting,
        birthdaysThisMonth: insights.birthdaysThisMonth,
        upcomingExams: insights.upcomingExams,
        nextExamName: insights.nextExam?.name ?? null,
        lowAttendance: insights.lowAttendance,
        attention,
        attendanceBands: insights.attendanceBands,
        totalStudents: insights.counts.students,
        totalTeachers: insights.counts.teachers,
        totalClasses: insights.counts.classes,
        totalSubjects: insights.counts.subjects,
        totalTimetableEntries: insights.counts.timetableEntries,
        schoolName: school?.name?.trim() || null,
        schoolLogo: school?.logo?.trim() || null,
        schoolOpen: insights.schoolOpen,
        feeSummary,
        feeError,
      });
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}

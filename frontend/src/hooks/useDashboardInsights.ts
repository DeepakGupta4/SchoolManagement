"use client";

import { useEffect, useState } from "react";
import { listStudents } from "@/lib/api/students";
import { listTeachers } from "@/lib/api/teachers";
import { admissionsApi } from "@/lib/api/admissions";
import { examsApi } from "@/lib/api/exams";
import { feeAccountsApi, balanceOf } from "@/lib/api/feeLedger";
import { assessStudent } from "@/lib/insights";
import type { Student } from "@/types/student";

export interface AttentionStudent {
  student: Student;
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
}

/**
 * Derives the Principal's "Today's Overview" from the same mock resources the
 * rest of the app uses, so every headline number is traceable — click a card
 * and the page it opens shows exactly those records.
 *
 * All figures are real derivations over the seed data, not literals. When a
 * backend lands, only the fetch calls change.
 */
export function useDashboardInsights() {
  const [data, setData] = useState<DashboardInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      let students, teachers, admissions, exams, accounts;
      try {
        // Students now come over the network, so a failure here is a real
        // possibility — without this the dashboard would spin forever.
        [students, teachers, admissions, exams, accounts] = await Promise.all([
          listStudents(),
          listTeachers(),
          admissionsApi.list(),
          examsApi.list(),
          feeAccountsApi.list(),
        ]);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Could not load dashboard data.");
        setLoading(false);
        return;
      }
      if (cancelled) return;

      const thisMonth = new Date().getMonth();

      const attention = students
        .map((student) => ({ student, ...assessStudent(student) }))
        .filter((r) => r.level !== "low")
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map((r) => ({
          student: r.student,
          score: r.score,
          reason: r.factors[0] ?? "Flagged by risk model",
        }));

      const upcoming = exams.filter((e) => e.status === "upcoming");
      const feesPending = accounts.reduce((sum, a) => sum + balanceOf(a), 0);

      setData({
        teachersOnLeave: teachers.filter((t) => t.status === "on-leave").length,
        feesPending,
        feeDefaulters: accounts.filter((a) => balanceOf(a) > 0).length,
        admissionsWaiting: admissions.filter(
          (a) => a.stage !== "approved" && a.stage !== "rejected"
        ).length,
        birthdaysThisMonth: students.filter(
          (s) => new Date(s.dateOfBirth).getMonth() === thisMonth
        ).length,
        upcomingExams: upcoming.length,
        nextExamName: upcoming[0]?.name ?? null,
        lowAttendance: students.filter((s) => s.attendancePercent < 75).length,
        attention,
      });
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, error };
}

"use client";

import { useEffect, useState } from "react";
import { listTeachers } from "@/lib/api/teachers";
import { countStudents } from "@/lib/api/students";
import { timetableApi, type TimetableEntry } from "@/lib/api/timetable";
import { assignmentsApi, type Assignment } from "@/lib/api/assignments";
import { teacherName, type Teacher } from "@/types/teacher";

export interface TeacherClassRoster {
  className: string;
  count: number;
}

export interface TeacherDashboardData {
  teacher: Teacher | null;
  classes: string[];
  subjects: string[];
  /** Today's periods for this teacher, ordered by period number. */
  todaysPeriods: TimetableEntry[];
  /** Total weekly periods assigned to this teacher in the timetable. */
  weeklyPeriodCount: number;
  myAssignments: Assignment[];
  studentCount: number;
  classRoster: TeacherClassRoster[];
  /** e.g. "Class 10 - A" when this teacher is a class teacher. */
  classTeacherOf: string | null;
}

const WEEKDAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/**
 * Builds a teacher's own dashboard from real data: their timetable, classes,
 * assignments and students. The logged-in teacher is matched to a Teacher
 * record by email, so everything shown is scoped to that person.
 */
export function useTeacherDashboard(email: string | undefined) {
  const [data, setData] = useState<TeacherDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      let teachers: Teacher[];
      let timetable: TimetableEntry[];
      let assignments: Assignment[];
      try {
        [teachers, timetable, assignments] = await Promise.all([
          listTeachers(),
          timetableApi.list(),
          assignmentsApi.list(),
        ]);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Could not load your dashboard.");
        setLoading(false);
        return;
      }
      if (cancelled) return;

      const self =
        teachers.find((t) => email && t.email.toLowerCase() === email.toLowerCase()) ?? null;
      const name = self ? teacherName(self) : "";
      const classes = [...new Set(self?.classes ?? [])];

      const mine = timetable.filter((e) => e.teacher === name);
      const today = WEEKDAY[new Date().getDay()];
      const todaysPeriods = mine
        .filter((e) => e.day === today)
        .sort((a, b) => a.period - b.period);

      const myAssignments = assignments.filter((a) => a.teacher === name);

      // Per-class student tallies counted SERVER-side (one count per class), so
      // no roster is shipped to the browser and the totals are never truncated by
      // a page limit. Counts are non-critical — on failure, show zeros rather
      // than failing the whole dashboard.
      let classRoster: TeacherClassRoster[] = classes.map((c) => ({ className: c, count: 0 }));
      let studentCount = 0;
      if (classes.length > 0) {
        try {
          const counts = await Promise.all(classes.map((c) => countStudents({ className: c })));
          if (cancelled) return;
          classRoster = classes.map((c, i) => ({ className: c, count: counts[i] ?? 0 }));
          studentCount = counts.reduce((sum, n) => sum + n, 0);
        } catch {
          /* keep the zeroed classRoster */
        }
      }

      const classTeacherOf =
        self?.isClassTeacher && self.classTeacherOf
          ? `${self.classTeacherOf}${self.classTeacherSection ? ` - ${self.classTeacherSection}` : ""}`
          : null;

      setData({
        teacher: self,
        classes,
        subjects: self?.subjects ?? [],
        todaysPeriods,
        weeklyPeriodCount: mine.length,
        myAssignments,
        studentCount,
        classRoster,
        classTeacherOf,
      });
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [email]);

  return { data, loading, error };
}

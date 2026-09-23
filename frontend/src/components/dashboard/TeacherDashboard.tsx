"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight, BookMarked, CalendarDays, ClipboardList, Clock, GraduationCap,
  MapPin, School, UserCheck, Users,
} from "lucide-react";
import {
  Badge, Button, Card, CardContent, CardHeader, Skeleton, StatCard,
} from "@/components/ui";
import { useAuthStore } from "@/store";
import { useTeacherDashboard } from "@/hooks/useTeacherDashboard";

/** Quick actions a teacher reaches for daily. */
const QUICK_ACTIONS = [
  { label: "Mark attendance", href: "/attendance", icon: UserCheck },
  { label: "New assignment", href: "/assignments", icon: ClipboardList },
  { label: "My timetable", href: "/timetable", icon: CalendarDays },
];

export function TeacherDashboard() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const { data, loading, error } = useTeacherDashboard(user?.email);

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
          <p className="text-sm font-medium text-danger">{error}</p>
          <p className="text-xs text-muted">Check the API server is running, then reload.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading || !data) {
    return (
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  // The account is a teacher, but no matching Teacher record was found (e.g. the
  // record was removed). Show a gentle notice rather than an empty dashboard.
  if (!data.teacher) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
          <School className="size-8 text-subtle" />
          <p className="text-sm font-medium text-text">Your teacher profile isn&apos;t linked yet</p>
          <p className="max-w-md text-xs text-muted">
            Ask your school admin to add you under Teachers with this email
            ({user?.email}). Once linked, your classes, timetable and students
            will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Stat row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="My classes" value={data.classes.length} icon={School} tone="indigo" />
        <StatCard label="My subjects" value={data.subjects.length} icon={BookMarked} tone="violet" />
        <StatCard label="My students" value={data.studentCount} icon={GraduationCap} tone="emerald" />
        <StatCard label="Assignments given" value={data.myAssignments.length} icon={ClipboardList} tone="amber" />
      </div>

      {/* Class-teacher badge + quick actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {data.classTeacherOf ? (
            <Badge variant="info">Class teacher · {data.classTeacherOf}</Badge>
          ) : null}
          <span className="text-xs text-subtle">{data.weeklyPeriodCount} periods / week</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="focus-ring inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text transition-colors hover:bg-surface-hover"
            >
              <a.icon className="size-3.5" />
              {a.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Today's schedule */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              <h2 className="text-sm font-semibold text-text">Today&apos;s schedule</h2>
            </div>
            <Link
              href="/timetable"
              className="focus-ring inline-flex items-center gap-1 rounded-md text-xs font-semibold text-primary transition-colors hover:text-primary-hover"
            >
              Full timetable <ArrowRight className="size-3.5" />
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {data.todaysPeriods.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted">
                No periods scheduled for today. 🎉
              </p>
            ) : (
              data.todaysPeriods.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 border-b border-border px-5 py-3 last:border-0"
                >
                  <div className="flex size-9 shrink-0 flex-col items-center justify-center rounded-md bg-primary-soft text-primary-text">
                    <span className="text-[10px] font-semibold uppercase leading-none">P</span>
                    <span className="text-sm font-bold leading-none">{p.period}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text">{p.subject}</p>
                    <p className="truncate text-xs text-subtle">
                      {p.className} · {p.time}
                    </p>
                  </div>
                  {p.room ? (
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted">
                      <MapPin className="size-3.5" /> {p.room}
                    </span>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* My classes */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="size-4 text-primary" />
              <h2 className="text-sm font-semibold text-text">My classes</h2>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {data.classRoster.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted">
                No classes assigned yet.
              </p>
            ) : (
              data.classRoster.map((c) => (
                <div
                  key={c.className}
                  className="flex items-center justify-between border-b border-border px-5 py-3 last:border-0"
                >
                  <span className="text-sm font-medium text-text">{c.className}</span>
                  <span className="text-xs text-muted">{c.count} students</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent assignments */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ClipboardList className="size-4 text-primary" />
            <h2 className="text-sm font-semibold text-text">My assignments</h2>
          </div>
          <Link
            href="/assignments"
            className="focus-ring inline-flex items-center gap-1 rounded-md text-xs font-semibold text-primary transition-colors hover:text-primary-hover"
          >
            View all <ArrowRight className="size-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {data.myAssignments.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">
              You haven&apos;t set any assignments yet.
            </p>
          ) : (
            data.myAssignments.slice(0, 5).map((a) => (
              <button
                key={a.id}
                onClick={() => router.push("/assignments")}
                className="focus-ring flex w-full items-center gap-3 border-b border-border px-5 py-3 text-left transition-colors last:border-0 hover:bg-surface-hover"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text">{a.title}</p>
                  <p className="truncate text-xs text-subtle">
                    {a.subject} · {a.class} · due {a.due}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-xs text-muted">
                    {a.submitted}/{a.total} in
                  </span>
                  <Badge variant={a.status === "overdue" ? "danger" : a.status === "completed" ? "success" : "info"}>
                    {a.status}
                  </Badge>
                </div>
              </button>
            ))
          )}
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button variant="outline" onClick={() => router.push("/students")}>
          <GraduationCap className="size-4" />
          View my students
        </Button>
      </div>
    </div>
  );
}

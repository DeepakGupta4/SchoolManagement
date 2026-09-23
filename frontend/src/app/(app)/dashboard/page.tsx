"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight, ArrowUpRight, BadgeIndianRupee, BookMarked, Cake, CalendarClock,
  CalendarDays, CalendarOff, Check, GraduationCap, School, Sparkles, TrendingDown,
  UserRound, Users, type LucideIcon,
} from "lucide-react";
import { Avatar, Badge, Card, CardContent, CardHeader, CountUp, Skeleton } from "@/components/ui";
import { AttendanceChart, FeeCollectionChart } from "@/components/dashboard/Charts";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { UpcomingEvents } from "@/components/dashboard/UpcomingEvents";
import { TeacherDashboard } from "@/components/dashboard/TeacherDashboard";
import { useAuthStore } from "@/store";
import { useDashboardInsights, type DashboardInsights } from "@/hooks/useDashboardInsights";
import { fullName } from "@/types/student";
import { cn } from "@/lib/utils";

const inrShort = (n: number) => {
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}k`;
  return `₹${n}`;
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/** One tile in the "Today's Overview" board. Each links to its source page. */
interface OverviewItem {
  label: string;
  value: number;
  display?: string;
  icon: LucideIcon;
  tone: "indigo" | "rose" | "amber" | "emerald" | "violet" | "cyan";
  href: string;
  hint?: string;
}

const toneClasses: Record<OverviewItem["tone"], string> = {
  indigo: "bg-primary-soft text-primary-text",
  rose: "bg-danger-soft text-danger-text",
  amber: "bg-warning-soft text-warning-text",
  emerald: "bg-success-soft text-success-text",
  violet: "bg-violet/15 text-violet",
  cyan: "bg-info-soft text-info-text",
};

function buildOverview(d: DashboardInsights): OverviewItem[] {
  return [
    { label: "Teachers on leave", value: d.teachersOnLeave, icon: CalendarOff, tone: "amber", href: "/leave" },
    { label: "Low attendance", value: d.lowAttendance, icon: TrendingDown, tone: "rose", href: "/attendance", hint: "below 75%" },
    { label: "Fees pending", value: d.feesPending, display: inrShort(d.feesPending), icon: BadgeIndianRupee, tone: "rose", href: "/fees/defaulters", hint: `${d.feeDefaulters} students` },
    { label: "Admissions waiting", value: d.admissionsWaiting, icon: GraduationCap, tone: "indigo", href: "/students/admissions" },
    { label: "Birthdays this month", value: d.birthdaysThisMonth, icon: Cake, tone: "violet", href: "/students" },
    { label: "Upcoming exams", value: d.upcomingExams, icon: CalendarClock, tone: "cyan", href: "/exams", hint: d.nextExamName ?? undefined },
  ];
}

/**
 * Setup steps for a school still being set up. Each `done` predicate reads the
 * live insights, so a step ticks itself off the moment the owner creates that
 * thing — no manual "mark complete".
 */
const SETUP_STEPS: {
  n: number;
  icon: LucideIcon;
  title: string;
  desc: string;
  href: string;
  cta: string;
  doneCta: string;
  done: (d: DashboardInsights) => boolean;
}[] = [
  { n: 1, icon: School, title: "Create Classes & Sections", desc: "Set up your grades and sections first — everything else links to them.", href: "/classes", cta: "Add classes", doneCta: "Manage classes", done: (d) => d.totalClasses > 0 },
  { n: 2, icon: BookMarked, title: "Add Subjects", desc: "Add the subjects your school teaches.", href: "/subjects", cta: "Add subjects", doneCta: "Manage subjects", done: (d) => d.totalSubjects > 0 },
  { n: 3, icon: GraduationCap, title: "Add Teachers & Staff", desc: "Bring your teaching and support staff on board.", href: "/teachers", cta: "Add teachers", doneCta: "Manage teachers", done: (d) => d.totalTeachers > 0 },
  { n: 4, icon: Users, title: "Enrol Students", desc: "Add students to their classes — or approve them from Admissions.", href: "/students", cta: "Add students", doneCta: "Manage students", done: (d) => d.totalStudents > 0 },
  { n: 5, icon: CalendarDays, title: "Build the Timetable", desc: "Assign periods once classes, subjects and teachers exist.", href: "/timetable", cta: "Open timetable", doneCta: "Open timetable", done: (d) => d.totalTimetableEntries > 0 },
];

function Onboarding({ name, data }: { name?: string; data: DashboardInsights }) {
  const doneCount = SETUP_STEPS.filter((s) => s.done(data)).length;
  const total = SETUP_STEPS.length;
  const started = doneCount > 0;

  return (
    <div className="flex flex-col gap-5">
      <Card className="overflow-hidden">
        <CardContent className="flex flex-col items-start gap-2 bg-linear-to-br from-primary-soft to-violet-soft/40 py-8">
          <span className="inline-flex items-center gap-2 rounded-full bg-surface-raised px-3 py-1 text-xs font-semibold text-primary-text shadow-sm">
            <Sparkles className="size-3.5" /> Welcome to SchoolDeck
          </span>
          <h2 className="mt-1 text-2xl font-bold text-text">
            {started
              ? `Nice progress${name ? `, ${name}` : ""} — a few steps to go 🚀`
              : `Let's set up your school${name ? `, ${name}` : ""} 🎉`}
          </h2>
          <p className="max-w-2xl text-sm text-muted">
            {started
              ? "Completed steps are ticked off below. Finish the remaining ones to unlock your full dashboard."
              : "Your school is empty right now. Follow these quick steps in order — each one links straight to the page where you create it. Start with classes."}
          </p>

          {/* Progress bar */}
          <div className="mt-3 w-full max-w-md">
            <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted">
              <span>Setup progress</span>
              <span>{doneCount} of {total} done</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-hover">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${(doneCount / total) * 100}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {SETUP_STEPS.map((s) => {
          const isDone = s.done(data);
          return (
            <Card key={s.n} className={cn("card-hover", isDone && "border-success/40 bg-success-soft/20")}>
              <CardContent className="flex h-full flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white",
                      isDone ? "bg-success" : "bg-primary"
                    )}
                  >
                    {isDone ? <Check className="size-4.5" /> : s.n}
                  </span>
                  <div
                    className={cn(
                      "flex size-9 items-center justify-center rounded-md",
                      isDone ? "bg-success-soft text-success-text" : "bg-primary-soft text-primary-text"
                    )}
                  >
                    <s.icon className="size-4" />
                  </div>
                  {isDone && (
                    <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-semibold text-success-text">
                      <Check className="size-3" /> Done
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-text">{s.title}</h3>
                  <p className="mt-1 text-xs text-muted">{s.desc}</p>
                </div>
                <Link
                  href={s.href}
                  className={cn(
                    "focus-ring inline-flex w-fit items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                    isDone
                      ? "border border-border bg-surface text-text hover:bg-surface-hover"
                      : "bg-primary text-white hover:bg-primary-hover"
                  )}
                >
                  {isDone ? s.doneCta : s.cta} <ArrowRight className="size-3.5" />
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-24" />
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { data, loading, error } = useDashboardInsights();

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const overview = data ? buildOverview(data) : [];
  // Guided setup stays up until every step is ticked off; each step tracks its
  // own completion from live data, so finished steps show as Done and the whole
  // board disappears once the school is fully set up.
  const setupPending = !loading && !!data && !SETUP_STEPS.every((s) => s.done(data));

  return (
    <div className="flex flex-col gap-5">
      {/* Greeting */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-text">
            {getGreeting()}, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="mt-0.5 text-sm text-muted">{today} · Springdale School</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-success-soft px-3.5 py-1.5 text-xs font-semibold text-success-text">
          <span className="size-1.5 rounded-full bg-success" />
          School is Open
        </span>
      </div>

      {user?.role === "teacher" ? (
        <TeacherDashboard />
      ) : setupPending && data ? (
        <Onboarding name={user?.name?.split(" ")[0]} data={data} />
      ) : (
       <>
      {/* Today's Overview — the insight board */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-text">Today&apos;s Overview</h2>
          <span className="text-xs text-subtle">· live from your data</span>
        </div>

        {error ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
              <p className="text-sm font-medium text-danger">{error}</p>
              <p className="text-xs text-muted">
                Check that the API server is running, then reload this page.
              </p>
            </CardContent>
          </Card>
        ) : loading || !data ? (
          <OverviewSkeleton />
        ) : (
          <div className="stagger-in grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
            {overview.map((item, i) => (
              <Link
                key={item.label}
                href={item.href}
                className="focus-ring group rounded-lg"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <Card className="card-hover h-full">
                  <CardContent className="flex h-full flex-col gap-2.5">
                    <div className="flex items-start justify-between">
                      <div className={cn("flex size-9 items-center justify-center rounded-md", toneClasses[item.tone])}>
                        <item.icon className="size-4" />
                      </div>
                      <ArrowUpRight className="size-4 text-subtle transition-colors group-hover:text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold leading-none text-text">
                        {item.display ? (
                          <CountUp value={item.value} format={() => item.display!} />
                        ) : (
                          <CountUp value={item.value} />
                        )}
                      </p>
                      <p className="mt-1.5 text-xs text-muted">{item.label}</p>
                      {item.hint && <p className="mt-0.5 text-[11px] text-subtle">{item.hint}</p>}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Students needing attention — rule-based risk */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UserRound className="size-4 text-primary" />
            <h2 className="text-sm font-semibold text-text">Students needing attention</h2>
            <Badge variant="outline">Rule-based</Badge>
          </div>
          <Link
            href="/students"
            className="focus-ring inline-flex items-center gap-1 rounded-md text-xs font-semibold text-primary transition-colors hover:text-primary-hover"
          >
            View all <ArrowRight className="size-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {loading || !data ? (
            <div className="flex flex-col gap-2 p-4">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          ) : data.attention.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">
              No students are currently flagged. 🎉
            </p>
          ) : (
            data.attention.map(({ student, score, reason }) => (
              <button
                key={student.id}
                onClick={() => router.push(`/students/${student.id}`)}
                className="focus-ring flex w-full items-center gap-3 border-b border-border px-5 py-3 text-left transition-colors last:border-0 hover:bg-surface-hover"
              >
                <Avatar name={fullName(student)} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text">{fullName(student)}</p>
                  <p className="truncate text-xs text-subtle">
                    {student.className} · {reason}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <div className="hidden w-24 sm:block">
                    <div className="h-1.5 overflow-hidden rounded-full bg-surface-hover">
                      <div
                        className={cn("h-full rounded-full", score >= 55 ? "bg-danger" : "bg-warning")}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                  <Badge variant={score >= 55 ? "danger" : "warning"}>Risk {score}</Badge>
                </div>
              </button>
            ))
          )}
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <AttendanceChart />
        <FeeCollectionChart />
      </div>

      {/* Feeds */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <RecentActivity />
        <UpcomingEvents />
      </div>
       </>
      )}
    </div>
  );
}

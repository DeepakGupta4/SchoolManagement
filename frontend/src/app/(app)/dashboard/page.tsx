"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight, ArrowUpRight, BadgeIndianRupee, Cake, CalendarClock,
  CalendarOff, GraduationCap, Sparkles, TrendingDown, UserRound, type LucideIcon,
} from "lucide-react";
import { Avatar, Badge, Card, CardContent, CardHeader, CountUp, Skeleton } from "@/components/ui";
import { AttendanceChart, FeeCollectionChart } from "@/components/dashboard/Charts";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { UpcomingEvents } from "@/components/dashboard/UpcomingEvents";
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
  const { data, loading } = useDashboardInsights();

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const overview = data ? buildOverview(data) : [];

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

      {/* Today's Overview — the insight board */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-text">Today&apos;s Overview</h2>
          <span className="text-xs text-subtle">· live from your data</span>
        </div>

        {loading || !data ? (
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
    </div>
  );
}

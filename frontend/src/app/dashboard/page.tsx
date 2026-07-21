"use client";

import React from "react";
import {
  GraduationCap, Users, BookOpen, Bus, AlertCircle, CheckCircle,
  DollarSign, UserCheck, type LucideIcon,
} from "lucide-react";
import { Card, CardContent, StatCard, type StatTone } from "@/components/ui";
import { AttendanceChart, FeeCollectionChart } from "@/components/dashboard/Charts";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { UpcomingEvents } from "@/components/dashboard/UpcomingEvents";
import { useAuthStore } from "@/store";
import { cn } from "@/lib/utils";

const stats: {
  label: string;
  value: string;
  trend: number;
  icon: LucideIcon;
  tone: StatTone;
  suffix?: string;
}[] = [
  { label: "Total Students", value: "1,240", trend: 4.2, icon: GraduationCap, tone: "indigo" },
  { label: "Total Teachers", value: "86", trend: 2.1, icon: Users, tone: "emerald" },
  { label: "Fee Collected", value: "₹5.3L", trend: 8.5, icon: DollarSign, tone: "amber" },
  { label: "Attendance Today", value: "94.2", trend: -1.3, icon: UserCheck, tone: "violet", suffix: "%" },
  { label: "Pending Fees", value: "₹1.1L", trend: -12.4, icon: AlertCircle, tone: "rose" },
  { label: "Active Buses", value: "12", trend: 0, icon: Bus, tone: "cyan" },
];

const quickStats: { label: string; value: number; icon: LucideIcon; tone: string }[] = [
  { label: "New Admissions", value: 24, icon: GraduationCap, tone: "bg-info-soft text-info-text" },
  { label: "Leave Requests", value: 7, icon: Users, tone: "bg-warning-soft text-warning-text" },
  { label: "Books Issued", value: 38, icon: BookOpen, tone: "bg-success-soft text-success-text" },
  { label: "Bus Routes Active", value: 12, icon: Bus, tone: "bg-info-soft text-info-text" },
  { label: "Fee Defaulters", value: 42, icon: AlertCircle, tone: "bg-danger-soft text-danger-text" },
  { label: "Tasks Completed", value: 18, icon: CheckCircle, tone: "bg-primary-soft text-primary-text" },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex flex-col gap-5">
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => (
          <StatCard key={s.label} variant="stacked" {...s} />
        ))}
      </div>

      <Card>
        <CardContent>
          <p className="mb-3.5 text-[10px] font-semibold uppercase tracking-widest text-subtle">
            Today&apos;s Snapshot
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
            {quickStats.map((q) => (
              <div key={q.label} className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-md",
                    q.tone
                  )}
                >
                  <q.icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-semibold leading-none text-text">{q.value}</p>
                  <p className="mt-1 truncate text-[11px] text-muted">{q.label}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <AttendanceChart />
        <FeeCollectionChart />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <RecentActivity />
        <UpcomingEvents />
      </div>
    </div>
  );
}

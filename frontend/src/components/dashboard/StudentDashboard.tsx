"use client";

import { useEffect, useState } from "react";
import { CalendarCheck, TrendingUp, Wallet, Clock, Bell, Inbox, CalendarDays } from "lucide-react";
import { Avatar, Badge, Card, CardContent, CardHeader, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";
import { getMyStudent, type StudentPortal } from "@/lib/api/portal";
import { getNotifications, type AppNotification } from "@/lib/api/notifications";
import { PayFeesButton } from "./PayFeesButton";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;
function pctTone(p: number): string {
  if (p >= 85) return "text-success";
  if (p >= 70) return "text-warning-text";
  return "text-danger";
}
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function Stat({ icon: Icon, label, value, tone }: { icon: typeof Wallet; label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg bg-surface-sunken px-3 py-2.5">
      <p className="flex items-center gap-1.5 text-[11px] font-medium text-subtle">
        <Icon className="size-3" />
        {label}
      </p>
      <p className={cn("mt-0.5 text-xl font-bold leading-none", tone ?? "text-text")}>{value}</p>
    </div>
  );
}

export function StudentDashboard() {
  const [me, setMe] = useState<StudentPortal | null | undefined>(undefined);
  const [notices, setNotices] = useState<AppNotification[]>([]);
  // Bumped after a successful online payment so the fee-due figure refreshes.
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getMyStudent()
      .then((d) => !cancelled && setMe(d))
      .catch(() => !cancelled && setMe(null));
    getNotifications()
      .then(({ items }) => !cancelled && setNotices(items))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [tick]);

  if (me === undefined) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (me === null) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-surface-hover text-subtle">
            <CalendarCheck className="size-5" />
          </div>
          <p className="text-sm font-medium text-text">Your student profile isn&rsquo;t linked yet</p>
          <p className="max-w-md text-xs text-muted">
            Your details appear here once the school links your account to your student record. Please
            contact the school office if this looks wrong.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Profile + metrics */}
      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Avatar name={me.profile.name} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold text-text">{me.profile.name}</p>
              <p className="truncate text-xs text-muted">
                {me.profile.className}
                {me.profile.section ? ` · Section ${me.profile.section}` : ""}
                {me.profile.rollNo ? ` · Roll ${me.profile.rollNo}` : ""}
                {me.profile.admissionNo ? ` · ${me.profile.admissionNo}` : ""}
              </p>
            </div>
            <Badge variant={me.profile.status === "active" ? "success" : "default"}>
              {me.profile.status === "active" ? "Active" : me.profile.status}
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Stat icon={CalendarCheck} label="My attendance" value={`${me.stats.attendancePercent}%`} tone={pctTone(me.stats.attendancePercent)} />
            <Stat icon={TrendingUp} label="My performance" value={`${me.stats.performancePercent}%`} tone={pctTone(me.stats.performancePercent)} />
            <Stat
              icon={Wallet}
              label="Fee due"
              value={me.stats.feeDue > 0 ? inr(me.stats.feeDue) : "Paid"}
              tone={me.stats.feeDue > 0 ? "text-danger" : "text-success"}
            />
          </div>
          {me.stats.feeDue > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surface-sunken px-3 py-2.5">
              <p className="text-xs text-muted">Pay your outstanding fees securely online.</p>
              <PayFeesButton
                dueRupees={me.stats.feeDue}
                prefill={{ name: me.profile.name }}
                onPaid={() => setTick((t) => t + 1)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's timetable */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-primary" />
            <h2 className="text-sm font-semibold text-text">Today&rsquo;s classes</h2>
            {me.todaysPeriods.length > 0 && <span className="text-xs text-muted">· {me.todaysPeriods.length}</span>}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {me.todaysPeriods.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted">No classes scheduled for today. 🎉</p>
          ) : (
            me.todaysPeriods.map((p) => (
              <div key={p.period} className="flex items-center gap-3 border-b border-border px-5 py-3 last:border-0">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-soft text-xs font-bold text-primary-text">
                  P{p.period}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text">{p.subject}</p>
                  <p className="truncate text-xs text-muted">
                    {p.teacher || "—"}
                    {p.room ? ` · Room ${p.room}` : ""}
                  </p>
                </div>
                {p.time && <span className="shrink-0 text-xs font-medium text-subtle">{p.time}</span>}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Notices */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-primary" />
            <h2 className="text-sm font-semibold text-text">Recent updates</h2>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {notices.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Inbox className="size-5 text-subtle" />
              <p className="text-sm text-muted">No updates yet.</p>
            </div>
          ) : (
            notices.slice(0, 8).map((n) => (
              <div key={n.id} className="flex items-start gap-3 border-b border-border px-5 py-3 last:border-0">
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-info-soft text-info-text">
                  <Bell className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text">{n.title}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
                    <Clock className="size-2.5" />
                    {relativeTime(n.createdAt)}
                    {n.body ? ` · ${n.body}` : ""}
                  </p>
                </div>
                {!n.read && <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" aria-label="unread" />}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

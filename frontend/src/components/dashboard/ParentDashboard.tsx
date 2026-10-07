"use client";

import { useEffect, useState } from "react";
import {
  GraduationCap, CalendarCheck, TrendingUp, Wallet, Bell, Clock, Inbox,
} from "lucide-react";
import { Avatar, Badge, Card, CardContent, CardHeader, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";
import { getMyChildren, type PortalChild } from "@/lib/api/portal";
import { getNotifications, type AppNotification } from "@/lib/api/notifications";

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
    <div className="rounded-lg bg-surface-sunken px-3 py-2">
      <p className="flex items-center gap-1.5 text-[11px] font-medium text-subtle">
        <Icon className="size-3" />
        {label}
      </p>
      <p className={cn("mt-0.5 text-lg font-bold leading-none", tone ?? "text-text")}>{value}</p>
    </div>
  );
}

export function ParentDashboard() {
  const [children, setChildren] = useState<PortalChild[] | null>(null);
  const [notices, setNotices] = useState<AppNotification[]>([]);

  useEffect(() => {
    let cancelled = false;
    getMyChildren()
      .then((c) => !cancelled && setChildren(c))
      .catch(() => !cancelled && setChildren([]));
    getNotifications()
      .then(({ items }) => !cancelled && setNotices(items))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-5">
      <section>
        <div className="mb-3 flex items-center gap-2">
          <GraduationCap className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-text">My Children</h2>
          {children && <span className="text-xs text-muted">· {children.length}</span>}
        </div>

        {children === null ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        ) : children.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
              <div className="flex size-11 items-center justify-center rounded-full bg-surface-hover text-subtle">
                <GraduationCap className="size-5" />
              </div>
              <p className="text-sm font-medium text-text">No children linked to your account yet</p>
              <p className="max-w-md text-xs text-muted">
                Your children appear here once the school has your email on their student record. Please
                contact the school office if this looks wrong.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {children.map((c) => (
              <Card key={c.id} className="card-hover">
                <CardContent className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <Avatar name={c.name} size="lg" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-semibold text-text">{c.name}</p>
                      <p className="truncate text-xs text-muted">
                        {c.className}
                        {c.section ? ` · Section ${c.section}` : ""}
                        {c.rollNo ? ` · Roll ${c.rollNo}` : ""}
                      </p>
                    </div>
                    <Badge variant={c.status === "active" ? "success" : "default"}>
                      {c.status === "active" ? "Active" : c.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Stat icon={CalendarCheck} label="Attendance" value={`${c.attendancePercent}%`} tone={pctTone(c.attendancePercent)} />
                    <Stat icon={TrendingUp} label="Performance" value={`${c.performancePercent}%`} tone={pctTone(c.performancePercent)} />
                    <Stat
                      icon={Wallet}
                      label="Fee due"
                      value={c.feeDue > 0 ? inr(c.feeDue) : "Paid"}
                      tone={c.feeDue > 0 ? "text-danger" : "text-success"}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

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
              <div
                key={n.id}
                className="flex items-start gap-3 border-b border-border px-5 py-3 last:border-0"
              >
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

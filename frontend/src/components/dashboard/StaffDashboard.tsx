"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IdCard, CalendarClock, Bell, Clock, Inbox, ArrowRight, Megaphone } from "lucide-react";
import { Avatar, Badge, Card, CardContent, CardHeader, Skeleton } from "@/components/ui";
import { getMyStaff, type StaffPortal } from "@/lib/api/portal";
import { getNotifications, type AppNotification } from "@/lib/api/notifications";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const LINKS = [
  { href: "/leave/my", icon: CalendarClock, title: "My Leave", desc: "Apply for and track leave" },
  { href: "/notices", icon: Megaphone, title: "Notice Board", desc: "School notices" },
];

export function StaffDashboard() {
  const [me, setMe] = useState<StaffPortal | null | undefined>(undefined);
  const [notices, setNotices] = useState<AppNotification[]>([]);

  useEffect(() => {
    let cancelled = false;
    getMyStaff()
      .then((d) => !cancelled && setMe(d))
      .catch(() => !cancelled && setMe(null));
    getNotifications()
      .then(({ items }) => !cancelled && setNotices(items))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col gap-5">
      {/* Profile */}
      {me === undefined ? (
        <Skeleton className="h-28 w-full" />
      ) : me === null ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-surface-hover text-subtle">
              <IdCard className="size-5" />
            </div>
            <p className="text-sm font-medium text-text">Your staff profile isn&rsquo;t linked yet</p>
            <p className="max-w-md text-xs text-muted">
              Your record appears here once the office links your account to your staff profile. You can still
              use the self-service links below.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex items-center gap-3">
            <Avatar name={me.profile.name} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold text-text">{me.profile.name}</p>
              <p className="truncate text-xs text-muted">
                {me.profile.role || "Staff"}
                {me.profile.dept ? ` · ${me.profile.dept}` : ""}
                {me.profile.employeeId ? ` · ${me.profile.employeeId}` : ""}
              </p>
            </div>
            <Badge variant={me.profile.status === "active" ? "success" : "default"}>
              {me.profile.status === "active" ? "Active" : me.profile.status}
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Self-service links */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {LINKS.map((l) => {
          const Icon = l.icon;
          return (
            <Link key={l.href} href={l.href} className="focus-ring group">
              <Card className="card-hover h-full">
                <CardContent className="flex items-center gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary-text">
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-text">{l.title}</p>
                    <p className="truncate text-xs text-muted">{l.desc}</p>
                  </div>
                  <ArrowRight className="size-4 text-subtle transition-colors group-hover:text-primary" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

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

"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Clock,
  GraduationCap,
  XCircle,
  CreditCard,
  Ban,
  IndianRupee,
  ArrowRight,
  ShieldX,
  Loader2,
  Inbox,
  Users,
  UserCheck,
} from "lucide-react";
import { Badge, Card, CardContent, PageHeader } from "@/components/ui";
import { useAuthStore } from "@/store";
import { getRequestStats, listSchoolRequests, type RequestStats, type SchoolRequest } from "@/lib/api/schoolRequests";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

function fmtDate(v: string): string {
  return new Date(v).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const REQUEST_BADGE = { pending: "warning", approved: "success", rejected: "danger" } as const;

function Stat({ label, value, icon: Icon, gradient }: { label: string; value: string | number; icon: typeof Building2; gradient: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-md text-white ${gradient}`}>
          <Icon className="size-4.5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted">{label}</p>
          <p className="mt-0.5 truncate text-xl font-semibold text-text">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function OverviewPage() {
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<RequestStats | null>(null);
  const [recent, setRecent] = useState<SchoolRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      setLoading(true);
      Promise.all([getRequestStats(), listSchoolRequests({ status: "all" })])
        .then(([s, list]) => {
          if (cancelled) return;
          setStats(s);
          setRecent(list.slice(0, 6));
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [reloadKey]);

  const greeting = useCallback(() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  }, []);

  if (user && user.role !== "super_admin") {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="text-center">
          <ShieldX className="mx-auto size-10 text-muted" />
          <h1 className="mt-3 text-lg font-semibold text-text">Restricted area</h1>
          <p className="mt-1 text-sm text-muted">This overview is for the platform owner.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={`${greeting()}${user?.name ? `, ${user.name.split(" ")[0]}` : ""}`}
        description="Your SchoolDeck platform at a glance."
      />

      {loading && !stats ? (
        <div className="grid place-items-center py-16 text-muted">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Total Schools" value={stats?.totalSchools ?? 0} icon={Building2} gradient="bg-gradient-to-br from-indigo-500 to-violet-500" />
            <Stat label="Pending Requests" value={stats?.pendingRequests ?? 0} icon={Clock} gradient="bg-gradient-to-br from-amber-500 to-orange-500" />
            <Stat label="Active Trials" value={stats?.activeTrials ?? 0} icon={GraduationCap} gradient="bg-gradient-to-br from-sky-500 to-blue-500" />
            <Stat label="Paid Schools" value={stats?.paidSchools ?? 0} icon={CreditCard} gradient="bg-gradient-to-br from-emerald-500 to-green-500" />
            <Stat label="Trials Expired" value={stats?.trialsExpired ?? 0} icon={XCircle} gradient="bg-gradient-to-br from-rose-500 to-red-500" />
            <Stat label="Suspended" value={stats?.suspendedSchools ?? 0} icon={Ban} gradient="bg-gradient-to-br from-slate-500 to-slate-600" />
            <Stat label="Monthly Revenue" value={inr.format(stats?.revenue ?? 0)} icon={IndianRupee} gradient="bg-gradient-to-br from-teal-500 to-emerald-600" />
            <Stat label="Total Students" value={stats?.totalStudents ?? 0} icon={Users} gradient="bg-gradient-to-br from-fuchsia-500 to-pink-500" />
            <Stat label="Total Staff" value={stats?.totalStaff ?? 0} icon={UserCheck} gradient="bg-gradient-to-br from-cyan-500 to-sky-500" />
            <Stat label="Rejected" value={stats?.rejectedRequests ?? 0} icon={XCircle} gradient="bg-gradient-to-br from-slate-400 to-slate-500" />
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            {/* Recent requests */}
            <Card>
              <CardContent>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-text">Recent registrations</h2>
                  <Link href="/school-requests" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                    View all <ArrowRight className="size-3.5" />
                  </Link>
                </div>
                {recent.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8 text-muted">
                    <Inbox className="size-6" />
                    <p className="text-sm">No school registrations yet.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {recent.map((r) => (
                      <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-text">{r.schoolName}</p>
                          <p className="truncate text-xs text-muted">
                            {r.email} · {fmtDate(r.createdAt)}
                          </p>
                        </div>
                        <Badge variant={REQUEST_BADGE[r.status]} className="shrink-0 capitalize">
                          {r.status}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Quick actions */}
            <div className="space-y-3">
              <QuickLink href="/school-requests" title="School Requests" desc="Review & approve new schools" icon={Inbox} badge={stats?.pendingRequests} />
              <QuickLink href="/schools" title="Schools" desc="Manage tenants & subscriptions" icon={Building2} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function QuickLink({
  href,
  title,
  desc,
  icon: Icon,
  badge,
}: {
  href: string;
  title: string;
  desc: string;
  icon: typeof Building2;
  badge?: number;
}) {
  return (
    <Link href={href}>
      <Card className="transition-colors hover:border-primary">
        <CardContent className="flex items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-text">{title}</p>
            <p className="truncate text-xs text-muted">{desc}</p>
          </div>
          {!!badge && badge > 0 && (
            <span className="rounded-full bg-warning-soft px-2 py-0.5 text-xs font-semibold text-warning-text">{badge}</span>
          )}
          <ArrowRight className="size-4 shrink-0 text-muted" />
        </CardContent>
      </Card>
    </Link>
  );
}

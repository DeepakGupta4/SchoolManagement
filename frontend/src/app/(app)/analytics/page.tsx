"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AlertTriangle, Users, DollarSign, GraduationCap, Wallet } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  PageHeader,
  Skeleton,
  StatCard,
  type StatTone,
} from "@/components/ui";
import { useChartTheme, toneClass, type ChartTone } from "@/hooks/useChartTheme";
import { cn } from "@/lib/utils";
import { listStudents } from "@/lib/api/students";
import { getDashboardInsights } from "@/lib/api/dashboard";
import {
  feeAccountsApi,
  paymentsApi,
  getFeeSummary,
  totalBilled,
  totalPaid,
  balanceOf,
  type StudentFeeAccount,
  type Payment,
  type FeeSummary,
} from "@/lib/api/feeLedger";
import { admissionsApi, type Application } from "@/lib/api/admissions";
import type { Student } from "@/types/student";

const periods = ["week", "month", "year"] as const;
type Period = (typeof periods)[number];

const pad = (n: number) => String(n).padStart(2, "0");

/** Parses a "yyyy-mm-dd" string as a local date, tolerant of junk. */
function parseYmd(s: string | null | undefined): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/**
 * Ordered, period-aware time buckets ending at today, plus the key function
 * that maps a date onto them:
 *   - week:  last 7 days,     one bucket per day  (label "Mon")
 *   - month: last 12 months,  one bucket per month (label "Sep")
 *   - year:  last 5 years,    one bucket per year  (label "2026")
 */
function buildBuckets(period: Period): {
  buckets: { key: string; label: string }[];
  keyOf: (d: Date) => string;
} {
  const now = new Date();
  const buckets: { key: string; label: string }[] = [];

  if (period === "week") {
    const keyOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      buckets.push({ key: keyOf(d), label: d.toLocaleDateString("en-US", { weekday: "short" }) });
    }
    return { buckets, keyOf };
  }

  if (period === "month") {
    const keyOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ key: keyOf(d), label: d.toLocaleDateString("en-US", { month: "short" }) });
    }
    return { buckets, keyOf };
  }

  const keyOf = (d: Date) => String(d.getFullYear());
  for (let i = 4; i >= 0; i--) {
    const y = now.getFullYear() - i;
    buckets.push({ key: String(y), label: String(y) });
  }
  return { buckets, keyOf };
}

/** Aggregates records into the period's buckets, summing getValue per record. */
function bucketize<T>(
  records: T[],
  period: Period,
  getDate: (r: T) => string | null | undefined,
  getValue: (r: T) => number
): { label: string; value: number }[] {
  const { buckets, keyOf } = buildBuckets(period);
  const totals = new Map<string, number>(buckets.map((b) => [b.key, 0] as [string, number]));
  for (const r of records) {
    const d = parseYmd(getDate(r));
    if (!d) continue;
    const k = keyOf(d);
    if (totals.has(k)) totals.set(k, (totals.get(k) ?? 0) + getValue(r));
  }
  return buckets.map((b) => ({ label: b.label, value: totals.get(b.key) ?? 0 }));
}

/** Subtitle fragment describing the trend window for the active period. */
const periodWindow: Record<Period, string> = {
  week: "over the last 7 days",
  month: "over the last 12 months",
  year: "over the last 5 years",
};

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function ChartTitle({
  title,
  subtitle,
  legend,
}: {
  title: string;
  subtitle: string;
  /** Swatches are classed, never inline-styled — see toneClass in useChartTheme. */
  legend?: { tone: ChartTone; label: string }[];
}) {
  return (
    <CardHeader>
      {/* Wrap on narrow screens so the legend never crushes the title. */}
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text">{title}</p>
          <p className="mt-0.5 text-xs text-muted">{subtitle}</p>
        </div>
        {legend && (
          <div className="flex shrink-0 flex-wrap items-center gap-3.5">
            {legend.map((l) => (
              <span key={l.label} className="flex items-center gap-1.5 text-xs text-muted">
                <span className={cn("size-2.5 rounded-sm", toneClass[l.tone])} />
                {l.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </CardHeader>
  );
}

/** "Couldn't load" state for a chart whose own data source failed (vs empty). */
function ChartFail({ height = 160 }: { height?: number }) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 text-center"
      style={{ minHeight: height }}
    >
      <AlertTriangle className="size-5 text-warning-text" />
      <p className="text-sm font-medium text-text">Couldn&apos;t load</p>
      <p className="text-xs text-muted">Reload the page to try again.</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("month");
  const t = useChartTheme();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [counts, setCounts] = useState({ students: 0, teachers: 0, activeStudents: 0 });
  const [accounts, setAccounts] = useState<StudentFeeAccount[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [feeSummary, setFeeSummary] = useState<FeeSummary | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [attendanceTaken, setAttendanceTaken] = useState(false);
  // Per-source load status, so a single failed fetch shows "—" / "couldn't load"
  // on just that card instead of a confident zero or a fake empty state.
  const [ok, setOk] = useState({
    insights: true,
    students: true,
    accounts: true,
    payments: true,
    fee: true,
    admissions: true,
  });

  useEffect(() => {
    let cancelled = false;
    // Headline counts come from the server aggregate (uncapped) so they're
    // correct at any size — not limited to one 200-row page. Each source is
    // settled independently so one failure degrades only its own section.
    Promise.allSettled([
      getDashboardInsights(),
      listStudents(),
      feeAccountsApi.list(),
      getFeeSummary(),
      admissionsApi.list(),
      paymentsApi.list(),
    ]).then(([insightsR, studentsR, accountsR, feeR, admissionsR, paymentsR]) => {
      if (cancelled) return;
      const insights = insightsR.status === "fulfilled" ? insightsR.value : null;
      const studs = studentsR.status === "fulfilled" ? studentsR.value : [];
      setStudents(studs);
      setCounts({
        students: insights?.counts.students ?? studs.length,
        teachers: insights?.counts.teachers ?? 0,
        activeStudents:
          insights?.counts.activeStudents ?? studs.filter((s) => s.status === "active").length,
      });
      // Attendance is "taken" only if the aggregate returned bands — the endpoint
      // sends an empty band list until the first roll-call is saved.
      setAttendanceTaken((insights?.attendanceBands?.length ?? 0) > 0);
      if (accountsR.status === "fulfilled") setAccounts(accountsR.value);
      if (paymentsR.status === "fulfilled") setPayments(paymentsR.value);
      if (feeR.status === "fulfilled") setFeeSummary(feeR.value);
      if (admissionsR.status === "fulfilled") setApplications(admissionsR.value);
      setOk({
        insights: insightsR.status === "fulfilled",
        students: studentsR.status === "fulfilled",
        accounts: accountsR.status === "fulfilled",
        payments: paymentsR.status === "fulfilled",
        fee: feeR.status === "fulfilled",
        admissions: admissionsR.status === "fulfilled",
      });
      // A hard error only when neither the aggregate nor the roster could load.
      setError(insightsR.status !== "fulfilled" && studentsR.status !== "fulfilled");
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---- Derived, real figures ------------------------------------------- */

  const activeStudents = useMemo(
    () => students.filter((s) => s.status === "active"),
    [students]
  );

  const classStrength = useMemo(() => {
    const byClass = new Map<string, number>();
    for (const s of students) byClass.set(s.className, (byClass.get(s.className) ?? 0) + 1);
    return [...byClass.entries()]
      .map(([cls, count]) => ({ class: cls, students: count }))
      .sort((a, b) => a.class.localeCompare(b.class, undefined, { numeric: true }));
  }, [students]);

  const genderData = useMemo(() => {
    const counts = { male: 0, female: 0, other: 0 };
    for (const s of students) counts[s.gender] += 1;
    const rows: { name: string; value: number; tone: ChartTone }[] = [
      { name: "Boys", value: counts.male, tone: "primary" },
      { name: "Girls", value: counts.female, tone: "info" },
    ];
    if (counts.other > 0) rows.push({ name: "Other", value: counts.other, tone: "violet" });
    return rows;
  }, [students]);

  const feeStatusData = useMemo(() => {
    let paid = 0;
    let partial = 0;
    let unpaid = 0;
    for (const a of accounts) {
      if (totalBilled(a) <= 0) continue;
      if (balanceOf(a) === 0) paid += 1;
      else if (totalPaid(a) > 0) partial += 1;
      else unpaid += 1;
    }
    return [
      { name: "Paid", value: paid, tone: "success" as ChartTone },
      { name: "Partial", value: partial, tone: "warning" as ChartTone },
      { name: "Unpaid", value: unpaid, tone: "danger" as ChartTone },
    ];
  }, [accounts]);

  const kpis = useMemo(() => {
    const avg = (arr: Student[], f: (s: Student) => number) =>
      arr.length ? Math.round(arr.reduce((sum, s) => sum + f(s), 0) / arr.length) : 0;
    // Attendance defaults to 100 until a roll-call is taken, so only show a real
    // figure once attendance actually exists — otherwise "Not recorded".
    const avgAttendance = attendanceTaken ? avg(activeStudents, (s) => s.attendancePercent) : null;
    // Performance 0 means "no marks entered yet", not a real zero average — so
    // average only over students who have actually been assessed.
    const assessed = activeStudents.filter((s) => s.performancePercent > 0);
    const avgPerformance = assessed.length ? avg(assessed, (s) => s.performancePercent) : null;
    const collected = feeSummary?.totalCollected ?? 0;
    const outstanding = feeSummary?.outstanding ?? 0;
    const collectionRate =
      collected + outstanding > 0 ? Math.round((collected / (collected + outstanding)) * 100) : 0;
    const activeRate = counts.students
      ? Math.round((counts.activeStudents / counts.students) * 100)
      : 0;
    return [
      {
        label: "Average Attendance",
        value: avgAttendance === null ? "Not recorded" : `${avgAttendance}%`,
        pct: avgAttendance ?? 0,
        neutral: false,
      },
      {
        label: "Average Performance",
        value: avgPerformance === null ? "Not assessed" : `${avgPerformance}%`,
        pct: avgPerformance ?? 0,
        neutral: false,
      },
      {
        label: "Fee Collection Rate",
        value: ok.fee ? `${collectionRate}%` : "—",
        pct: ok.fee ? collectionRate : 0,
        neutral: false,
      },
      {
        // Active-vs-lifetime ratio isn't a "health" metric (alumni accumulate),
        // so it gets a neutral bar, not the green/amber/red thresholds.
        label: "Active Students",
        value: `${counts.activeStudents} of ${counts.students}`,
        pct: activeRate,
        neutral: true,
      },
    ];
  }, [activeStudents, counts, feeSummary, attendanceTaken, ok.fee]);

  const topMetrics: {
    label: string;
    value: string | number;
    icon: typeof DollarSign;
    tone: StatTone;
  }[] = [
    { label: "Total Students", value: counts.students, icon: Users, tone: "indigo" },
    { label: "Total Teachers", value: ok.insights ? counts.teachers : "—", icon: GraduationCap, tone: "emerald" },
    {
      label: "Fees Collected",
      value: ok.fee ? inr.format(feeSummary?.totalCollected ?? 0) : "—",
      icon: DollarSign,
      tone: "amber",
    },
    {
      label: "Fees Outstanding",
      value: ok.fee ? inr.format(feeSummary?.outstanding ?? 0) : "—",
      icon: Wallet,
      tone: "violet",
    },
  ];

  /* ---- Period-aware trends (react to the week/month/year tabs) ---------- */

  const admissionsTrend = useMemo(
    () => bucketize(applications, period, (a) => a.appliedOn, () => 1),
    [applications, period]
  );
  const hasAdmissions = admissionsTrend.some((d) => d.value > 0);

  // Bucket REAL dated payment records (excluding reversed ones), so each rupee
  // lands in the period it was actually collected in and reconciles with the
  // "Fees Collected" stat card — unlike crediting an account's lifetime total to
  // its single last-payment date.
  const feesTrend = useMemo(
    () =>
      bucketize(
        payments.filter((p) => p.status !== "cancelled" && p.status !== "bounced"),
        period,
        (p) => p.date,
        (p) => p.amount
      ),
    [payments, period]
  );
  const hasFees = feesTrend.some((d) => d.value > 0);

  const genderColors = genderData.map((g) => t.series[g.tone]);
  const feeStatusColors = feeStatusData.map((f) => t.series[f.tone]);
  const hasGender = genderData.some((g) => g.value > 0);
  const hasFeeStatus = feeStatusData.some((f) => f.value > 0);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Analytics"
        description="School performance overview & insights."
        actions={
          <div
            role="radiogroup"
            aria-label="Reporting period"
            className="flex items-center gap-1 rounded-md border border-border bg-surface-raised p-1"
          >
            {periods.map((p) => (
              <button
                key={p}
                role="radio"
                aria-checked={period === p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "focus-ring rounded-sm px-4 py-1.5 text-xs font-semibold capitalize transition-colors",
                  period === p
                    ? "bg-primary-soft text-primary-text"
                    : "text-muted hover:bg-surface-hover hover:text-text"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        }
      />

      {error ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <AlertTriangle className="size-6 text-warning-text" />
            <p className="text-sm font-medium text-danger">Couldn&apos;t load analytics</p>
            <p className="text-xs text-muted">
              There was a problem reaching the server. Reload the page to try again.
            </p>
          </CardContent>
        </Card>
      ) : (
       <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)
          : topMetrics.map((m) => <StatCard key={m.label} variant="stacked" {...m} />)}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <ChartTitle
            title="Admissions Trend"
            subtitle={`Applications received ${periodWindow[period]}`}
            legend={[{ tone: "primary", label: "Applications" }]}
          />
          <CardContent>
            {loading ? (
              <Skeleton className="h-[210px] w-full" />
            ) : !ok.admissions ? (
              <ChartFail height={210} />
            ) : !hasAdmissions ? (
              <EmptyState
                title="No admissions in this period"
                description="Applications will appear here as they come in."
              />
            ) : (
              <div
                role="img"
                aria-label={`Admissions ${periodWindow[period]}: ${admissionsTrend
                  .map((d) => `${d.label} ${d.value}`)
                  .join(", ")}`}
              >
                <ResponsiveContainer width="100%" height={210}>
                <BarChart data={admissionsTrend} barSize={period === "week" ? 26 : 18}>
                  <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: t.axis }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: t.axis }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={t.tooltip}
                    cursor={{ fill: t.cursor, radius: 6 }}
                    formatter={(v) => [`${Number(v)}`, "Applications"]}
                  />
                  <Bar
                    dataKey="value"
                    fill={t.series.primary}
                    radius={[6, 6, 0, 0]}
                    name="Applications"
                  />
                </BarChart>
              </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <ChartTitle
            title="Gender Distribution"
            subtitle={`Total ${genderData.reduce((s, g) => s + g.value, 0)} students`}
          />
          <CardContent className="flex flex-col items-center">
            {loading ? (
              <Skeleton className="h-[180px] w-full" />
            ) : !ok.students ? (
              <ChartFail height={180} />
            ) : !hasGender ? (
              <EmptyState title="No students yet" />
            ) : (
              <>
                <div
                  role="img"
                  aria-label={genderData.map((g) => `${g.name} ${g.value}`).join(", ")}
                >
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {genderData.map((entry, i) => (
                        <Cell key={entry.name} fill={genderColors[i]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={t.tooltip} />
                  </PieChart>
                </ResponsiveContainer>
                </div>
                <div className="mt-1 flex items-center gap-6">
                  {genderData.map((g) => (
                    <div key={g.name} className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className={cn("size-2.5 rounded-full", toneClass[g.tone])} />
                        <span className="text-xs text-muted">{g.name}</span>
                      </div>
                      <p className="mt-0.5 text-lg font-semibold text-text">{g.value}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <ChartTitle
            title="Fees Collected"
            subtitle={`Collections ${periodWindow[period]}`}
            legend={[{ tone: "success", label: "Collected" }]}
          />
          <CardContent>
            {loading ? (
              <Skeleton className="h-[210px] w-full" />
            ) : !ok.payments ? (
              <ChartFail height={210} />
            ) : !hasFees ? (
              <EmptyState
                title="No collections in this period"
                description="Payments will appear here as fees are collected."
              />
            ) : (
              <div
                role="img"
                aria-label={`Fees collected ${periodWindow[period]}: ${feesTrend
                  .map((d) => `${d.label} ₹${d.value}`)
                  .join(", ")}`}
              >
                <ResponsiveContainer width="100%" height={210}>
                <BarChart data={feesTrend} barSize={period === "week" ? 26 : 18}>
                  <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: t.axis }}
                    axisLine={false}
                    tickLine={false}
                    interval={0}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: t.axis }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₹${(Number(v) / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={t.tooltip}
                    cursor={{ fill: t.cursor, radius: 6 }}
                    formatter={(v) => [`₹${Number(v).toLocaleString("en-IN")}`, "Collected"]}
                  />
                  <Bar
                    dataKey="value"
                    fill={t.series.success}
                    radius={[6, 6, 0, 0]}
                    name="Collected"
                  />
                </BarChart>
              </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <ChartTitle title="Class-wise Strength" subtitle="Students per class" />
          <CardContent>
            {loading ? (
              <Skeleton className="h-[210px] w-full" />
            ) : !ok.students ? (
              <ChartFail height={210} />
            ) : classStrength.length === 0 ? (
              <EmptyState title="No students yet" />
            ) : (
              <div
                role="img"
                aria-label={`Students per class: ${classStrength
                  .map((c) => `${c.class} ${c.students}`)
                  .join(", ")}`}
              >
                <ResponsiveContainer width="100%" height={210}>
                <BarChart data={classStrength} barSize={28} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke={t.grid} horizontal={false} />
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: t.axis }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    dataKey="class"
                    type="category"
                    tick={{ fontSize: 12, fill: t.axis }}
                    axisLine={false}
                    tickLine={false}
                    width={64}
                  />
                  <Tooltip contentStyle={t.tooltip} cursor={{ fill: t.cursor, radius: 6 }} />
                  <Bar
                    dataKey="students"
                    fill={t.series.primary}
                    radius={[0, 6, 6, 0]}
                    name="Students"
                  />
                </BarChart>
              </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card>
          <ChartTitle title="Fee Status" subtitle="Current session" />
          <CardContent className="flex flex-col items-center gap-4">
            {loading ? (
              <Skeleton className="h-[160px] w-full" />
            ) : !ok.accounts ? (
              <ChartFail height={160} />
            ) : !hasFeeStatus ? (
              <EmptyState title="No fee accounts yet" />
            ) : (
              <>
                <div
                  role="img"
                  aria-label={feeStatusData.map((f) => `${f.name} ${f.value}`).join(", ")}
                >
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={feeStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {feeStatusData.map((entry, i) => (
                        <Cell key={entry.name} fill={feeStatusColors[i]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={t.tooltip} />
                  </PieChart>
                </ResponsiveContainer>
                </div>
                <div className="flex w-full flex-col gap-2">
                  {feeStatusData.map((f) => (
                    <div key={f.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn("size-2.5 rounded-sm", toneClass[f.tone])} />
                        <span className="text-sm text-muted">{f.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-text">{f.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <ChartTitle
            title="Key Performance Indicators"
            subtitle="Live figures derived from current records"
          />
          <CardContent className="px-0 py-2">
            {loading ? (
              <div className="flex flex-col gap-3 px-5 py-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              kpis.map((row) => (
                <div
                  key={row.label}
                  className="border-b border-border px-5 py-3 last:border-0"
                >
                  <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium text-text">{row.label}</span>
                    <span className="text-sm font-semibold text-text">{row.value}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-hover">
                    <div
                      className={cn(
                        "h-full rounded-full transition-[width] duration-500",
                        row.neutral
                          ? "bg-primary"
                          : row.pct >= 90
                            ? "bg-success"
                            : row.pct >= 75
                              ? "bg-warning"
                              : "bg-danger"
                      )}
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
       </>
      )}
    </div>
  );
}

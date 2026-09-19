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
import { Users, DollarSign, GraduationCap, Wallet } from "lucide-react";
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
import { listTeachers } from "@/lib/api/teachers";
import {
  feeAccountsApi,
  getFeeSummary,
  totalBilled,
  totalPaid,
  balanceOf,
  type StudentFeeAccount,
  type FeeSummary,
} from "@/lib/api/feeLedger";
import { admissionsApi, type Application } from "@/lib/api/admissions";
import type { Student } from "@/types/student";
import type { Teacher } from "@/types/teacher";

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
      <div className="min-w-0">
        <p className="text-sm font-semibold text-text">{title}</p>
        <p className="mt-0.5 text-xs text-muted">{subtitle}</p>
      </div>
      {legend && (
        <div className="flex shrink-0 items-center gap-3.5">
          {legend.map((l) => (
            <span key={l.label} className="flex items-center gap-1.5 text-xs text-muted">
              <span className={cn("size-2.5 rounded-sm", toneClass[l.tone])} />
              {l.label}
            </span>
          ))}
        </div>
      )}
    </CardHeader>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("month");
  const t = useChartTheme();

  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [accounts, setAccounts] = useState<StudentFeeAccount[]>([]);
  const [feeSummary, setFeeSummary] = useState<FeeSummary | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      listStudents(),
      listTeachers(),
      feeAccountsApi.list(),
      getFeeSummary(),
      admissionsApi.list(),
    ])
      .then(([s, te, ac, fs, ap]) => {
        if (cancelled) return;
        setStudents(s);
        setTeachers(te);
        setAccounts(ac);
        setFeeSummary(fs);
        setApplications(ap);
      })
      .catch(() => {
        /* leaves the empty states in place */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
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
      { name: "Girls", value: counts.female, tone: "danger" },
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
    const avgAttendance = avg(activeStudents, (s) => s.attendancePercent);
    const avgPerformance = avg(activeStudents, (s) => s.performancePercent);
    const collected = feeSummary?.totalCollected ?? 0;
    const outstanding = feeSummary?.outstanding ?? 0;
    const collectionRate =
      collected + outstanding > 0 ? Math.round((collected / (collected + outstanding)) * 100) : 0;
    const activeRate = students.length
      ? Math.round((activeStudents.length / students.length) * 100)
      : 0;
    return [
      { label: "Average Attendance", value: `${avgAttendance}%`, pct: avgAttendance },
      { label: "Average Performance", value: `${avgPerformance}%`, pct: avgPerformance },
      { label: "Fee Collection Rate", value: `${collectionRate}%`, pct: collectionRate },
      {
        label: "Active Students",
        value: `${activeStudents.length} of ${students.length}`,
        pct: activeRate,
      },
    ];
  }, [activeStudents, students, feeSummary]);

  const topMetrics: {
    label: string;
    value: string | number;
    icon: typeof DollarSign;
    tone: StatTone;
  }[] = [
    { label: "Total Students", value: students.length, icon: Users, tone: "indigo" },
    { label: "Total Teachers", value: teachers.length, icon: GraduationCap, tone: "emerald" },
    {
      label: "Fees Collected",
      value: inr.format(feeSummary?.totalCollected ?? 0),
      icon: DollarSign,
      tone: "amber",
    },
    {
      label: "Fees Outstanding",
      value: inr.format(feeSummary?.outstanding ?? 0),
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

  // lastPaymentDate exists on the account, so we can bucket real collections:
  // each account's total paid is credited to the bucket of its last payment.
  const feesTrend = useMemo(
    () => bucketize(accounts, period, (a) => a.lastPaymentDate, (a) => totalPaid(a)),
    [accounts, period]
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
            role="tablist"
            aria-label="Reporting period"
            className="flex items-center gap-1 rounded-md border border-border bg-surface-raised p-1"
          >
            {periods.map((p) => (
              <button
                key={p}
                role="tab"
                aria-selected={period === p}
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
            ) : !hasAdmissions ? (
              <EmptyState
                title="No admissions in this period"
                description="Applications will appear here as they come in."
              />
            ) : (
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
            )}
          </CardContent>
        </Card>

        <Card>
          <ChartTitle
            title="Gender Distribution"
            subtitle={`Total ${students.length} students`}
          />
          <CardContent className="flex flex-col items-center">
            {loading ? (
              <Skeleton className="h-[180px] w-full" />
            ) : !hasGender ? (
              <EmptyState title="No students yet" />
            ) : (
              <>
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
            ) : !hasFees ? (
              <EmptyState
                title="No collections in this period"
                description="Payments will appear here as fees are collected."
              />
            ) : (
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
            )}
          </CardContent>
        </Card>

        <Card>
          <ChartTitle title="Class-wise Strength" subtitle="Students per class" />
          <CardContent>
            {loading ? (
              <Skeleton className="h-[210px] w-full" />
            ) : classStrength.length === 0 ? (
              <EmptyState title="No students yet" />
            ) : (
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
            ) : !hasFeeStatus ? (
              <EmptyState title="No fee accounts yet" />
            ) : (
              <>
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
                        row.pct >= 90 ? "bg-success" : row.pct >= 75 ? "bg-warning" : "bg-danger"
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
    </div>
  );
}

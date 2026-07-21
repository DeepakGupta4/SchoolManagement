"use client";

import React, { useState } from "react";
import {
  AreaChart,
  Area,
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
import { Users, DollarSign, GraduationCap, Bus } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  PageHeader,
  StatCard,
  type StatTone,
} from "@/components/ui";
import { useChartTheme } from "@/hooks/useChartTheme";
import { cn } from "@/lib/utils";

const monthlyAdmissions = [
  { month: "Apr", admissions: 45, withdrawals: 5 },
  { month: "May", admissions: 62, withdrawals: 8 },
  { month: "Jun", admissions: 38, withdrawals: 3 },
  { month: "Jul", admissions: 80, withdrawals: 6 },
  { month: "Aug", admissions: 95, withdrawals: 10 },
  { month: "Sep", admissions: 55, withdrawals: 4 },
  { month: "Oct", admissions: 40, withdrawals: 7 },
  { month: "Nov", admissions: 30, withdrawals: 2 },
];

const feeMonthly = [
  { month: "Apr", collected: 420000, target: 500000 },
  { month: "May", collected: 380000, target: 500000 },
  { month: "Jun", collected: 450000, target: 500000 },
  { month: "Jul", collected: 510000, target: 500000 },
  { month: "Aug", collected: 490000, target: 500000 },
  { month: "Sep", collected: 530000, target: 500000 },
];

const classStrength = [
  { class: "6th", students: 180 },
  { class: "7th", students: 165 },
  { class: "8th", students: 172 },
  { class: "9th", students: 190 },
  { class: "10th", students: 185 },
  { class: "11th", students: 148 },
  { class: "12th", students: 140 },
];

/** `tone` indexes useChartTheme().series — no chart colour is hardcoded here. */
const genderData = [
  { name: "Boys", value: 680, tone: "primary" as const },
  { name: "Girls", value: 560, tone: "danger" as const },
];

const feeStatusData = [
  { name: "Paid", value: 1050, tone: "success" as const },
  { name: "Pending", value: 130, tone: "warning" as const },
  { name: "Overdue", value: 60, tone: "danger" as const },
];

const topMetrics: {
  label: string;
  value: string;
  trend: number;
  icon: typeof DollarSign;
  tone: StatTone;
}[] = [
  { label: "Total Revenue (YTD)", value: "₹62.4L", trend: 12.5, icon: DollarSign, tone: "indigo" },
  { label: "New Admissions (YTD)", value: "445", trend: 8.2, icon: GraduationCap, tone: "emerald" },
  { label: "Avg Attendance", value: "91.4%", trend: -1.2, icon: Users, tone: "amber" },
  { label: "Transport Usage", value: "68%", trend: 3.4, icon: Bus, tone: "violet" },
];

const kpis = [
  { label: "Total Enrolled Students", value: "1,240", target: "1,300", pct: 95 },
  { label: "Fee Collection Rate", value: "84.7%", target: "95%", pct: 85 },
  { label: "Average Attendance", value: "91.4%", target: "95%", pct: 91 },
  { label: "Teacher-Student Ratio", value: "1:14", target: "1:12", pct: 78 },
  { label: "Pass Percentage (Last Exam)", value: "96.2%", target: "98%", pct: 96 },
];

const periods = ["week", "month", "year"] as const;

function ChartTitle({
  title,
  subtitle,
  legend,
}: {
  title: string;
  subtitle: string;
  legend?: { color: string; label: string }[];
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
              <span className="size-2.5 rounded-sm" style={{ background: l.color }} />
              {l.label}
            </span>
          ))}
        </div>
      )}
    </CardHeader>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<(typeof periods)[number]>("month");
  const t = useChartTheme();

  const withdrawals = t.series.danger;
  const genderColors = genderData.map((g) => t.series[g.tone]);
  const feeStatusColors = feeStatusData.map((f) => t.series[f.tone]);

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
        {topMetrics.map((m) => (
          <StatCard key={m.label} variant="stacked" {...m} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <ChartTitle
            title="Admissions Trend"
            subtitle="Monthly admissions vs withdrawals"
            legend={[
              { color: t.series.primary, label: "Admissions" },
              { color: withdrawals, label: "Withdrawals" },
            ]}
          />
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyAdmissions} barSize={18} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: t.axis }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: t.axis }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={t.tooltip} cursor={{ fill: t.cursor, radius: 6 }} />
                <Bar
                  dataKey="admissions"
                  fill={t.series.primary}
                  radius={[6, 6, 0, 0]}
                  name="Admissions"
                />
                <Bar
                  dataKey="withdrawals"
                  fill={withdrawals}
                  radius={[6, 6, 0, 0]}
                  name="Withdrawals"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <ChartTitle title="Gender Distribution" subtitle="Total 1,240 students" />
          <CardContent className="flex flex-col items-center">
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
              {genderData.map((g, i) => (
                <div key={g.name} className="text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ background: genderColors[i] }}
                    />
                    <span className="text-xs text-muted">{g.name}</span>
                  </div>
                  <p className="mt-0.5 text-lg font-semibold text-text">{g.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <ChartTitle title="Fee Collection vs Target" subtitle="Monthly performance" />
          <CardContent>
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={feeMonthly}>
                <defs>
                  <linearGradient id="analyticsCollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={t.series.primary} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={t.series.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: t.axis }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: t.axis }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(v) => [`₹${Number(v).toLocaleString("en-IN")}`, ""]}
                  contentStyle={t.tooltip}
                />
                <Area
                  type="monotone"
                  dataKey="collected"
                  stroke={t.series.primary}
                  strokeWidth={2.5}
                  fill="url(#analyticsCollected)"
                  name="Collected"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="target"
                  stroke={t.grid}
                  strokeWidth={2}
                  fill="none"
                  name="Target"
                  strokeDasharray="5 4"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <ChartTitle title="Class-wise Strength" subtitle="Students per class" />
          <CardContent>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={classStrength} barSize={28} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={t.grid} horizontal={false} />
                <XAxis
                  type="number"
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
                  width={36}
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
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card>
          <ChartTitle title="Fee Status" subtitle="Current session" />
          <CardContent className="flex flex-col items-center gap-4">
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
              {feeStatusData.map((f, i) => (
                <div key={f.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-sm"
                      style={{ background: feeStatusColors[i] }}
                    />
                    <span className="text-sm text-muted">{f.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-text">{f.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <ChartTitle
            title="Key Performance Indicators"
            subtitle="Current academic year summary"
          />
          <CardContent className="px-0 py-2">
            {kpis.map((row) => (
              <div
                key={row.label}
                className="border-b border-border px-5 py-3 last:border-0"
              >
                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium text-text">{row.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-text">{row.value}</span>
                    <span className="text-xs text-subtle">Target: {row.target}</span>
                  </div>
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
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

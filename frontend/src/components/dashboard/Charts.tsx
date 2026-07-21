"use client";

import React from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from "recharts";
import { Card, CardContent, CardHeader } from "@/components/ui";
import { useChartTheme, toneClass, type ChartTone } from "@/hooks/useChartTheme";
import { cn } from "@/lib/utils";

const attendanceData = [
  { day: "Mon", present: 1180, absent: 60 },
  { day: "Tue", present: 1200, absent: 40 },
  { day: "Wed", present: 1150, absent: 90 },
  { day: "Thu", present: 1210, absent: 30 },
  { day: "Fri", present: 1100, absent: 140 },
  { day: "Sat", present: 980, absent: 60 },
];

const feeData = [
  { month: "Apr", collected: 420000, pending: 80000 },
  { month: "May", collected: 380000, pending: 120000 },
  { month: "Jun", collected: 450000, pending: 50000 },
  { month: "Jul", collected: 510000, pending: 90000 },
  { month: "Aug", collected: 490000, pending: 110000 },
  { month: "Sep", collected: 530000, pending: 70000 },
];

function ChartHeader({
  title,
  subtitle,
  legend,
}: {
  title: string;
  subtitle: string;
  /** Swatches are classed, never inline-styled — see toneClass in useChartTheme. */
  legend: { tone: ChartTone; label: string }[];
}) {
  return (
    <CardHeader>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-text">{title}</p>
        <p className="mt-0.5 text-xs text-muted">{subtitle}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3.5">
        {legend.map((l) => (
          <span key={l.label} className="flex items-center gap-1.5 text-xs text-muted">
            <span className={cn("size-2.5 rounded-sm", toneClass[l.tone])} />
            {l.label}
          </span>
        ))}
      </div>
    </CardHeader>
  );
}

export function AttendanceChart() {
  const t = useChartTheme();
  const absent = t.series.danger;

  return (
    <Card>
      <ChartHeader
        title="Weekly Attendance"
        subtitle="Present vs Absent — this week"
        legend={[
          { tone: "primary", label: "Present" },
          { tone: "danger", label: "Absent" },
        ]}
      />
      <CardContent>
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={attendanceData} barSize={20} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: t.axis }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: t.axis }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={t.tooltip} cursor={{ fill: t.cursor, radius: 6 }} />
            <Bar dataKey="present" fill={t.series.primary} radius={[6, 6, 0, 0]} name="Present" />
            <Bar dataKey="absent" fill={absent} radius={[6, 6, 0, 0]} name="Absent" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function FeeCollectionChart() {
  const t = useChartTheme();

  return (
    <Card>
      <ChartHeader
        title="Fee Collection"
        subtitle="Monthly collection trend"
        legend={[
          { tone: "primary", label: "Collected" },
          { tone: "warning", label: "Pending" },
        ]}
      />
      <CardContent>
        <ResponsiveContainer width="100%" height={210}>
          <AreaChart data={feeData}>
            <defs>
              <linearGradient id="gradCollected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={t.series.primary} stopOpacity={0.15} />
                <stop offset="95%" stopColor={t.series.primary} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradPending" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={t.series.warning} stopOpacity={0.1} />
                <stop offset="95%" stopColor={t.series.warning} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: t.axis }} axisLine={false} tickLine={false} />
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
              fill="url(#gradCollected)"
              name="Collected"
              dot={false}
            />
            <Area
              type="monotone"
              dataKey="pending"
              stroke={t.series.warning}
              strokeWidth={2}
              fill="url(#gradPending)"
              name="Pending"
              strokeDasharray="5 4"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

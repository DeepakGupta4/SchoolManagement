"use client";

import React, { useEffect, useState } from "react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from "recharts";
import { Card, CardContent, CardHeader, Skeleton, EmptyState } from "@/components/ui";
import { useChartTheme, toneClass, type ChartTone } from "@/hooks/useChartTheme";
import { cn } from "@/lib/utils";
import { listStudents } from "@/lib/api/students";
import { getFeeSummary, type FeeSummary } from "@/lib/api/feeLedger";

/** Attendance bands used to bucket students by their attendancePercent. */
const ATTENDANCE_BANDS: { band: string; min: number; max: number }[] = [
  { band: "<75%", min: -Infinity, max: 75 },
  { band: "75–85%", min: 75, max: 85 },
  { band: "85–95%", min: 85, max: 95 },
  { band: "95%+", min: 95, max: Infinity },
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

/**
 * The backend does not expose a per-day attendance history, so a real "present
 * vs absent this week" series can't be derived. Instead we chart the live
 * distribution of students across attendance bands — genuinely computed from
 * each student's attendancePercent.
 */
export function AttendanceChart() {
  const t = useChartTheme();
  const [data, setData] = useState<{ band: string; students: number }[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    listStudents()
      .then((students) => {
        if (cancelled) return;
        const active = students.filter((s) => s.status === "active");
        setData(
          ATTENDANCE_BANDS.map((b) => ({
            band: b.band,
            students: active.filter(
              (s) => s.attendancePercent >= b.min && s.attendancePercent < b.max
            ).length,
          }))
        );
      })
      .catch(() => {
        if (!cancelled) setData([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const hasData = !!data && data.some((d) => d.students > 0);

  return (
    <Card>
      <ChartHeader
        title="Attendance Distribution"
        subtitle="Active students by attendance band"
        legend={[{ tone: "primary", label: "Students" }]}
      />
      <CardContent>
        {loading ? (
          <Skeleton className="h-[210px] w-full" />
        ) : !hasData ? (
          <EmptyState
            title="Not enough data yet"
            description="Attendance figures will appear once students are enrolled."
          />
        ) : (
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={data!} barSize={28} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
              <XAxis dataKey="band" tick={{ fontSize: 12, fill: t.axis }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: t.axis }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={t.tooltip} cursor={{ fill: t.cursor, radius: 6 }} />
              <Bar dataKey="students" fill={t.series.primary} radius={[6, 6, 0, 0]} name="Students" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * A per-month collection trend isn't stored, so rather than invent one we chart
 * the live collected-vs-outstanding split from the fee summary — both figures
 * are derived server-side.
 */
export function FeeCollectionChart() {
  const t = useChartTheme();
  const [summary, setSummary] = useState<FeeSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getFeeSummary()
      .then((s) => {
        if (!cancelled) setSummary(s);
      })
      .catch(() => {
        if (!cancelled) setSummary(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const feeData: { label: string; value: number; tone: ChartTone }[] = summary
    ? [
        { label: "Collected", value: summary.totalCollected, tone: "primary" },
        { label: "Outstanding", value: summary.outstanding, tone: "warning" },
      ]
    : [];
  const hasData = !!summary && (summary.totalCollected > 0 || summary.outstanding > 0);

  return (
    <Card>
      <ChartHeader
        title="Fee Collection"
        subtitle="Collected vs outstanding"
        legend={[
          { tone: "primary", label: "Collected" },
          { tone: "warning", label: "Outstanding" },
        ]}
      />
      <CardContent>
        {loading ? (
          <Skeleton className="h-[210px] w-full" />
        ) : !hasData ? (
          <EmptyState
            title="Not enough data yet"
            description="Collection figures will appear once fees are billed."
          />
        ) : (
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={feeData} barSize={56}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: t.axis }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: t.axis }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(v) => [`₹${Number(v).toLocaleString("en-IN")}`, ""]}
                contentStyle={t.tooltip}
                cursor={{ fill: t.cursor, radius: 6 }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Amount">
                {feeData.map((d) => (
                  <Cell key={d.label} fill={t.series[d.tone]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

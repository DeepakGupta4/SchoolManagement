"use client";

import React from "react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from "recharts";
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, Skeleton, EmptyState } from "@/components/ui";
import { useChartTheme, toneClass, type ChartTone } from "@/hooks/useChartTheme";
import { cn } from "@/lib/utils";
import { type FeeSummary } from "@/lib/api/feeLedger";

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
      {/* Wrap on narrow screens so the legend never crushes the title. */}
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text">{title}</p>
          <p className="mt-0.5 text-xs text-muted">{subtitle}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-x-3.5 gap-y-1">
          {legend.map((l) => (
            <span key={l.label} className="flex items-center gap-1.5 text-xs text-muted">
              <span className={cn("size-2.5 rounded-sm", toneClass[l.tone])} />
              {l.label}
            </span>
          ))}
        </div>
      </div>
    </CardHeader>
  );
}

/** Shared "this chart couldn't load" state — distinct from genuinely empty data. */
function ChartError({ what }: { what: string }) {
  return (
    <EmptyState
      icon={<AlertTriangle className="size-5 text-warning-text" />}
      title={`Couldn't load the ${what}`}
      description="There was a problem reaching the server. Reload the page to try again."
    />
  );
}

/**
 * Distribution of active students across attendance bands. Controlled: the
 * bands are computed once, server-side, and handed in — the chart never fetches.
 */
export function AttendanceChart({
  bands,
  loading,
  error,
}: {
  bands: { band: string; students: number }[];
  loading: boolean;
  error?: boolean;
}) {
  const t = useChartTheme();
  const hasData = bands.some((d) => d.students > 0);
  const summaryLabel =
    "Active students by attendance band — " +
    bands.map((b) => `${b.students} ${b.band}`).join(", ");

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
        ) : error ? (
          <ChartError what="attendance chart" />
        ) : !hasData ? (
          <EmptyState
            title="No attendance data yet"
            description="This chart fills in once attendance is marked for your students."
          />
        ) : (
          <div role="img" aria-label={summaryLabel}>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={bands} barSize={28} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
                <XAxis dataKey="band" tick={{ fontSize: 12, fill: t.axis }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: t.axis }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={t.tooltip} cursor={{ fill: t.cursor, radius: 6 }} />
                <Bar dataKey="students" fill={t.series.primary} radius={[6, 6, 0, 0]} name="Students" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Collected-vs-outstanding split from the fee summary. Controlled: the summary
 * is fetched once by the dashboard and passed in; `error` distinguishes a failed
 * fetch (don't tell an established school it's empty) from genuinely-zero books.
 */
export function FeeCollectionChart({
  summary,
  loading,
  error,
}: {
  summary: FeeSummary | null;
  loading: boolean;
  error?: boolean;
}) {
  const t = useChartTheme();

  const feeData: { label: string; value: number; tone: ChartTone }[] = summary
    ? [
        { label: "Collected", value: summary.totalCollected, tone: "primary" },
        { label: "Outstanding", value: summary.outstanding, tone: "warning" },
      ]
    : [];
  const hasData = !!summary && (summary.totalCollected > 0 || summary.outstanding > 0);
  const summaryLabel = summary
    ? `Collected ₹${summary.totalCollected.toLocaleString("en-IN")}, outstanding ₹${summary.outstanding.toLocaleString("en-IN")}`
    : "";

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
        ) : error ? (
          <ChartError what="fee chart" />
        ) : !hasData ? (
          <EmptyState
            title="No collection data yet"
            description="Collection figures will appear once fees are billed and collected."
          />
        ) : (
          <div role="img" aria-label={summaryLabel}>
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}

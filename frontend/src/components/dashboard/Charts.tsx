"use client";

import React from "react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from "recharts";
import { AlertTriangle, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, Skeleton } from "@/components/ui";
import { useChartTheme, toneClass, type ChartTone } from "@/hooks/useChartTheme";
import { cn } from "@/lib/utils";
import { type FeeSummary } from "@/lib/api/feeLedger";

/** Fixed height for the plot area so loading/empty/error/chart all stay compact. */
const CHART_H = 170;

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

/** Compact centred message (error / empty) sized to the plot area. */
function ChartMessage({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 text-center"
      style={{ height: CHART_H }}
    >
      <div className="flex size-10 items-center justify-center rounded-full bg-surface-hover">{icon}</div>
      <div>
        <p className="text-sm font-medium text-text">{title}</p>
        <p className="mt-0.5 text-xs text-muted">{description}</p>
      </div>
    </div>
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
    "Active students by attendance band — " + bands.map((b) => `${b.students} ${b.band}`).join(", ");

  return (
    <Card>
      <ChartHeader
        title="Attendance Distribution"
        subtitle="Active students by attendance band"
        legend={[{ tone: "primary", label: "Students" }]}
      />
      <CardContent>
        {loading ? (
          <Skeleton className="h-[170px] w-full" />
        ) : error ? (
          <ChartMessage
            icon={<AlertTriangle className="size-5 text-warning-text" />}
            title="Couldn't load the attendance chart"
            description="There was a problem reaching the server. Reload to try again."
          />
        ) : !hasData ? (
          <ChartMessage
            icon={<BarChart3 className="size-5 text-subtle" />}
            title="No attendance data yet"
            description="This fills in once attendance is marked."
          />
        ) : (
          <div role="img" aria-label={summaryLabel}>
            <ResponsiveContainer width="100%" height={CHART_H}>
              <BarChart data={bands} barSize={26} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
                <XAxis dataKey="band" tick={{ fontSize: 12, fill: t.axis }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: t.axis }} axisLine={false} tickLine={false} width={28} />
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
          <Skeleton className="h-[170px] w-full" />
        ) : error ? (
          <ChartMessage
            icon={<AlertTriangle className="size-5 text-warning-text" />}
            title="Couldn't load the fee chart"
            description="There was a problem reaching the server. Reload to try again."
          />
        ) : !hasData ? (
          <ChartMessage
            icon={<BarChart3 className="size-5 text-subtle" />}
            title="No collection data yet"
            description="Appears once fees are billed and collected."
          />
        ) : (
          <div role="img" aria-label={summaryLabel}>
            <ResponsiveContainer width="100%" height={CHART_H}>
              <BarChart data={feeData} barSize={52}>
                <CartesianGrid strokeDasharray="3 3" stroke={t.grid} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: t.axis }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: t.axis }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
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

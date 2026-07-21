import React from "react";
import { TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "./Card";

export type StatTone = "indigo" | "emerald" | "amber" | "rose" | "violet" | "cyan";

const gradientFor: Record<StatTone, string> = {
  indigo: "gradient-indigo",
  emerald: "gradient-emerald",
  amber: "gradient-amber",
  rose: "gradient-rose",
  violet: "gradient-violet",
  cyan: "gradient-cyan",
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: StatTone;
  /** Percentage change vs the previous period. Omit to hide the badge. */
  trend?: number;
  suffix?: string;
  /** Secondary line under the label, e.g. "148 students" or "Need follow-up". */
  sub?: string;
  /** "stacked" puts the icon above the value with a trend badge (dashboard
   *  hero tiles); "inline" is the compact icon-beside-value row. */
  variant?: "inline" | "stacked";
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "indigo",
  trend,
  suffix,
  sub,
  variant = "inline",
}: StatCardProps) {
  const badge =
    trend === undefined ? null : (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
          trend >= 0 ? "bg-success-soft text-success-text" : "bg-danger-soft text-danger-text"
        )}
      >
        {trend >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
        {Math.abs(trend)}%
      </span>
    );

  if (variant === "stacked") {
    return (
      <Card className="card-hover">
        <CardContent>
          <div className="mb-4 flex items-start justify-between gap-2">
            <div
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-md text-white shadow-sm",
                gradientFor[tone]
              )}
            >
              <Icon className="size-5" />
            </div>
            {badge}
          </div>
          <p className="text-2xl font-semibold leading-none text-text">
            {value}
            {suffix && <span className="ml-0.5 text-sm font-medium text-subtle">{suffix}</span>}
          </p>
          <p className="mt-1.5 text-xs text-muted">{label}</p>
          {sub && <p className="mt-0.5 text-[11px] text-subtle">{sub}</p>}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex items-center gap-3.5">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-md text-white",
            gradientFor[tone]
          )}
        >
          <Icon className="size-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted">{label}</p>
          <p className="mt-0.5 truncate text-xl font-semibold text-text">
            {value}
            {suffix && <span className="ml-0.5 text-sm font-medium text-subtle">{suffix}</span>}
          </p>
          {sub && <p className="mt-0.5 truncate text-[11px] text-subtle">{sub}</p>}
        </div>
        {badge}
      </CardContent>
    </Card>
  );
}

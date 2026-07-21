"use client";

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  BellRing,
  BookOpenCheck,
  CalendarClock,
  FileText,
  Lightbulb,
  Play,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  PageHeader,
  Select,
  StatCard,
  useToast,
} from "@/components/ui";

type Tone = "indigo" | "emerald" | "amber" | "rose" | "violet" | "cyan";

const GRADIENTS: Record<Tone, string> = {
  indigo: "gradient-indigo",
  emerald: "gradient-emerald",
  amber: "gradient-amber",
  rose: "gradient-rose",
  violet: "gradient-violet",
  cyan: "gradient-cyan",
};

const FEATURES = [
  {
    id: "risk",
    name: "Student Risk Detection",
    description:
      "Flags students trending toward failure using attendance, marks and fee-default signals.",
    status: "Live",
    variant: "success" as const,
    tone: "rose" as Tone,
    icon: AlertTriangle,
    runs: 1284,
    quota: 2000,
    lastRun: "Today, 06:00 AM",
    defaultOn: true,
  },
  {
    id: "comments",
    name: "Report Card Comments",
    description:
      "Drafts personalised remarks per student in the teacher's tone, ready to edit before publishing.",
    status: "Live",
    variant: "success" as const,
    tone: "indigo" as Tone,
    icon: FileText,
    runs: 3412,
    quota: 5000,
    lastRun: "Yesterday, 04:20 PM",
    defaultOn: true,
  },
  {
    id: "paper",
    name: "Question Paper Generator",
    description:
      "Builds CBSE blueprint-compliant papers from the syllabus with a marks-weightage split.",
    status: "Beta",
    variant: "warning" as const,
    tone: "violet" as Tone,
    icon: BookOpenCheck,
    runs: 486,
    quota: 1000,
    lastRun: "18 Jul 2026, 11:05 AM",
    defaultOn: true,
  },
  {
    id: "timetable",
    name: "Timetable Generator",
    description:
      "Solves teacher availability, lab slots and period constraints into a clash-free timetable.",
    status: "Beta",
    variant: "warning" as const,
    tone: "cyan" as Tone,
    icon: CalendarClock,
    runs: 62,
    quota: 200,
    lastRun: "01 Apr 2026, 09:00 AM",
    defaultOn: false,
  },
  {
    id: "fees",
    name: "Fee Reminder",
    description:
      "Writes gentle, escalating WhatsApp reminders in English or Hindi based on days overdue.",
    status: "Live",
    variant: "success" as const,
    tone: "emerald" as Tone,
    icon: BellRing,
    runs: 2190,
    quota: 3000,
    lastRun: "Today, 09:15 AM",
    defaultOn: true,
  },
  {
    id: "attendance",
    name: "Attendance Insights",
    description:
      "Explains dips in class attendance and correlates them with exams, weather and local events.",
    status: "Preview",
    variant: "info" as const,
    tone: "amber" as Tone,
    icon: TrendingUp,
    runs: 148,
    quota: 500,
    lastRun: "20 Jul 2026, 07:40 PM",
    defaultOn: false,
  },
];

const INSIGHTS = [
  {
    id: "IN-118",
    title: "14 students in IX-B are at high dropout risk",
    detail:
      "Attendance fell below 68% for three consecutive weeks and 9 of them have pending Term-1 dues.",
    source: "Student Risk Detection",
    impact: "high",
    at: "Today, 06:04 AM",
  },
  {
    id: "IN-117",
    title: "Mathematics scores dropped 8% in Class X",
    detail:
      "The dip aligns with the Trigonometry unit. Consider a remedial series before the pre-boards.",
    source: "Attendance Insights",
    impact: "high",
    at: "Today, 05:50 AM",
  },
  {
    id: "IN-116",
    title: "Fee collection will miss the July target by ₹4.2L",
    detail:
      "At the current pace 118 families remain unpaid. A Hindi reminder variant lifted payment rate by 11% last month.",
    source: "Fee Reminder",
    impact: "medium",
    at: "Yesterday, 08:30 PM",
  },
  {
    id: "IN-115",
    title: "Period 7 has the worst attendance across all classes",
    detail:
      "Average presence is 74% versus 91% for period 1. Swapping games and science labs may help.",
    source: "Attendance Insights",
    impact: "medium",
    at: "Yesterday, 07:12 PM",
  },
  {
    id: "IN-114",
    title: "Report card comments saved teachers ~46 hours",
    detail:
      "1,140 drafts generated for Term-1; 82% were published with minor edits only.",
    source: "Report Card Comments",
    impact: "low",
    at: "19 Jul 2026, 03:20 PM",
  },
  {
    id: "IN-113",
    title: "Physics paper difficulty skewed toward recall",
    detail:
      "Only 18% of marks target higher-order thinking. The CBSE blueprint expects 30%.",
    source: "Question Paper Generator",
    impact: "medium",
    at: "18 Jul 2026, 11:12 AM",
  },
];

const IMPACT_VARIANT: Record<string, "danger" | "warning" | "default"> = {
  high: "danger",
  medium: "warning",
  low: "default",
};

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`focus-ring inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors ${
        checked ? "bg-primary" : "bg-border-strong"
      }`}
    >
      <span
        className={`size-4 rounded-full bg-surface-raised shadow-sm transition-transform ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function AiPage() {
  const { toast } = useToast();

  const [enabled, setEnabled] = useState<string[]>(
    FEATURES.filter((f) => f.defaultOn).map((f) => f.id)
  );
  const [impact, setImpact] = useState("");

  const toggleFeature = (id: string) => {
    const feature = FEATURES.find((f) => f.id === id);
    const turningOn = !enabled.includes(id);
    setEnabled((prev) => (turningOn ? [...prev, id] : prev.filter((f) => f !== id)));
    toast({
      title: turningOn ? `${feature?.name} enabled` : `${feature?.name} paused`,
      description: turningOn
        ? "The model will run on its next scheduled window."
        : "No further runs will be scheduled until you re-enable it.",
      variant: turningOn ? "success" : "info",
    });
  };

  const totalRuns = useMemo(
    () => FEATURES.reduce((sum, f) => sum + (enabled.includes(f.id) ? f.runs : 0), 0),
    [enabled]
  );

  const filteredInsights = impact ? INSIGHTS.filter((i) => i.impact === impact) : INSIGHTS;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="AI Suite"
        description="Assistive models for risk, reporting, paper setting and parent nudges."
        actions={
          <>
            <Button
              variant="outline"
              onClick={() =>
                toast({
                  title: "Insights refreshed",
                  description: `${filteredInsights.length} insights re-evaluated against today's data.`,
                  variant: "info",
                })
              }
            >
              <Sparkles className="size-4" />
              Refresh insights
            </Button>
            <Button
              onClick={() =>
                toast({
                  title: "All enabled models queued",
                  description: `${enabled.length} features will run in the next batch.`,
                  variant: "success",
                })
              }
            >
              <Play className="size-4" />
              Run all
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active features" value={enabled.length} suffix={` / ${FEATURES.length}`} icon={Zap} tone="indigo" />
        <StatCard label="Runs this month" value={totalRuns.toLocaleString("en-IN")} icon={Sparkles} tone="violet" trend={18} />
        <StatCard label="Open insights" value={INSIGHTS.length} icon={Lightbulb} tone="amber" />
        <StatCard
          label="High-impact alerts"
          value={INSIGHTS.filter((i) => i.impact === "high").length}
          icon={AlertTriangle}
          tone="rose"
          sub="Needs a decision"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {FEATURES.map((feature) => {
          const Icon = feature.icon;
          const on = enabled.includes(feature.id);
          const pct = Math.min(100, Math.round((feature.runs / feature.quota) * 100));
          return (
            <Card key={feature.id} className={on ? undefined : "opacity-70"}>
              <CardContent className="flex h-full flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`flex size-10 shrink-0 items-center justify-center rounded-md text-white shadow-sm ${GRADIENTS[feature.tone]}`}
                  >
                    <Icon className="size-5" />
                  </div>
                  <Toggle
                    checked={on}
                    onChange={() => toggleFeature(feature.id)}
                    label={`Enable ${feature.name}`}
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-text">{feature.name}</h3>
                    <Badge variant={feature.variant}>{feature.status}</Badge>
                    {!on && <Badge variant="default">Paused</Badge>}
                  </div>
                  <p className="mt-1.5 text-xs text-muted">{feature.description}</p>
                </div>

                <div className="mt-auto flex flex-col gap-1.5 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted">
                      {feature.runs.toLocaleString("en-IN")} runs
                    </span>
                    <span className="text-subtle">
                      {pct}% of {feature.quota.toLocaleString("en-IN")} quota
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-hover">
                    {/* Width is genuinely data-driven. */}
                    <div
                      className={`h-full rounded-full ${on ? "bg-primary" : "bg-border-strong"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-xs text-subtle">Last run: {feature.lastRun}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex-wrap">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-text">AI Insights</h2>
            <p className="mt-0.5 text-xs text-muted">
              Generated overnight from attendance, marks, fees and timetable data.
            </p>
          </div>
          <div className="w-44">
            <Select
              value={impact}
              onChange={(e) => setImpact(e.target.value)}
              placeholder="All impact levels"
              options={[
                { label: "High impact", value: "high" },
                { label: "Medium impact", value: "medium" },
                { label: "Low impact", value: "low" },
              ]}
              aria-label="Filter insights by impact"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredInsights.length === 0 ? (
            <EmptyState
              title="No insights at this level"
              description="Clear the impact filter to see everything the models produced."
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {filteredInsights.map((insight) => (
                <li
                  key={insight.id}
                  className="rounded-md border border-border bg-surface-sunken p-4 transition-colors hover:bg-surface-hover"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-medium text-text">{insight.title}</p>
                    <Badge variant={IMPACT_VARIANT[insight.impact] ?? "default"} className="capitalize">
                      {insight.impact} impact
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-xs text-muted">{insight.detail}</p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-subtle">
                    <Badge variant="outline">{insight.source}</Badge>
                    <span>{insight.at}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowRight,
  Bus,
  CircleCheck,
  ClipboardList,
  IndianRupee,
  LayoutTemplate,
  Plus,
  Repeat,
  Search,
  UserMinus,
  Workflow,
  Zap,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  Input,
  PageHeader,
  Select,
  StatCard,
  useToast,
} from "@/components/ui";

const RULES = [
  {
    id: "WF-01",
    name: "Fee due reminder",
    trigger: "When fee is due in 3 days",
    action: "Send WhatsApp to parent",
    category: "Fees",
    owner: "Mr. Anil Kumar",
    runs: 1842,
    successRate: 97,
    lastRun: "Today, 09:15 AM",
    defaultOn: true,
  },
  {
    id: "WF-02",
    name: "Absentee SMS",
    trigger: "When a student is marked absent at roll call",
    action: "Send SMS to primary guardian",
    category: "Attendance",
    owner: "Ms. Sunita Verma",
    runs: 4210,
    successRate: 99,
    lastRun: "Today, 08:25 AM",
    defaultOn: true,
  },
  {
    id: "WF-03",
    name: "Chronic absence escalation",
    trigger: "When attendance falls below 75% in a month",
    action: "Create counsellor task + email class teacher",
    category: "Attendance",
    owner: "Dr. Priya Sharma",
    runs: 96,
    successRate: 94,
    lastRun: "Yesterday, 07:00 PM",
    defaultOn: true,
  },
  {
    id: "WF-04",
    name: "Result published alert",
    trigger: "When exam results are published",
    action: "Notify parents in-app and email the marksheet",
    category: "Exams",
    owner: "Mr. Rahul Verma",
    runs: 312,
    successRate: 100,
    lastRun: "19 Jul 2026, 04:10 PM",
    defaultOn: true,
  },
  {
    id: "WF-05",
    name: "Bus delay broadcast",
    trigger: "When a bus is delayed by over 10 minutes",
    action: "WhatsApp all parents on that route",
    category: "Transport",
    owner: "Mr. Deepak Singh",
    runs: 148,
    successRate: 92,
    lastRun: "17 Jul 2026, 07:35 AM",
    defaultOn: false,
  },
  {
    id: "WF-06",
    name: "Leave approval routing",
    trigger: "When a teacher applies for leave",
    action: "Send to principal for approval and arrange a substitute",
    category: "HR",
    owner: "Ms. Pooja Mehta",
    runs: 274,
    successRate: 96,
    lastRun: "Today, 11:02 AM",
    defaultOn: true,
  },
  {
    id: "WF-07",
    name: "Library overdue nudge",
    trigger: "When a book is 7 days overdue",
    action: "Email student and add a ₹5/day fine",
    category: "Library",
    owner: "Ms. Kavita Joshi",
    runs: 528,
    successRate: 98,
    lastRun: "Yesterday, 06:00 PM",
    defaultOn: false,
  },
  {
    id: "WF-08",
    name: "Admission enquiry follow-up",
    trigger: "When an enquiry stays unattended for 2 days",
    action: "Assign to the front desk and send a brochure",
    category: "Admissions",
    owner: "Ms. Sunita Verma",
    runs: 421,
    successRate: 89,
    lastRun: "Today, 10:20 AM",
    defaultOn: true,
  },
];

const CATEGORY_VARIANT: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  Fees: "success",
  Attendance: "info",
  Exams: "warning",
  Transport: "danger",
  HR: "default",
  Library: "warning",
  Admissions: "info",
};

const TEMPLATES = [
  {
    id: "TP-01",
    name: "Term fee collection drive",
    description: "Three escalating reminders at T-7, T-3 and T+1 days across WhatsApp and SMS.",
    icon: IndianRupee,
    gradient: "gradient-emerald",
    steps: 4,
    installs: 312,
  },
  {
    id: "TP-02",
    name: "Daily absentee call list",
    description: "Builds a call sheet for the front desk from unexcused absences before 10 AM.",
    icon: UserMinus,
    gradient: "gradient-indigo",
    steps: 3,
    installs: 198,
  },
  {
    id: "TP-03",
    name: "Exam readiness checklist",
    description: "Admit cards, seating plan and invigilator duty reminders two weeks out.",
    icon: ClipboardList,
    gradient: "gradient-violet",
    steps: 6,
    installs: 141,
  },
  {
    id: "TP-04",
    name: "Route delay broadcast",
    description: "Pushes live GPS delay alerts to every parent mapped to the affected bus.",
    icon: Bus,
    gradient: "gradient-amber",
    steps: 3,
    installs: 87,
  },
  {
    id: "TP-05",
    name: "Substitute teacher assignment",
    description: "Finds a free teacher for every period of an approved leave and notifies them.",
    icon: Repeat,
    gradient: "gradient-cyan",
    steps: 5,
    installs: 76,
  },
  {
    id: "TP-06",
    name: "New admission onboarding",
    description: "Welcome kit, uniform sizing form, transport opt-in and first-day briefing.",
    icon: CircleCheck,
    gradient: "gradient-rose",
    steps: 7,
    installs: 64,
  },
];

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

export default function WorkflowsPage() {
  const { toast } = useToast();

  const [active, setActive] = useState<string[]>(
    RULES.filter((r) => r.defaultOn).map((r) => r.id)
  );
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

  const toggleRule = (id: string) => {
    const rule = RULES.find((r) => r.id === id);
    const turningOn = !active.includes(id);
    setActive((prev) => (turningOn ? [...prev, id] : prev.filter((r) => r !== id)));
    toast({
      title: turningOn ? `${rule?.name} enabled` : `${rule?.name} disabled`,
      description: turningOn
        ? "The rule will fire the next time its trigger matches."
        : "The rule will stop firing until you enable it again.",
      variant: turningOn ? "success" : "info",
    });
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return RULES.filter((rule) => {
      const matchSearch =
        !q ||
        rule.name.toLowerCase().includes(q) ||
        rule.trigger.toLowerCase().includes(q) ||
        rule.action.toLowerCase().includes(q);
      const matchCategory = !category || rule.category === category;
      return matchSearch && matchCategory;
    });
  }, [search, category]);

  const totalRuns = RULES.reduce((sum, r) => sum + r.runs, 0);
  const avgSuccess = Math.round(RULES.reduce((s, r) => s + r.successRate, 0) / RULES.length);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Workflow Builder"
        description="Automate the routine — triggers on the left, actions on the right."
        actions={
          <>
            <Button
              variant="outline"
              onClick={() =>
                toast({
                  title: "Run history opened",
                  description: `${totalRuns.toLocaleString("en-IN")} executions recorded this session.`,
                  variant: "info",
                })
              }
            >
              <Repeat className="size-4" />
              Run history
            </Button>
            <Button
              onClick={() =>
                toast({
                  title: "New workflow started",
                  description: "Pick a trigger to begin building your automation.",
                  variant: "success",
                })
              }
            >
              <Plus className="size-4" />
              New workflow
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total rules" value={RULES.length} icon={Workflow} tone="indigo" />
        <StatCard label="Enabled" value={active.length} suffix={` / ${RULES.length}`} icon={Zap} tone="emerald" />
        <StatCard label="Runs this month" value={totalRuns.toLocaleString("en-IN")} icon={Repeat} tone="cyan" trend={12} />
        <StatCard label="Avg success rate" value={avgSuccess} suffix="%" icon={CircleCheck} tone="amber" />
      </div>

      <Card>
        <CardHeader className="flex-wrap">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-text">Automation rules</h2>
            <p className="mt-0.5 text-xs text-muted">
              Toggle a rule to pause or resume it immediately.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-60">
              <Input
                type="search"
                placeholder="Search triggers or actions…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search className="size-4" />}
                aria-label="Search workflows"
              />
            </div>
            <div className="w-44">
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="All categories"
                options={Object.keys(CATEGORY_VARIANT).map((c) => ({ label: c, value: c }))}
                aria-label="Filter by category"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <EmptyState
              title="No workflows match"
              description="Try a different search term or clear the category filter."
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {filtered.map((rule) => {
                const on = active.includes(rule.id);
                return (
                  <li
                    key={rule.id}
                    className={`rounded-md border border-border p-4 transition-colors ${
                      on ? "bg-surface-sunken" : "bg-surface-sunken opacity-70"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-text">{rule.name}</p>
                          <Badge variant={CATEGORY_VARIANT[rule.category] ?? "default"}>
                            {rule.category}
                          </Badge>
                          <Badge variant={on ? "success" : "default"}>
                            {on ? "Enabled" : "Paused"}
                          </Badge>
                        </div>

                        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
                          <span className="rounded-sm bg-info-soft px-2 py-1 font-medium text-info-text">
                            {rule.trigger}
                          </span>
                          <ArrowRight className="size-3.5 text-subtle" />
                          <span className="rounded-sm bg-primary-soft px-2 py-1 font-medium text-primary-text">
                            {rule.action}
                          </span>
                        </div>

                        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-subtle">
                          <span>{rule.runs.toLocaleString("en-IN")} runs</span>
                          <span>{rule.successRate}% success</span>
                          <span>Last run: {rule.lastRun}</span>
                          <span>Owner: {rule.owner}</span>
                        </div>
                      </div>

                      <Toggle
                        checked={on}
                        onChange={() => toggleRule(rule.id)}
                        label={`Enable ${rule.name}`}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-text">Template gallery</h2>
            <p className="mt-0.5 text-xs text-muted">
              Pre-built multi-step automations you can install and edit.
            </p>
          </div>
          <Badge variant="outline">
            <LayoutTemplate className="mr-1 size-3" />
            {TEMPLATES.length} templates
          </Badge>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {TEMPLATES.map((tpl) => {
            const Icon = tpl.icon;
            return (
              <div
                key={tpl.id}
                className="card-hover flex h-full flex-col gap-3 rounded-md border border-border bg-surface-sunken p-4"
              >
                <div
                  className={`flex size-10 items-center justify-center rounded-md text-white shadow-sm ${tpl.gradient}`}
                >
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text">{tpl.name}</p>
                  <p className="mt-1 text-xs text-muted">{tpl.description}</p>
                </div>
                <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                  <span className="text-xs text-subtle">
                    {tpl.steps} steps · {tpl.installs} installs
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      toast({
                        title: `${tpl.name} installed`,
                        description: `${tpl.steps} steps added as a draft workflow.`,
                        variant: "success",
                      })
                    }
                  >
                    Use template
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

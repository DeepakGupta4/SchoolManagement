"use client";

import React, { useState } from "react";
import {
  CircleCheck,
  LayoutTemplate,
  Plus,
  Repeat,
  Search,
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

const CATEGORY_VARIANT: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  Fees: "success",
  Attendance: "info",
  Exams: "warning",
  Transport: "danger",
  HR: "default",
  Library: "warning",
  Admissions: "info",
};

export default function WorkflowsPage() {
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");

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
                  title: "Run history",
                  description: "No executions recorded yet.",
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
        <StatCard label="Total rules" value={0} icon={Workflow} tone="indigo" />
        <StatCard label="Enabled" value={0} icon={Zap} tone="emerald" />
        <StatCard label="Runs this month" value={0} icon={Repeat} tone="cyan" />
        <StatCard label="Avg success rate" value={0} suffix="%" icon={CircleCheck} tone="amber" />
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
          <EmptyState
            title="No automation rules yet"
            description="Create a workflow to automate reminders, alerts and routine tasks."
            icon={<Workflow className="size-5" />}
          />
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
            0 templates
          </Badge>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No templates yet"
            description="Templates you publish or install will appear here."
            icon={<LayoutTemplate className="size-5" />}
          />
        </CardContent>
      </Card>
    </div>
  );
}

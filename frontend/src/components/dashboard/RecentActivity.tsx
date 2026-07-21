"use client";

import React from "react";
import { Clock, UserPlus, DollarSign, CheckSquare, AlertTriangle, Bus, BookOpen } from "lucide-react";
import { Badge, Card, CardHeader } from "@/components/ui";
import { cn } from "@/lib/utils";

type ActivityTone = "success" | "info" | "warning" | "danger";

const activities: {
  id: number;
  type: string;
  text: string;
  time: string;
  tone: ActivityTone;
  icon: typeof UserPlus;
}[] = [
  { id: 1, type: "admission", text: "New admission: Aryan Sharma (Class 9-A)", time: "2 min ago", tone: "success", icon: UserPlus },
  { id: 2, type: "fee", text: "Fee paid: Priya Patel — ₹12,500", time: "15 min ago", tone: "success", icon: DollarSign },
  { id: 3, type: "attendance", text: "Attendance marked for Class 10-B", time: "32 min ago", tone: "info", icon: CheckSquare },
  { id: 4, type: "leave", text: "Leave request: Rahul Verma (Teacher)", time: "1 hr ago", tone: "warning", icon: AlertTriangle },
  { id: 5, type: "fee", text: "Fee overdue: 23 students — Class 8", time: "2 hr ago", tone: "danger", icon: AlertTriangle },
  { id: 6, type: "exam", text: "Result published: Mid-Term Class 12", time: "3 hr ago", tone: "info", icon: BookOpen },
  { id: 7, type: "transport", text: "Bus Route 3 — delayed by 10 mins", time: "4 hr ago", tone: "warning", icon: Bus },
];

const iconTone: Record<ActivityTone, string> = {
  success: "bg-success-soft text-success-text",
  info: "bg-info-soft text-info-text",
  warning: "bg-warning-soft text-warning-text",
  danger: "bg-danger-soft text-danger-text",
};

export function RecentActivity() {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text">Recent Activity</p>
          <p className="mt-0.5 text-xs text-muted">Latest updates across school</p>
        </div>
        <button className="focus-ring shrink-0 rounded-md text-xs font-semibold text-primary transition-colors hover:text-primary-hover">
          View all
        </button>
      </CardHeader>

      <div>
        {activities.map((a) => {
          const Icon = a.icon;
          return (
            <div
              key={a.id}
              className="flex items-center gap-3 border-b border-border px-5 py-3 transition-colors last:border-0 hover:bg-surface-hover"
            >
              <div
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-md",
                  iconTone[a.tone]
                )}
              >
                <Icon className="size-4" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-text">{a.text}</p>
                <span className="mt-0.5 flex items-center gap-1 text-[11px] text-subtle">
                  <Clock className="size-2.5" />
                  {a.time}
                </span>
              </div>

              <Badge
                variant={a.tone === "info" ? "info" : a.tone}
                className="shrink-0 capitalize"
              >
                {a.type}
              </Badge>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

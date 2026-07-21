"use client";

import React from "react";
import { Clock, Trophy, Users, BookOpen, Calendar } from "lucide-react";
import { Badge, Card, CardHeader } from "@/components/ui";

type EventType = "event" | "meeting" | "exam";

const events: {
  id: number;
  title: string;
  date: string;
  time: string;
  type: EventType;
  icon: typeof Trophy;
}[] = [
  { id: 1, title: "Annual Sports Day", date: "Jul 22", time: "9:00 AM", type: "event", icon: Trophy },
  { id: 2, title: "Parent-Teacher Meeting", date: "Jul 24", time: "10:00 AM", type: "meeting", icon: Users },
  { id: 3, title: "Mid-Term Exams Begin", date: "Jul 28", time: "8:30 AM", type: "exam", icon: BookOpen },
  { id: 4, title: "Independence Day Celebration", date: "Aug 15", time: "8:00 AM", type: "event", icon: Trophy },
  { id: 5, title: "Science Exhibition", date: "Aug 20", time: "11:00 AM", type: "event", icon: Calendar },
];

const typeMeta: Record<EventType, { label: string; variant: "info" | "warning" | "danger" }> = {
  event: { label: "Event", variant: "info" },
  meeting: { label: "Meeting", variant: "warning" },
  exam: { label: "Exam", variant: "danger" },
};

const dateGradients = [
  "gradient-indigo",
  "gradient-violet",
  "gradient-rose",
  "gradient-amber",
  "gradient-emerald",
];

export function UpcomingEvents() {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text">Upcoming Events</p>
          <p className="mt-0.5 text-xs text-muted">Next scheduled activities</p>
        </div>
        <button className="focus-ring shrink-0 rounded-md text-xs font-semibold text-primary transition-colors hover:text-primary-hover">
          View calendar
        </button>
      </CardHeader>

      <div>
        {events.map((e, i) => {
          const meta = typeMeta[e.type];
          const [month, day] = e.date.split(" ");
          return (
            <div
              key={e.id}
              className="flex items-center gap-3 border-b border-border px-5 py-3 transition-colors last:border-0 hover:bg-surface-hover"
            >
              <div
                className={`flex h-11 w-10 shrink-0 flex-col items-center justify-center rounded-md text-white shadow-sm ${
                  dateGradients[i % dateGradients.length]
                }`}
              >
                <span className="text-[9px] font-semibold uppercase leading-none opacity-80">
                  {month}
                </span>
                <span className="text-base font-bold leading-tight">{day}</span>
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold text-text">{e.title}</p>
                <span className="mt-0.5 flex items-center gap-1 text-[11px] text-subtle">
                  <Clock className="size-2.5" />
                  {e.time}
                </span>
              </div>

              <Badge variant={meta.variant} className="shrink-0">
                {meta.label}
              </Badge>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

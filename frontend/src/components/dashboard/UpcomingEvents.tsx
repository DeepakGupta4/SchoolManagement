"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { Badge, Card, CardHeader, Skeleton } from "@/components/ui";
import { eventsApi, type SchoolEvent, type EventCategory } from "@/lib/api/events";

const categoryVariant: Record<EventCategory, "info" | "warning" | "danger" | "success"> = {
  Cultural: "info",
  Sports: "success",
  Academic: "warning",
  Competition: "danger",
};

const dateGradients = ["gradient-indigo", "gradient-violet", "gradient-rose", "gradient-amber", "gradient-emerald"];

/** Parses "2026-08-14" → { month: "AUG", day: "14" }. */
function parseDate(iso: string): { month: string; day: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { month: "", day: iso };
  return {
    month: d.toLocaleDateString("en-IN", { month: "short" }).toUpperCase(),
    day: String(d.getDate()),
  };
}

export function UpcomingEvents() {
  const [events, setEvents] = useState<SchoolEvent[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      eventsApi
        .list()
        .then((all) => {
          if (cancelled) return;
          const today = new Date().toISOString().slice(0, 10);
          const upcoming = all
            .filter((e) => e.status !== "completed" && e.status !== "cancelled" && (!e.date || e.date >= today))
            .sort((a, b) => (a.date < b.date ? -1 : 1))
            .slice(0, 5);
          setEvents(upcoming);
        })
        .catch(() => !cancelled && setEvents([]));
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-text">Upcoming Events</p>
          <p className="mt-0.5 text-xs text-muted">Next scheduled activities</p>
        </div>
        <Link href="/events" className="focus-ring shrink-0 rounded-md text-xs font-semibold text-primary transition-colors hover:text-primary-hover">
          View all
        </Link>
      </CardHeader>

      <div>
        {events === null ? (
          <div className="flex flex-col gap-2 p-4">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : events.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">No upcoming events.</p>
        ) : (
          events.map((e, i) => {
            const { month, day } = parseDate(e.date);
            return (
              <div key={e.id} className="flex items-center gap-3 border-b border-border px-5 py-3 transition-colors last:border-0 hover:bg-surface-hover">
                <div className={`flex h-11 w-10 shrink-0 flex-col items-center justify-center rounded-md text-white shadow-sm ${dateGradients[i % dateGradients.length]}`}>
                  <span className="text-[9px] font-semibold uppercase leading-none opacity-80">{month}</span>
                  <span className="text-base font-bold leading-tight">{day}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-text">{e.name}</p>
                  <span className="mt-0.5 flex items-center gap-1 text-[11px] text-subtle">
                    <MapPin className="size-2.5" />
                    {e.venue || "Campus"}
                  </span>
                </div>
                <Badge variant={categoryVariant[e.category] ?? "info"} className="shrink-0">
                  {e.category}
                </Badge>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}

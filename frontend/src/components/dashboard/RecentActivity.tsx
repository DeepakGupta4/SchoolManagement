"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock, UserPlus, DollarSign, CheckSquare, AlertTriangle, Megaphone, Bell, GraduationCap, type LucideIcon,
} from "lucide-react";
import { Badge, Card, CardHeader, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";
import { getNotifications, type AppNotification } from "@/lib/api/notifications";

type Tone = "success" | "info" | "warning" | "danger";

/** Map a notification type to a look. */
function meta(type: string): { icon: LucideIcon; tone: Tone; label: string } {
  switch (type) {
    case "student":
      return { icon: GraduationCap, tone: "success", label: "student" };
    case "teacher":
      return { icon: UserPlus, tone: "success", label: "staff" };
    case "fee":
    case "payment":
      return { icon: DollarSign, tone: "success", label: "fee" };
    case "approved":
      return { icon: CheckSquare, tone: "success", label: "approved" };
    case "trial_ending":
    case "sub_expiring":
      return { icon: AlertTriangle, tone: "warning", label: "billing" };
    case "trial_expired":
      return { icon: AlertTriangle, tone: "danger", label: "expired" };
    case "broadcast":
      return { icon: Megaphone, tone: "info", label: "notice" };
    default:
      return { icon: Bell, tone: "info", label: "update" };
  }
}

const iconTone: Record<Tone, string> = {
  success: "bg-success-soft text-success-text",
  info: "bg-info-soft text-info-text",
  warning: "bg-warning-soft text-warning-text",
  danger: "bg-danger-soft text-danger-text",
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function RecentActivity() {
  const router = useRouter();
  const [items, setItems] = useState<AppNotification[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      getNotifications()
        .then(({ items }) => !cancelled && setItems(items.slice(0, 8)))
        .catch(() => !cancelled && setItems([]));
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
          <p className="text-sm font-semibold text-text">Recent Activity</p>
          <p className="mt-0.5 text-xs text-muted">Latest updates across school</p>
        </div>
      </CardHeader>

      <div>
        {items === null ? (
          <div className="flex flex-col gap-2 p-4">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : items.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">No recent activity yet.</p>
        ) : (
          items.map((a) => {
            const m = meta(a.type);
            const Icon = m.icon;
            return (
              <button
                key={a.id}
                onClick={() => a.link && router.push(a.link)}
                className="flex w-full items-center gap-3 border-b border-border px-5 py-3 text-left transition-colors last:border-0 hover:bg-surface-hover"
              >
                <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-md", iconTone[m.tone])}>
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-text">{a.title}</p>
                  <span className="mt-0.5 flex items-center gap-1 text-[11px] text-subtle">
                    <Clock className="size-2.5" />
                    {relativeTime(a.createdAt)}
                    {a.body ? ` · ${a.body}` : ""}
                  </span>
                </div>
                <Badge variant={m.tone === "info" ? "info" : m.tone} className="shrink-0 capitalize">
                  {m.label}
                </Badge>
              </button>
            );
          })
        )}
      </div>
    </Card>
  );
}

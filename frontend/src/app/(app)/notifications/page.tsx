"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle, ArrowRightLeft, Bell, CheckCheck, CheckSquare, Clock, DollarSign, GraduationCap,
  Megaphone, UserPlus, type LucideIcon,
} from "lucide-react";
import { Badge, Button, Card, EmptyState, PageHeader, Skeleton, useToast } from "@/components/ui";
import { cn } from "@/lib/utils";
import { getNotifications, markAllNotificationsRead, type AppNotification } from "@/lib/api/notifications";

type Tone = "success" | "info" | "warning" | "danger";

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
    case "substitution":
      return { icon: ArrowRightLeft, tone: "info", label: "cover" };
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

export default function NotificationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState<AppNotification[] | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    return getNotifications()
      .then(({ items }) => {
        setError(false);
        setItems(items);
      })
      .catch(() => {
        setError(true);
        setItems([]);
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      getNotifications()
        .then(({ items }) => {
          if (cancelled) return;
          setError(false);
          setItems(items);
        })
        .catch(() => {
          if (cancelled) return;
          setError(true);
          setItems([]);
        });
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);

  const markAll = async () => {
    try {
      await markAllNotificationsRead();
      await load();
      toast({ title: "All caught up", description: "Every notification is marked read.", variant: "success" });
    } catch {
      toast({ title: "Couldn't update", description: "Please try again.", variant: "error" });
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Activity"
        description="Every update across your school — students, staff, fees and notices."
        actions={
          items && items.length > 0 ? (
            <Button variant="outline" onClick={markAll}>
              <CheckCheck className="size-4" />
              Mark all read
            </Button>
          ) : undefined
        }
      />

      <Card className="overflow-hidden">
        {items === null ? (
          <div className="flex flex-col gap-2 p-4">
            {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : error ? (
          <EmptyState
            icon={<AlertTriangle className="size-5 text-warning-text" />}
            title="Couldn't load activity"
            description="There was a problem reaching the server. Reload the page to try again."
          />
        ) : items.length === 0 ? (
          <EmptyState title="No activity yet" description="Updates will appear here as things happen across your school." />
        ) : (
          items.map((a) => {
            const m = meta(a.type);
            const Icon = m.icon;
            const body = (
              <>
                <div className={cn("flex size-9 shrink-0 items-center justify-center rounded-md", iconTone[m.tone])}>
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text">{a.title}</p>
                  <span className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
                    <Clock className="size-2.5" />
                    {relativeTime(a.createdAt)}
                    {a.body ? ` · ${a.body}` : ""}
                  </span>
                </div>
                <Badge variant={m.tone === "info" ? "info" : m.tone} className="shrink-0 capitalize">
                  {m.label}
                </Badge>
                {!a.read && <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-label="unread" />}
              </>
            );
            const rowClass =
              "flex w-full items-center gap-3 border-b border-border px-5 py-3 text-left last:border-0";
            return a.link ? (
              <button
                key={a.id}
                onClick={() => router.push(a.link)}
                className={cn("focus-ring transition-colors hover:bg-surface-hover", rowClass)}
              >
                {body}
              </button>
            ) : (
              <div key={a.id} className={rowClass}>
                {body}
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}

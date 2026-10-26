"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Badge, Card, CardContent } from "@/components/ui";
import { useAuthStore } from "@/store";
import { PERMISSION_MODULES } from "@/lib/permissions";

/**
 * Dashboard for a custom role. It never calls the office-gated aggregates (which
 * would 403); it simply surfaces the sections this role can open, so a custom user
 * lands somewhere useful instead of an errored admin dashboard.
 */
export function CustomRoleDashboard() {
  const permissions = useAuthStore((s) => s.user?.permissions) ?? {};
  const granted = PERMISSION_MODULES.map((m) => ({ ...m, level: permissions[m.key] })).filter(
    (m) => m.level === "view" || m.level === "edit"
  );

  if (granted.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted">
            No sections have been assigned to your role yet. Please contact your administrator.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {granted.map((m) => (
        <Link key={m.key} href={m.hrefs[0] ?? "/dashboard"} className="focus-ring group rounded-lg">
          <Card className="h-full transition-colors hover:border-border-strong">
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="truncate font-medium text-text">{m.label}</p>
                <Badge variant={m.level === "edit" ? "success" : "info"} className="mt-1">
                  {m.level === "edit" ? "View + Edit" : "View only"}
                </Badge>
              </div>
              <ArrowRight className="size-4 shrink-0 text-subtle transition-transform group-hover:translate-x-0.5" />
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

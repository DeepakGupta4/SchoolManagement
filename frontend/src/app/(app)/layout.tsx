"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { useAuthStore, useEntitlementsStore } from "@/store";
import { isPathAllowed, isPathInTier } from "@/lib/navigation";

/**
 * Single shell for every authenticated route.
 *
 * This lives in a route group so it wraps all of them without adding a URL
 * segment. Crucially it means the sidebar mounts ONCE for the whole session:
 * navigating between sections no longer unmounts and rebuilds it, so its
 * scroll position, expanded groups and filter text all survive.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const role = useAuthStore((s) => s.user?.role);
  const permissions = useAuthStore((s) => s.user?.permissions);
  const tierModules = useEntitlementsStore((s) => s.tierModules);
  const router = useRouter();
  const pathname = usePathname();

  // Only redirect once the session has actually resolved — bouncing during
  // `loading` would throw a signed-in user out on every page refresh.
  useEffect(() => {
    if (status === "guest") router.replace("/login");
  }, [status, router]);

  // Role guard: a teacher who lands on an admin-only route (by typing the URL
  // or an old link) is sent back to their dashboard. Non-teachers are
  // unrestricted, so this is a no-op for them. A route the role CAN open but the
  // school's plan does NOT include is steered to the upgrade page instead, so the
  // user is told how to unlock it rather than silently bounced.
  useEffect(() => {
    if (status !== "authenticated") return;
    if (!isPathAllowed(role, pathname, permissions)) {
      router.replace("/dashboard");
    } else if (!isPathInTier(pathname, tierModules)) {
      router.replace("/subscription");
    }
  }, [status, role, permissions, tierModules, pathname, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="size-6 animate-spin rounded-full border-2 border-border border-t-primary" />
          <p className="text-sm text-muted">Restoring your session…</p>
        </div>
      </div>
    );
  }

  if (status === "guest") return null;

  return <AppShell>{children}</AppShell>;
}

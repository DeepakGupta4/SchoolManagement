"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { useAuthStore } from "@/store";
import { isPathAllowed } from "@/lib/navigation";

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
  const router = useRouter();
  const pathname = usePathname();

  // Only redirect once the session has actually resolved — bouncing during
  // `loading` would throw a signed-in user out on every page refresh.
  useEffect(() => {
    if (status === "guest") router.replace("/login");
  }, [status, router]);

  // Role guard: a teacher who lands on an admin-only route (by typing the URL
  // or an old link) is sent back to their dashboard. Non-teachers are
  // unrestricted, so this is a no-op for them.
  useEffect(() => {
    if (status === "authenticated" && !isPathAllowed(role, pathname)) {
      router.replace("/dashboard");
    }
  }, [status, role, pathname, router]);

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

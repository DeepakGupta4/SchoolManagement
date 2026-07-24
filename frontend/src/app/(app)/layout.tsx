"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { useAuthStore } from "@/store";

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
  const router = useRouter();

  // Only redirect once the session has actually resolved — bouncing during
  // `loading` would throw a signed-in user out on every page refresh.
  useEffect(() => {
    if (status === "guest") router.replace("/login");
  }, [status, router]);

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

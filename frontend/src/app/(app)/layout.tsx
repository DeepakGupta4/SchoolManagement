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
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const router = useRouter();

  // Client-side guard only. It stops a signed-out user from sitting on a
  // half-rendered dashboard, but it is NOT security — anyone can reach the
  // page source. Real protection needs server-side session checks.
  useEffect(() => {
    if (!isAuthenticated) router.replace("/login");
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return <AppShell>{children}</AppShell>;
}

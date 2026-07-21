"use client";

import React from "react";
import { AppShell } from "@/components/layout/AppShell";

/**
 * Single shell for every authenticated route.
 *
 * This lives in a route group so it wraps all of them without adding a URL
 * segment. Crucially it means the sidebar mounts ONCE for the whole session:
 * navigating between sections no longer unmounts and rebuilds it, so its
 * scroll position, expanded groups and filter text all survive.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

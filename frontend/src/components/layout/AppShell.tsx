"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useSidebarStore } from "@/store";

/**
 * The authenticated app chrome: sidebar + topbar + content well.
 *
 * Every route layout renders this, so shell changes happen in one place.
 * Below `lg` the sidebar becomes an overlay drawer and the content well
 * takes the full width, so the rail offset is applied via a CSS variable
 * that only the desktop breakpoint consumes.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebarStore();

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <Topbar />
      <main
        className="min-h-screen pt-16 lg:ml-[var(--rail)]"
        style={{
          ["--rail" as string]: isCollapsed ? "72px" : "260px",
          transition: "margin-left 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div className="px-4 pb-12 pt-6 sm:px-7 sm:pt-7">{children}</div>
      </main>
    </div>
  );
}

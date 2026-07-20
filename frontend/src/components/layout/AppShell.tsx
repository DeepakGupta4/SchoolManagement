"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useSidebarStore } from "@/store";

/**
 * The authenticated app chrome: sidebar + topbar + content well.
 *
 * Every route layout renders this, so shell changes happen in one place.
 * (The sidebar offset is dynamic, so it stays an inline style.)
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebarStore();

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar />
      <Topbar />
      <main
        className="min-h-screen pt-16"
        style={{
          marginLeft: isCollapsed ? "64px" : "260px",
          transition: "margin-left 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <div className="px-7 pb-12 pt-7">{children}</div>
      </main>
    </div>
  );
}

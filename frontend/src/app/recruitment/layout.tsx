"use client";
import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useSidebarStore } from "@/store";

export default function RecruitmentLayout({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebarStore();
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <Sidebar />
      <Topbar />
      <main style={{
        marginLeft: isCollapsed ? "64px" : "260px",
        paddingTop: "64px",
        minHeight: "100vh",
        transition: "margin-left 0.3s cubic-bezier(0.4,0,0.2,1)",
      }}>
        <div style={{ padding: "28px 28px 48px 28px" }}>{children}</div>
      </main>
    </div>
  );
}

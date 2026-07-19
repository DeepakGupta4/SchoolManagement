"use client";
import React from "react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { AttendanceChart, FeeCollectionChart } from "@/components/dashboard/Charts";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { UpcomingEvents } from "@/components/dashboard/UpcomingEvents";
import { useAuthStore } from "@/store";
import { GraduationCap, Users, BookOpen, Bus, AlertCircle, CheckCircle } from "lucide-react";

const stats = [
  { title: "Total Students",   value: "1,240", change: 4.2,   iconName: "GraduationCap", color: "indigo"  as const },
  { title: "Total Teachers",   value: "86",    change: 2.1,   iconName: "Users",         color: "emerald" as const },
  { title: "Fee Collected",    value: "₹5.3L", change: 8.5,   iconName: "DollarSign",    color: "amber"   as const },
  { title: "Attendance Today", value: "94.2",  change: -1.3,  iconName: "UserCheck",     color: "violet"  as const, suffix: "%" },
  { title: "Pending Fees",     value: "₹1.1L", change: -12.4, iconName: "AlertCircle",   color: "rose"    as const },
  { title: "Active Buses",     value: "12",    change: 0,     iconName: "Bus",           color: "cyan"    as const },
];

const quickStats = [
  { label: "New Admissions",       value: 24, icon: GraduationCap, bg: "#eff6ff", color: "#2563eb" },
  { label: "Leave Requests",       value: 7,  icon: Users,         bg: "#fffbeb", color: "#d97706" },
  { label: "Books Issued",         value: 38, icon: BookOpen,      bg: "#f0fdf4", color: "#16a34a" },
  { label: "Bus Routes Active",    value: 12, icon: Bus,           bg: "#ecfeff", color: "#0891b2" },
  { label: "Fee Defaulters",       value: 42, icon: AlertCircle,   bg: "#fff1f2", color: "#e11d48" },
  { label: "Tasks Completed",      value: 18, icon: CheckCircle,   bg: "#f5f3ff", color: "#7c3aed" },
];

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div style={{ maxWidth: "1600px", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>
            {getGreeting()}, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>{today} &nbsp;·&nbsp; Springdale School</p>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: "8px",
          background: "#f0fdf4", border: "1px solid #bbf7d0",
          color: "#16a34a", fontSize: "12px", fontWeight: 600,
          padding: "7px 14px", borderRadius: "20px",
        }}>
          <span style={{ width: "7px", height: "7px", background: "#22c55e", borderRadius: "50%", animation: "pulse 2s infinite" }} />
          School is Open
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "16px" }}>
        {stats.map((s) => <StatsCard key={s.title} {...s} />)}
      </div>

      {/* ── Quick Snapshot Bar ── */}
      <div style={{
        background: "#fff", borderRadius: "16px",
        border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        padding: "18px 24px",
      }}>
        <p style={{ fontSize: "10px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "14px" }}>
          Today&apos;s Snapshot
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "16px" }}>
          {quickStats.map((q) => (
            <div key={q.label} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "38px", height: "38px", borderRadius: "10px",
                background: q.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <q.icon size={16} color={q.color} />
              </div>
              <div>
                <p style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>{q.value}</p>
                <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "3px", lineHeight: 1.2 }}>{q.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Charts ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <AttendanceChart />
        <FeeCollectionChart />
      </div>

      {/* ── Activity + Events ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <RecentActivity />
        <UpcomingEvents />
      </div>

    </div>
  );
}

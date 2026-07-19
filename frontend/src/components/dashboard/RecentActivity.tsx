"use client";
import React from "react";
import { Clock, UserPlus, DollarSign, CheckSquare, AlertTriangle, Bus, BookOpen } from "lucide-react";

const activities = [
  { id: 1, type: "admission",  text: "New admission: Aryan Sharma (Class 9-A)",  time: "2 min ago",  status: "success", icon: UserPlus },
  { id: 2, type: "fee",        text: "Fee paid: Priya Patel — ₹12,500",           time: "15 min ago", status: "success", icon: DollarSign },
  { id: 3, type: "attendance", text: "Attendance marked for Class 10-B",           time: "32 min ago", status: "info",    icon: CheckSquare },
  { id: 4, type: "leave",      text: "Leave request: Rahul Verma (Teacher)",       time: "1 hr ago",   status: "warning", icon: AlertTriangle },
  { id: 5, type: "fee",        text: "Fee overdue: 23 students — Class 8",         time: "2 hr ago",   status: "danger",  icon: AlertTriangle },
  { id: 6, type: "exam",       text: "Result published: Mid-Term Class 12",        time: "3 hr ago",   status: "info",    icon: BookOpen },
  { id: 7, type: "transport",  text: "Bus Route 3 — delayed by 10 mins",           time: "4 hr ago",   status: "warning", icon: Bus },
];

const statusStyles: Record<string, { bg: string; color: string; dot: string }> = {
  success: { bg: "#f0fdf4", color: "#16a34a", dot: "#22c55e" },
  info:    { bg: "#eff6ff", color: "#2563eb", dot: "#3b82f6" },
  warning: { bg: "#fffbeb", color: "#d97706", dot: "#f59e0b" },
  danger:  { bg: "#fff1f2", color: "#e11d48", dot: "#f43f5e" },
};

export function RecentActivity() {
  return (
    <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px 14px", borderBottom: "1px solid #f8fafc" }}>
        <div>
          <p style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>Recent Activity</p>
          <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>Latest updates across school</p>
        </div>
        <button style={{ fontSize: "12px", color: "#6366f1", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
          View all
        </button>
      </div>

      {/* List */}
      <div>
        {activities.map((a, i) => {
          const s = statusStyles[a.status];
          const Icon = a.icon;
          return (
            <div
              key={a.id}
              style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "12px 20px",
                borderBottom: i < activities.length - 1 ? "1px solid #f8fafc" : "none",
                transition: "background 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "#fafafa"}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
            >
              {/* Icon */}
              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={15} color={s.color} />
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "13px", color: "#334155", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {a.text}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "3px" }}>
                  <Clock size={10} color="#94a3b8" />
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>{a.time}</span>
                </div>
              </div>

              {/* Badge */}
              <span style={{
                fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "20px",
                background: s.bg, color: s.color, textTransform: "capitalize", flexShrink: 0,
              }}>
                {a.type}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

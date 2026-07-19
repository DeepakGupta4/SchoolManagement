"use client";
import React from "react";
import { Clock, Trophy, Users, BookOpen, Calendar } from "lucide-react";

const events = [
  { id: 1, title: "Annual Sports Day",          date: "Jul 22", time: "9:00 AM",  type: "event",   icon: Trophy },
  { id: 2, title: "Parent-Teacher Meeting",      date: "Jul 24", time: "10:00 AM", type: "meeting", icon: Users },
  { id: 3, title: "Mid-Term Exams Begin",        date: "Jul 28", time: "8:30 AM",  type: "exam",    icon: BookOpen },
  { id: 4, title: "Independence Day Celebration",date: "Aug 15", time: "8:00 AM",  type: "event",   icon: Trophy },
  { id: 5, title: "Science Exhibition",          date: "Aug 20", time: "11:00 AM", type: "event",   icon: Calendar },
];

const typeStyles: Record<string, { bg: string; color: string; label: string }> = {
  event:   { bg: "#eff6ff", color: "#2563eb", label: "Event" },
  meeting: { bg: "#fffbeb", color: "#d97706", label: "Meeting" },
  exam:    { bg: "#fff1f2", color: "#e11d48", label: "Exam" },
};

const monthColors = ["#6366f1", "#8b5cf6", "#e11d48", "#d97706", "#059669"];

export function UpcomingEvents() {
  return (
    <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px 14px", borderBottom: "1px solid #f8fafc" }}>
        <div>
          <p style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>Upcoming Events</p>
          <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>Next scheduled activities</p>
        </div>
        <button style={{ fontSize: "12px", color: "#6366f1", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>
          View calendar
        </button>
      </div>

      {/* List */}
      <div>
        {events.map((e, i) => {
          const s = typeStyles[e.type] ?? typeStyles.event;
          const Icon = e.icon;
          const [month, day] = e.date.split(" ");
          return (
            <div
              key={e.id}
              style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "12px 20px",
                borderBottom: i < events.length - 1 ? "1px solid #f8fafc" : "none",
                transition: "background 0.15s",
              }}
              onMouseEnter={ev => (ev.currentTarget as HTMLDivElement).style.background = "#fafafa"}
              onMouseLeave={ev => (ev.currentTarget as HTMLDivElement).style.background = "transparent"}
            >
              {/* Date box */}
              <div style={{
                width: "40px", height: "44px", borderRadius: "10px",
                background: monthColors[i % monthColors.length],
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                flexShrink: 0, boxShadow: `0 3px 8px ${monthColors[i % monthColors.length]}40`,
              }}>
                <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.8)", fontWeight: 600, textTransform: "uppercase", lineHeight: 1 }}>{month}</span>
                <span style={{ fontSize: "16px", color: "#fff", fontWeight: 800, lineHeight: 1.2 }}>{day}</span>
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: "13px", color: "#334155", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {e.title}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "3px" }}>
                  <Clock size={10} color="#94a3b8" />
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>{e.time}</span>
                </div>
              </div>

              {/* Type badge */}
              <span style={{
                fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "20px",
                background: s.bg, color: s.color, flexShrink: 0,
              }}>
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

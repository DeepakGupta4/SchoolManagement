"use client";
import React from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from "recharts";

const attendanceData = [
  { day: "Mon", present: 1180, absent: 60 },
  { day: "Tue", present: 1200, absent: 40 },
  { day: "Wed", present: 1150, absent: 90 },
  { day: "Thu", present: 1210, absent: 30 },
  { day: "Fri", present: 1100, absent: 140 },
  { day: "Sat", present: 980,  absent: 60 },
];

const feeData = [
  { month: "Apr", collected: 420000, pending: 80000 },
  { month: "May", collected: 380000, pending: 120000 },
  { month: "Jun", collected: 450000, pending: 50000 },
  { month: "Jul", collected: 510000, pending: 90000 },
  { month: "Aug", collected: 490000, pending: 110000 },
  { month: "Sep", collected: 530000, pending: 70000 },
];

const card: React.CSSProperties = {
  background: "#fff",
  borderRadius: "16px",
  border: "1px solid #f1f5f9",
  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  overflow: "hidden",
};

const cardHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "18px 20px 14px",
  borderBottom: "1px solid #f8fafc",
};

const tooltipStyle: React.CSSProperties = {
  borderRadius: "10px",
  border: "1px solid #f1f5f9",
  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
  fontSize: "12px",
  background: "#fff",
};

export function AttendanceChart() {
  return (
    <div style={card}>
      <div style={cardHeader}>
        <div>
          <p style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>Weekly Attendance</p>
          <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>Present vs Absent — this week</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {[{ color: "#6366f1", label: "Present" }, { color: "#fca5a5", label: "Absent" }].map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#64748b" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "3px", background: l.color, display: "inline-block" }} />
              {l.label}
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: "16px 20px 20px" }}>
        <ResponsiveContainer width="100%" height={210}>
          <BarChart data={attendanceData} barSize={20} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f8fafc", radius: 6 }} />
            <Bar dataKey="present" fill="#6366f1" radius={[6, 6, 0, 0]} name="Present" />
            <Bar dataKey="absent"  fill="#fca5a5" radius={[6, 6, 0, 0]} name="Absent" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function FeeCollectionChart() {
  return (
    <div style={card}>
      <div style={cardHeader}>
        <div>
          <p style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>Fee Collection</p>
          <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>Monthly collection trend</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {[{ color: "#6366f1", label: "Collected" }, { color: "#f59e0b", label: "Pending", dashed: true }].map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#64748b" }}>
              <span style={{ width: "10px", height: "10px", borderRadius: "3px", background: l.color, display: "inline-block" }} />
              {l.label}
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: "16px 20px 20px" }}>
        <ResponsiveContainer width="100%" height={210}>
          <AreaChart data={feeData}>
            <defs>
              <linearGradient id="gradCollected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradPending" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.1} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString("en-IN")}`, ""]} contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="collected" stroke="#6366f1" strokeWidth={2.5} fill="url(#gradCollected)" name="Collected" dot={false} />
            <Area type="monotone" dataKey="pending"   stroke="#f59e0b" strokeWidth={2}   fill="url(#gradPending)"   name="Pending"   strokeDasharray="5 4" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

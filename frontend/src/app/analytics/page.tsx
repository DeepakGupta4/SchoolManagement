"use client";
import React, { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, Users, DollarSign, GraduationCap, Bus } from "lucide-react";

const monthlyAdmissions = [
  { month: "Apr", admissions: 45, withdrawals: 5 },
  { month: "May", admissions: 62, withdrawals: 8 },
  { month: "Jun", admissions: 38, withdrawals: 3 },
  { month: "Jul", admissions: 80, withdrawals: 6 },
  { month: "Aug", admissions: 95, withdrawals: 10 },
  { month: "Sep", admissions: 55, withdrawals: 4 },
  { month: "Oct", admissions: 40, withdrawals: 7 },
  { month: "Nov", admissions: 30, withdrawals: 2 },
];

const feeMonthly = [
  { month: "Apr", collected: 420000, target: 500000 },
  { month: "May", collected: 380000, target: 500000 },
  { month: "Jun", collected: 450000, target: 500000 },
  { month: "Jul", collected: 510000, target: 500000 },
  { month: "Aug", collected: 490000, target: 500000 },
  { month: "Sep", collected: 530000, target: 500000 },
];

const classStrength = [
  { class: "6th", students: 180 },
  { class: "7th", students: 165 },
  { class: "8th", students: 172 },
  { class: "9th", students: 190 },
  { class: "10th", students: 185 },
  { class: "11th", students: 148 },
  { class: "12th", students: 140 },
];

const genderData = [
  { name: "Boys", value: 680, color: "#6366f1" },
  { name: "Girls", value: 560, color: "#f43f5e" },
];

const feeStatusData = [
  { name: "Paid", value: 1050, color: "#10b981" },
  { name: "Pending", value: 130, color: "#f59e0b" },
  { name: "Overdue", value: 60, color: "#ef4444" },
];

const topMetrics = [
  { label: "Total Revenue (YTD)", value: "₹62.4L", change: 12.5, positive: true, icon: DollarSign, color: "#6366f1", bg: "#eff6ff" },
  { label: "New Admissions (YTD)", value: "445", change: 8.2, positive: true, icon: GraduationCap, color: "#10b981", bg: "#f0fdf4" },
  { label: "Avg Attendance", value: "91.4%", change: -1.2, positive: false, icon: Users, color: "#f59e0b", bg: "#fffbeb" },
  { label: "Transport Usage", value: "68%", change: 3.4, positive: true, icon: Bus, color: "#8b5cf6", bg: "#f5f3ff" },
];

const tooltipStyle = {
  borderRadius: "10px", border: "1px solid #f1f5f9",
  boxShadow: "0 8px 24px rgba(0,0,0,0.08)", fontSize: "12px", background: "#fff",
};

const card = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: "#fff", borderRadius: "16px",
  border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  overflow: "hidden", ...extra,
});

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");

  return (
    <div style={{ maxWidth: "1600px", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>Analytics</h1>
          <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>School performance overview & insights</p>
        </div>
        <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "12px", padding: "4px", gap: "2px" }}>
          {(["week", "month", "year"] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: "6px 16px", borderRadius: "9px", border: "none", cursor: "pointer",
              fontSize: "12px", fontWeight: 600, transition: "all 0.15s",
              background: period === p ? "#fff" : "transparent",
              color: period === p ? "#0f172a" : "#64748b",
              boxShadow: period === p ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Top Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
        {topMetrics.map(m => (
          <div key={m.label} style={card({ padding: "20px" })}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: m.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <m.icon size={18} color={m.color} />
              </div>
              <div style={{
                display: "flex", alignItems: "center", gap: "3px",
                fontSize: "11px", fontWeight: 600, padding: "3px 8px", borderRadius: "20px",
                background: m.positive ? "#f0fdf4" : "#fff1f2",
                color: m.positive ? "#16a34a" : "#e11d48",
              }}>
                {m.positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                {m.change}%
              </div>
            </div>
            <p style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>{m.value}</p>
            <p style={{ fontSize: "12px", color: "#64748b", marginTop: "4px", fontWeight: 500 }}>{m.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>

        {/* Admissions Trend */}
        <div style={card()}>
          <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>Admissions Trend</p>
              <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>Monthly admissions vs withdrawals</p>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              {[{ color: "#6366f1", label: "Admissions" }, { color: "#fca5a5", label: "Withdrawals" }].map(l => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#64748b" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "3px", background: l.color, display: "inline-block" }} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: "16px 20px 20px" }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyAdmissions} barSize={18} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f8fafc" }} />
                <Bar dataKey="admissions" fill="#6366f1" radius={[6, 6, 0, 0]} name="Admissions" />
                <Bar dataKey="withdrawals" fill="#fca5a5" radius={[6, 6, 0, 0]} name="Withdrawals" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gender Distribution */}
        <div style={card()}>
          <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #f8fafc" }}>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>Gender Distribution</p>
            <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>Total 1,240 students</p>
          </div>
          <div style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={genderData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                  {genderData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", gap: "20px", marginTop: "4px" }}>
              {genderData.map(g => (
                <div key={g.name} style={{ textAlign: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "center" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: g.color, display: "inline-block" }} />
                    <span style={{ fontSize: "12px", color: "#64748b" }}>{g.name}</span>
                  </div>
                  <p style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", marginTop: "2px" }}>{g.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>

        {/* Fee Collection vs Target */}
        <div style={card()}>
          <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>Fee Collection vs Target</p>
              <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>Monthly performance</p>
            </div>
          </div>
          <div style={{ padding: "16px 20px 20px" }}>
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={feeMonthly}>
                <defs>
                  <linearGradient id="gcollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={v => [`₹${Number(v).toLocaleString("en-IN")}`, ""]} contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="collected" stroke="#6366f1" strokeWidth={2.5} fill="url(#gcollected)" name="Collected" dot={false} />
                <Area type="monotone" dataKey="target" stroke="#e2e8f0" strokeWidth={2} fill="none" name="Target" strokeDasharray="5 4" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Class Strength */}
        <div style={card()}>
          <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #f8fafc" }}>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>Class-wise Strength</p>
            <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>Students per class</p>
          </div>
          <div style={{ padding: "16px 20px 20px" }}>
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={classStrength} barSize={28} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="class" type="category" tick={{ fontSize: 12, fill: "#64748b" }} axisLine={false} tickLine={false} width={36} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f8fafc" }} />
                <Bar dataKey="students" fill="#6366f1" radius={[0, 6, 6, 0]} name="Students" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Fee Status Breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "16px" }}>
        <div style={card()}>
          <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #f8fafc" }}>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>Fee Status</p>
            <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>Current session</p>
          </div>
          <div style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={feeStatusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {feeStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "8px" }}>
              {feeStatusData.map(f => (
                <div key={f.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "10px", height: "10px", borderRadius: "3px", background: f.color, display: "inline-block" }} />
                    <span style={{ fontSize: "13px", color: "#64748b" }}>{f.name}</span>
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Table */}
        <div style={card()}>
          <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #f8fafc" }}>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>Key Performance Indicators</p>
            <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>Current academic year summary</p>
          </div>
          <div style={{ padding: "8px 0" }}>
            {[
              { label: "Total Enrolled Students", value: "1,240", target: "1,300", pct: 95 },
              { label: "Fee Collection Rate", value: "84.7%", target: "95%", pct: 85 },
              { label: "Average Attendance", value: "91.4%", target: "95%", pct: 91 },
              { label: "Teacher-Student Ratio", value: "1:14", target: "1:12", pct: 78 },
              { label: "Pass Percentage (Last Exam)", value: "96.2%", target: "98%", pct: 96 },
            ].map((row, i) => (
              <div key={i} style={{ padding: "12px 20px", borderBottom: i < 4 ? "1px solid #f8fafc" : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "13px", color: "#334155", fontWeight: 500 }}>{row.label}</span>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{row.value}</span>
                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>Target: {row.target}</span>
                  </div>
                </div>
                <div style={{ height: "5px", background: "#f1f5f9", borderRadius: "99px", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: "99px",
                    width: `${row.pct}%`,
                    background: row.pct >= 90 ? "#10b981" : row.pct >= 75 ? "#f59e0b" : "#ef4444",
                    transition: "width 0.6s ease",
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}

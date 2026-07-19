"use client";
import React, { useState } from "react";
import { Search, Download, Star, TrendingUp, Award, Target, Users, ChevronUp, ChevronDown, Minus } from "lucide-react";

const staffPerformance = [
  { id: "ST001", name: "Mr. Rajesh Sharma",  role: "Principal",         dept: "Administration", q1: 92, q2: 94, q3: 96, rating: 4.8, trend: "up",   grade: "A+" },
  { id: "ST002", name: "Ms. Sunita Verma",   role: "Vice Principal",    dept: "Administration", q1: 88, q2: 90, q3: 91, rating: 4.6, trend: "up",   grade: "A"  },
  { id: "ST003", name: "Mr. Anil Kumar",     role: "Accountant",        dept: "Finance",        q1: 80, q2: 78, q3: 82, rating: 4.1, trend: "up",   grade: "B+" },
  { id: "ST004", name: "Ms. Pooja Mehta",    role: "HR Manager",        dept: "HR",             q1: 85, q2: 87, q3: 86, rating: 4.3, trend: "same", grade: "A"  },
  { id: "ST005", name: "Mr. Suresh Nair",    role: "IT Administrator",  dept: "IT",             q1: 90, q2: 88, q3: 85, rating: 4.4, trend: "down", grade: "A"  },
  { id: "ST006", name: "Ms. Kavita Joshi",   role: "Librarian",         dept: "Library",        q1: 75, q2: 76, q3: 78, rating: 3.9, trend: "up",   grade: "B"  },
  { id: "ST007", name: "Mr. Deepak Singh",   role: "Security Head",     dept: "Security",       q1: 82, q2: 80, q3: 79, rating: 4.0, trend: "down", grade: "B+" },
  { id: "ST008", name: "Mr. Vinod Tiwari",   role: "Canteen Manager",   dept: "Canteen",        q1: 70, q2: 72, q3: 74, rating: 3.7, trend: "up",   grade: "B"  },
];

const teacherPerformance = [
  { id: "T001", name: "Dr. Priya Sharma",   subject: "Mathematics",      classes: "10,11,12", q1: 95, q2: 96, q3: 97, rating: 4.9, trend: "up",   grade: "A+" },
  { id: "T002", name: "Mr. Rahul Verma",    subject: "Physics",          classes: "11,12",    q1: 88, q2: 90, q3: 92, rating: 4.6, trend: "up",   grade: "A"  },
  { id: "T003", name: "Ms. Anita Patel",    subject: "English",          classes: "6,7,8",    q1: 85, q2: 84, q3: 86, rating: 4.3, trend: "up",   grade: "A"  },
  { id: "T004", name: "Mr. Suresh Kumar",   subject: "History",          classes: "9,10",     q1: 78, q2: 76, q3: 75, rating: 3.8, trend: "down", grade: "B"  },
  { id: "T005", name: "Ms. Kavita Singh",   subject: "Chemistry",        classes: "11,12",    q1: 91, q2: 91, q3: 93, rating: 4.7, trend: "same", grade: "A+" },
  { id: "T006", name: "Mr. Amit Joshi",     subject: "Computer Science", classes: "8,9,10",   q1: 94, q2: 95, q3: 96, rating: 4.9, trend: "up",   grade: "A+" },
  { id: "T007", name: "Ms. Deepa Nair",     subject: "Biology",          classes: "11,12",    q1: 83, q2: 85, q3: 84, rating: 4.2, trend: "same", grade: "A"  },
  { id: "T008", name: "Mr. Vikram Gupta",   subject: "Phy. Education",   classes: "6-12",     q1: 80, q2: 82, q3: 83, rating: 4.1, trend: "up",   grade: "B+" },
];

const gradeColor: Record<string, { bg: string; color: string }> = {
  "A+": { bg: "#f0fdf4", color: "#16a34a" },
  "A":  { bg: "#eff6ff", color: "#2563eb" },
  "B+": { bg: "#fffbeb", color: "#d97706" },
  "B":  { bg: "#fff7ed", color: "#ea580c" },
  "C":  { bg: "#fff1f2", color: "#e11d48" },
};

const deptColors: Record<string, { bg: string; color: string }> = {
  Administration: { bg: "#eff6ff", color: "#2563eb" },
  Finance:        { bg: "#f0fdf4", color: "#16a34a" },
  HR:             { bg: "#fdf4ff", color: "#9333ea" },
  IT:             { bg: "#ecfeff", color: "#0891b2" },
  Library:        { bg: "#fffbeb", color: "#d97706" },
  Security:       { bg: "#fff1f2", color: "#e11d48" },
  Canteen:        { bg: "#fff7ed", color: "#ea580c" },
};

const subjectColors: Record<string, { bg: string; color: string }> = {
  Mathematics:        { bg: "#eff6ff", color: "#2563eb" },
  Physics:            { bg: "#f5f3ff", color: "#7c3aed" },
  English:            { bg: "#f0fdf4", color: "#16a34a" },
  History:            { bg: "#fffbeb", color: "#d97706" },
  Chemistry:          { bg: "#fdf4ff", color: "#9333ea" },
  "Computer Science": { bg: "#ecfeff", color: "#0891b2" },
  Biology:            { bg: "#f0fdf4", color: "#059669" },
  "Phy. Education":   { bg: "#fff1f2", color: "#e11d48" },
};

const tabs = ["Staff", "Teachers"] as const;

function TrendIcon({ trend }: { trend: string }) {
  if (trend === "up")   return <ChevronUp size={14} color="#16a34a" />;
  if (trend === "down") return <ChevronDown size={14} color="#e11d48" />;
  return <Minus size={14} color="#94a3b8" />;
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 90 ? "#16a34a" : score >= 80 ? "#2563eb" : score >= 70 ? "#d97706" : "#e11d48";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div style={{ width: "80px", height: "6px", background: "#f1f5f9", borderRadius: "99px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${score}%`, background: color, borderRadius: "99px" }} />
      </div>
      <span style={{ fontSize: "12px", fontWeight: 700, color }}>{score}</span>
    </div>
  );
}

export default function PerformancePage() {
  const [tab, setTab]     = useState<typeof tabs[number]>("Staff");
  const [search, setSearch] = useState("");
  const [gradeFilter, setGradeFilter] = useState("All");

  const data = tab === "Staff" ? staffPerformance : teacherPerformance;

  const filtered = data.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                        p.id.toLowerCase().includes(search.toLowerCase());
    const matchGrade  = gradeFilter === "All" || p.grade === gradeFilter;
    return matchSearch && matchGrade;
  });

  const avgScore  = Math.round(data.reduce((s, p) => s + p.q3, 0) / data.length);
  const topPerf   = data.filter(p => p.grade === "A+" || p.grade === "A").length;
  const improving = data.filter(p => p.trend === "up").length;
  const avgRating = (data.reduce((s, p) => s + p.rating, 0) / data.length).toFixed(1);

  return (
    <div style={{ maxWidth: "1600px", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>Performance</h1>
          <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>Track and evaluate staff & teacher performance</p>
        </div>
        <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#fff", fontSize: "13px", fontWeight: 600, color: "#334155", cursor: "pointer" }}>
          <Download size={14} /> Export Report
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }}>
        {[
          { label: "Avg Score",      value: `${avgScore}%`, icon: <Target size={22} />,    color: "#6366f1", bg: "#eff6ff" },
          { label: "Top Performers", value: topPerf,        icon: <Award size={22} />,     color: "#16a34a", bg: "#f0fdf4" },
          { label: "Improving",      value: improving,      icon: <TrendingUp size={22} />,color: "#0891b2", bg: "#ecfeff" },
          { label: "Avg Rating",     value: avgRating,      icon: <Star size={22} />,      color: "#d97706", bg: "#fffbeb" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", color: s.color, flexShrink: 0 }}>{s.icon}</div>
            <div>
              <p style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>{s.label}</p>
              <p style={{ fontSize: "28px", fontWeight: 800, color: s.color, lineHeight: 1.1, letterSpacing: "-0.5px" }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>

        {/* Toolbar */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f8fafc", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", background: "#f8fafc", borderRadius: "12px", padding: "4px", gap: "2px" }}>
            {tabs.map(t => (
              <button key={t} onClick={() => { setTab(t); setSearch(""); setGradeFilter("All"); }} style={{
                padding: "7px 18px", borderRadius: "9px", border: "none", cursor: "pointer",
                fontSize: "12px", fontWeight: 600, transition: "all 0.15s",
                background: tab === t ? "#fff" : "transparent",
                color: tab === t ? "#0f172a" : "#64748b",
                boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}>{t}</button>
            ))}
          </div>

          <div style={{ position: "relative", flex: 1, maxWidth: "280px" }}>
            <Search size={14} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or ID..."
              style={{ width: "100%", paddingLeft: "36px", paddingRight: "16px", paddingTop: "9px", paddingBottom: "9px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", fontFamily: "inherit" }}
              onFocus={e => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
              onBlur={e  => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          <select value={gradeFilter} onChange={e => setGradeFilter(e.target.value)}
            style={{ padding: "9px 14px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", cursor: "pointer" }}>
            <option value="All">All Grades</option>
            {["A+", "A", "B+", "B", "C"].map(g => <option key={g}>{g}</option>)}
          </select>

          <p style={{ marginLeft: "auto", fontSize: "12px", color: "#94a3b8" }}>{filtered.length} records</p>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#fafafa", borderBottom: "1px solid #f1f5f9" }}>
                {["Name", tab === "Staff" ? "Department" : "Subject", "Q1 Score", "Q2 Score", "Q3 Score", "Rating", "Trend", "Grade"].map(h => (
                  <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => {
                const badge = tab === "Staff"
                  ? (deptColors[(p as typeof staffPerformance[0]).dept] ?? { bg: "#f8fafc", color: "#64748b" })
                  : (subjectColors[(p as typeof teacherPerformance[0]).subject] ?? { bg: "#f8fafc", color: "#64748b" });
                const gc = gradeColor[p.grade] ?? { bg: "#f8fafc", color: "#64748b" };
                const label = tab === "Staff"
                  ? (p as typeof staffPerformance[0]).dept
                  : (p as typeof teacherPerformance[0]).subject;

                return (
                  <tr key={p.id}
                    style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f8fafc" : "none", transition: "background 0.15s" }}
                    onMouseEnter={ev => (ev.currentTarget as HTMLTableRowElement).style.background = "#fafafa"}
                    onMouseLeave={ev => (ev.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                  >
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "38px", height: "38px", borderRadius: "12px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "14px", fontWeight: 700, flexShrink: 0 }}>
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{p.name}</p>
                          <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "1px" }}>
                            {tab === "Staff" ? (p as typeof staffPerformance[0]).role : `Class ${(p as typeof teacherPerformance[0]).classes}`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px", background: badge.bg, color: badge.color }}>{label}</span>
                    </td>
                    <td style={{ padding: "14px 20px" }}><ScoreBar score={p.q1} /></td>
                    <td style={{ padding: "14px 20px" }}><ScoreBar score={p.q2} /></td>
                    <td style={{ padding: "14px 20px" }}><ScoreBar score={p.q3} /></td>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Star size={13} color="#f59e0b" fill="#f59e0b" />
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{p.rating}</span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <TrendIcon trend={p.trend} />
                        <span style={{ fontSize: "12px", fontWeight: 600, color: p.trend === "up" ? "#16a34a" : p.trend === "down" ? "#e11d48" : "#94a3b8", textTransform: "capitalize" }}>{p.trend}</span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 800, padding: "5px 12px", borderRadius: "20px", background: gc.bg, color: gc.color }}>{p.grade}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px", color: "#94a3b8" }}>
              <Users size={40} color="#e2e8f0" style={{ margin: "0 auto 12px" }} />
              <p style={{ fontSize: "14px", fontWeight: 600 }}>No records found</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid #f8fafc", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: "12px", color: "#94a3b8" }}>
            Showing <strong style={{ color: "#334155" }}>{filtered.length}</strong> of <strong style={{ color: "#334155" }}>{data.length}</strong> records
          </p>
          <div style={{ display: "flex", gap: "16px" }}>
            {["A+", "A", "B+", "B"].map(g => {
              const gc = gradeColor[g];
              const count = filtered.filter(p => p.grade === g).length;
              return (
                <div key={g} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: gc.color, display: "inline-block" }} />
                  <span style={{ fontSize: "12px", color: "#64748b" }}>{g}: <strong style={{ color: "#0f172a" }}>{count}</strong></span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

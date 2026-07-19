"use client";
import React, { useState } from "react";
import { Trophy, Medal, Search, Download } from "lucide-react";

const meritData = [
  { id: "S002", name: "Priya Patel",   class: "10-A", roll: 2,  total: 565, pct: 94.2, grade: "A+", attendance: 98 },
  { id: "S006", name: "Ananya Joshi",  class: "10-A", roll: 6,  total: 545, pct: 90.8, grade: "A+", attendance: 96 },
  { id: "S001", name: "Aarav Sharma",  class: "10-A", roll: 1,  total: 524, pct: 87.3, grade: "A",  attendance: 94 },
  { id: "S004", name: "Sneha Gupta",   class: "10-A", roll: 4,  total: 477, pct: 79.5, grade: "B+", attendance: 88 },
  { id: "S007", name: "Vikram Nair",   class: "10-A", roll: 7,  total: 460, pct: 76.7, grade: "B+", attendance: 80 },
  { id: "S008", name: "Meera Iyer",    class: "10-A", roll: 8,  total: 448, pct: 74.7, grade: "B",  attendance: 91 },
  { id: "S009", name: "Arjun Reddy",   class: "10-A", roll: 9,  total: 430, pct: 71.7, grade: "B",  attendance: 87 },
  { id: "S003", name: "Rohan Verma",   class: "10-A", roll: 3,  total: 383, pct: 63.8, grade: "B",  attendance: 72 },
  { id: "S010", name: "Pooja Mishra",  class: "10-A", roll: 10, total: 340, pct: 56.7, grade: "C",  attendance: 60 },
  { id: "S005", name: "Karan Singh",   class: "10-A", roll: 5,  total: 292, pct: 48.7, grade: "F",  attendance: 65 },
];

const gradeStyle: Record<string, { bg: string; color: string }> = {
  "A+": { bg: "#f0fdf4", color: "#16a34a" },
  "A":  { bg: "#eff6ff", color: "#2563eb" },
  "B+": { bg: "#f5f3ff", color: "#7c3aed" },
  "B":  { bg: "#fffbeb", color: "#d97706" },
  "C":  { bg: "#fff7ed", color: "#ea580c" },
  "F":  { bg: "#fff1f2", color: "#e11d48" },
};

const classes = ["All", "6-A", "7-A", "8-A", "9-A", "10-A", "11-A", "12-A"];
const exams   = ["Mid-Term Exam", "Unit Test 1", "Final Exam"];

export default function MeritListPage() {
  const [search,   setSearch]   = useState("");
  const [selClass, setSelClass] = useState("10-A");
  const [selExam,  setSelExam]  = useState("Mid-Term Exam");

  const filtered = meritData.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const top3 = meritData.slice(0, 3);

  return (
    <div style={{ maxWidth: "1600px", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: "12px", color: "#6366f1", fontWeight: 600, marginBottom: "4px" }}>Examinations</p>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>Merit List</h1>
          <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>Top performing students ranked by score</p>
        </div>
        <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 18px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", fontSize: "13px", fontWeight: 600, color: "#fff", cursor: "pointer", boxShadow: "0 4px 12px rgba(99,102,241,0.35)" }}>
          <Download size={14} /> Download List
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }}>
        {[
          { label: "Total Students", value: meritData.length,                                    icon: "👨🎓", color: "#6366f1", bg: "#eff6ff" },
          { label: "Pass",           value: meritData.filter(s => s.grade !== "F").length,        icon: "✅",   color: "#16a34a", bg: "#f0fdf4" },
          { label: "Fail",           value: meritData.filter(s => s.grade === "F").length,        icon: "❌",   color: "#e11d48", bg: "#fff1f2" },
          { label: "Class Average",  value: `${(meritData.reduce((a,b) => a + b.pct, 0) / meritData.length).toFixed(1)}%`, icon: "📊", color: "#d97706", bg: "#fffbeb" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>{s.icon}</div>
            <div>
              <p style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>{s.label}</p>
              <p style={{ fontSize: "26px", fontWeight: 800, color: s.color, lineHeight: 1.1, letterSpacing: "-0.5px" }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Podium */}
      <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", padding: "32px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <p style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "28px", textAlign: "center" }}>🏆 Top Performers</p>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: "20px" }}>

          {/* 2nd Place */}
          <div style={{ textAlign: "center", flex: 1, maxWidth: "180px" }}>
            <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "linear-gradient(135deg,#94a3b8,#64748b)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", color: "#fff", fontSize: "22px", fontWeight: 800, boxShadow: "0 4px 14px rgba(100,116,139,0.35)" }}>
              {top3[1].name.charAt(0)}
            </div>
            <Medal size={20} color="#94a3b8" style={{ margin: "0 auto 6px" }} />
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{top3[1].name}</p>
            <p style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>{top3[1].pct}%</p>
            <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "1px" }}>{top3[1].total}/600</p>
            <div style={{ height: "70px", background: "linear-gradient(180deg,#e2e8f0,#f1f5f9)", borderRadius: "10px 10px 0 0", marginTop: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "24px", fontWeight: 800, color: "#94a3b8" }}>2</span>
            </div>
          </div>

          {/* 1st Place */}
          <div style={{ textAlign: "center", flex: 1, maxWidth: "200px" }}>
            <div style={{ fontSize: "28px", marginBottom: "4px" }}>👑</div>
            <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "linear-gradient(135deg,#f59e0b,#d97706)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", color: "#fff", fontSize: "26px", fontWeight: 800, boxShadow: "0 6px 20px rgba(245,158,11,0.45)" }}>
              {top3[0].name.charAt(0)}
            </div>
            <Trophy size={22} color="#f59e0b" style={{ margin: "0 auto 6px" }} />
            <p style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a" }}>{top3[0].name}</p>
            <p style={{ fontSize: "13px", color: "#d97706", fontWeight: 700, marginTop: "2px" }}>{top3[0].pct}%</p>
            <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "1px" }}>{top3[0].total}/600</p>
            <div style={{ height: "100px", background: "linear-gradient(180deg,#fef3c7,#fde68a)", borderRadius: "10px 10px 0 0", marginTop: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "32px", fontWeight: 800, color: "#d97706" }}>1</span>
            </div>
          </div>

          {/* 3rd Place */}
          <div style={{ textAlign: "center", flex: 1, maxWidth: "180px" }}>
            <div style={{ width: "54px", height: "54px", borderRadius: "50%", background: "linear-gradient(135deg,#ea580c,#c2410c)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", color: "#fff", fontSize: "20px", fontWeight: 800, boxShadow: "0 4px 14px rgba(234,88,12,0.35)" }}>
              {top3[2].name.charAt(0)}
            </div>
            <Medal size={18} color="#ea580c" style={{ margin: "0 auto 6px" }} />
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{top3[2].name}</p>
            <p style={{ fontSize: "12px", color: "#ea580c", marginTop: "2px" }}>{top3[2].pct}%</p>
            <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "1px" }}>{top3[2].total}/600</p>
            <div style={{ height: "50px", background: "linear-gradient(180deg,#fed7aa,#fdba74)", borderRadius: "10px 10px 0 0", marginTop: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: "20px", fontWeight: 800, color: "#ea580c" }}>3</span>
            </div>
          </div>

        </div>
      </div>

      {/* Filters + Table */}
      <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>

        {/* Toolbar */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f8fafc", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <select value={selClass} onChange={e => setSelClass(e.target.value)}
            style={{ padding: "9px 14px", fontSize: "13px", fontWeight: 600, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", cursor: "pointer" }}>
            {classes.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={selExam} onChange={e => setSelExam(e.target.value)}
            style={{ padding: "9px 14px", fontSize: "13px", fontWeight: 600, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", cursor: "pointer" }}>
            {exams.map(e => <option key={e}>{e}</option>)}
          </select>
          <div style={{ position: "relative", flex: 1, maxWidth: "280px" }}>
            <Search size={14} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student..."
              style={{ width: "100%", paddingLeft: "36px", paddingRight: "16px", paddingTop: "9px", paddingBottom: "9px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", fontFamily: "inherit" }}
              onFocus={e => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
              onBlur={e  => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
            />
          </div>
          <p style={{ marginLeft: "auto", fontSize: "12px", color: "#94a3b8" }}>{filtered.length} students</p>
        </div>

        {/* Table */}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#fafafa", borderBottom: "1px solid #f1f5f9" }}>
              {["Rank", "Student", "Class", "Total Marks", "Percentage", "Grade", "Attendance"].map(h => (
                <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => {
              const gs = gradeStyle[s.grade];
              const rankBg = ["linear-gradient(135deg,#f59e0b,#d97706)", "linear-gradient(135deg,#94a3b8,#64748b)", "linear-gradient(135deg,#ea580c,#c2410c)"];
              const rowBg  = i === 0 ? "#fffdf0" : i === 1 ? "#fafafa" : i === 2 ? "#fff8f5" : "transparent";
              const attColor = s.attendance >= 75 ? "#16a34a" : "#e11d48";

              return (
                <tr key={s.id}
                  style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f8fafc" : "none", background: rowBg, transition: "background 0.15s" }}
                  onMouseEnter={ev => (ev.currentTarget as HTMLTableRowElement).style.background = "#f8fafc"}
                  onMouseLeave={ev => (ev.currentTarget as HTMLTableRowElement).style.background = rowBg}
                >
                  {/* Rank */}
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: i < 3 ? rankBg[i] : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: i < 3 ? "0 2px 8px rgba(0,0,0,0.15)" : "none" }}>
                      <span style={{ fontSize: "13px", fontWeight: 800, color: i < 3 ? "#fff" : "#64748b" }}>#{i + 1}</span>
                    </div>
                  </td>

                  {/* Student */}
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "38px", height: "38px", borderRadius: "12px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "14px", fontWeight: 700, flexShrink: 0, boxShadow: "0 2px 8px rgba(99,102,241,0.25)" }}>
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{s.name}</p>
                        <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "1px" }}>Roll #{s.roll} · {s.id}</p>
                      </div>
                    </div>
                  </td>

                  {/* Class */}
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px", background: "#eff6ff", color: "#2563eb" }}>{s.class}</span>
                  </td>

                  {/* Total */}
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a" }}>{s.total}</span>
                    <span style={{ fontSize: "11px", color: "#94a3b8", marginLeft: "2px" }}>/600</span>
                  </td>

                  {/* Percentage */}
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "70px", height: "6px", background: "#f1f5f9", borderRadius: "99px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${s.pct}%`, background: s.pct >= 75 ? "#10b981" : s.pct >= 50 ? "#f59e0b" : "#ef4444", borderRadius: "99px" }} />
                      </div>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: s.pct >= 75 ? "#16a34a" : s.pct >= 50 ? "#d97706" : "#e11d48" }}>{s.pct}%</span>
                    </div>
                  </td>

                  {/* Grade */}
                  <td style={{ padding: "14px 20px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 800, padding: "5px 12px", borderRadius: "20px", background: gs.bg, color: gs.color }}>{s.grade}</span>
                  </td>

                  {/* Attendance */}
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "50px", height: "5px", background: "#f1f5f9", borderRadius: "99px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${s.attendance}%`, background: attColor, borderRadius: "99px" }} />
                      </div>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: attColor }}>{s.attendance}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

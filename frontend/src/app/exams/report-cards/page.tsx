"use client";
import React, { useState } from "react";
import { Download, Search, Eye, Printer, QrCode } from "lucide-react";

const reportCards = [
  { id: "S001", name: "Aarav Sharma",  class: "10-A", roll: 1,  subjects: { Mathematics: 92, Physics: 88, Chemistry: 85, English: 90, Biology: 87, History: 82 }, attendance: 94, rank: 2  },
  { id: "S002", name: "Priya Patel",   class: "10-A", roll: 2,  subjects: { Mathematics: 98, Physics: 95, Chemistry: 92, English: 96, Biology: 94, History: 90 }, attendance: 98, rank: 1  },
  { id: "S003", name: "Rohan Verma",   class: "10-A", roll: 3,  subjects: { Mathematics: 65, Physics: 58, Chemistry: 62, English: 70, Biology: 60, History: 68 }, attendance: 72, rank: 18 },
  { id: "S004", name: "Sneha Gupta",   class: "10-A", roll: 4,  subjects: { Mathematics: 78, Physics: 82, Chemistry: 75, English: 85, Biology: 80, History: 77 }, attendance: 88, rank: 8  },
  { id: "S005", name: "Karan Singh",   class: "10-A", roll: 5,  subjects: { Mathematics: 45, Physics: 50, Chemistry: 48, English: 55, Biology: 42, History: 52 }, attendance: 65, rank: 38 },
  { id: "S006", name: "Ananya Joshi",  class: "10-A", roll: 6,  subjects: { Mathematics: 95, Physics: 90, Chemistry: 88, English: 92, Biology: 91, History: 89 }, attendance: 96, rank: 3  },
];

const subjectList = ["Mathematics", "Physics", "Chemistry", "English", "Biology", "History"];

function getGrade(pct: number) {
  if (pct >= 90) return { grade: "A+", color: "#16a34a", bg: "#f0fdf4" };
  if (pct >= 80) return { grade: "A",  color: "#2563eb", bg: "#eff6ff" };
  if (pct >= 70) return { grade: "B+", color: "#7c3aed", bg: "#f5f3ff" };
  if (pct >= 60) return { grade: "B",  color: "#d97706", bg: "#fffbeb" };
  if (pct >= 50) return { grade: "C",  color: "#ea580c", bg: "#fff7ed" };
  return { grade: "F", color: "#e11d48", bg: "#fff1f2" };
}

export default function ReportCardsPage() {
  const [search, setSearch]       = useState("");
  const [selected, setSelected]   = useState<typeof reportCards[0] | null>(null);

  const filtered = reportCards.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.id.includes(search));

  return (
    <div style={{ maxWidth: "1600px", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: "12px", color: "#6366f1", fontWeight: 600, marginBottom: "4px" }}>Examinations</p>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>Report Cards</h1>
          <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>View and download student report cards</p>
        </div>
        <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 18px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", fontSize: "13px", fontWeight: 600, color: "#fff", cursor: "pointer", boxShadow: "0 4px 12px rgba(99,102,241,0.35)" }}>
          <Download size={14} /> Bulk Download
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 1fr" : "1fr", gap: "20px" }}>

        {/* Student List */}
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f8fafc" }}>
            <div style={{ position: "relative" }}>
              <Search size={14} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student..."
                style={{ width: "100%", paddingLeft: "36px", paddingRight: "16px", paddingTop: "9px", paddingBottom: "9px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", fontFamily: "inherit" }} />
            </div>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#fafafa", borderBottom: "1px solid #f1f5f9" }}>
                {["Student", "Total", "Percentage", "Grade", "Rank", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => {
                const total   = Object.values(s.subjects).reduce((a, b) => a + b, 0);
                const maxTotal = subjectList.length * 100;
                const pct     = Math.round((total / maxTotal) * 100);
                const g       = getGrade(pct);
                const isSelected = selected?.id === s.id;

                return (
                  <tr key={s.id}
                    style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f8fafc" : "none", background: isSelected ? "#f5f3ff" : "transparent", cursor: "pointer" }}
                    onMouseEnter={ev => { if (!isSelected) (ev.currentTarget as HTMLTableRowElement).style.background = "#fafafa"; }}
                    onMouseLeave={ev => { if (!isSelected) (ev.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
                    onClick={() => setSelected(isSelected ? null : s)}
                  >
                    <td style={{ padding: "12px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "13px", fontWeight: 700 }}>{s.name.charAt(0)}</div>
                        <div>
                          <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{s.name}</p>
                          <p style={{ fontSize: "11px", color: "#94a3b8" }}>Roll #{s.roll}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "12px 20px", fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{total}/{maxTotal}</td>
                    <td style={{ padding: "12px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{ width: "50px", height: "5px", background: "#f1f5f9", borderRadius: "99px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: g.color, borderRadius: "99px" }} />
                        </div>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: g.color }}>{pct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "12px 20px" }}><span style={{ fontSize: "13px", fontWeight: 800, padding: "4px 10px", borderRadius: "20px", background: g.bg, color: g.color }}>{g.grade}</span></td>
                    <td style={{ padding: "12px 20px" }}><span style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>#{s.rank}</span></td>
                    <td style={{ padding: "12px 20px" }}>
                      <div style={{ display: "flex", gap: "4px" }}>
                        {[{ Icon: Eye, hoverBg: "#eff6ff", color: "#2563eb" }, { Icon: Download, hoverBg: "#f0fdf4", color: "#16a34a" }, { Icon: Printer, hoverBg: "#f5f3ff", color: "#7c3aed" }].map(({ Icon, hoverBg, color }, idx) => (
                          <button key={idx} onClick={e => e.stopPropagation()} style={{ padding: "6px", borderRadius: "8px", border: "none", background: "transparent", cursor: "pointer", color: "#94a3b8", display: "flex" }}
                            onMouseEnter={ev => { (ev.currentTarget as HTMLButtonElement).style.background = hoverBg; (ev.currentTarget as HTMLButtonElement).style.color = color; }}
                            onMouseLeave={ev => { (ev.currentTarget as HTMLButtonElement).style.background = "transparent"; (ev.currentTarget as HTMLButtonElement).style.color = "#94a3b8"; }}>
                            <Icon size={13} />
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Report Card Preview */}
        {selected && (() => {
          const total    = Object.values(selected.subjects).reduce((a, b) => a + b, 0);
          const maxTotal = subjectList.length * 100;
          const pct      = Math.round((total / maxTotal) * 100);
          const g        = getGrade(pct);
          return (
            <div style={{ background: "#fff", borderRadius: "16px", border: "2px solid #6366f1", boxShadow: "0 4px 20px rgba(99,102,241,0.1)", overflow: "hidden" }}>
              {/* Card Header */}
              <div style={{ background: "linear-gradient(135deg,#1e1b4b,#312e81)", padding: "24px", textAlign: "center" }}>
                <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", boxShadow: "0 4px 12px rgba(99,102,241,0.4)" }}>
                  <span style={{ fontSize: "24px", fontWeight: 800, color: "#fff" }}>{selected.name.charAt(0)}</span>
                </div>
                <p style={{ fontSize: "18px", fontWeight: 800, color: "#fff" }}>{selected.name}</p>
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", marginTop: "4px" }}>Class {selected.class} · Roll #{selected.roll} · {selected.id}</p>
                <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginTop: "16px" }}>
                  {[{ label: "Total", value: `${total}/${maxTotal}` }, { label: "Percentage", value: `${pct}%` }, { label: "Grade", value: g.grade }, { label: "Rank", value: `#${selected.rank}` }].map(info => (
                    <div key={info.label} style={{ textAlign: "center" }}>
                      <p style={{ fontSize: "18px", fontWeight: 800, color: "#fff" }}>{info.value}</p>
                      <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.5)", marginTop: "2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{info.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subject Marks */}
              <div style={{ padding: "20px" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>Subject-wise Performance</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {subjectList.map(sub => {
                    const mark = selected.subjects[sub as keyof typeof selected.subjects];
                    const sg   = getGrade(mark);
                    return (
                      <div key={sub} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <p style={{ fontSize: "13px", color: "#334155", fontWeight: 500, width: "120px", flexShrink: 0 }}>{sub}</p>
                        <div style={{ flex: 1, height: "6px", background: "#f1f5f9", borderRadius: "99px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${mark}%`, background: sg.color, borderRadius: "99px", transition: "width 0.5s ease" }} />
                        </div>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: sg.color, width: "36px", textAlign: "right" }}>{mark}</span>
                        <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", background: sg.bg, color: sg.color, width: "32px", textAlign: "center" }}>{sg.grade}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Attendance + QR */}
                <div style={{ display: "flex", gap: "12px", marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #f1f5f9" }}>
                  <div style={{ flex: 1, background: "#f8fafc", borderRadius: "12px", padding: "12px 16px" }}>
                    <p style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>Attendance</p>
                    <p style={{ fontSize: "22px", fontWeight: 800, color: selected.attendance >= 75 ? "#16a34a" : "#e11d48", marginTop: "2px" }}>{selected.attendance}%</p>
                  </div>
                  <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "12px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                    <QrCode size={32} color="#6366f1" />
                    <p style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 600 }}>Verify</p>
                  </div>
                </div>

                <button style={{ width: "100%", marginTop: "14px", padding: "11px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", boxShadow: "0 4px 12px rgba(99,102,241,0.3)" }}>
                  <Download size={14} /> Download PDF
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

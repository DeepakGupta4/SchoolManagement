"use client";
import React, { useState } from "react";
import { ChevronDown, ChevronRight, CheckCircle, Circle, Clock, BookOpen, Download, Plus } from "lucide-react";

const syllabusData = [
  {
    subject: "Mathematics", color: "#6366f1", bg: "#eff6ff", teacher: "Dr. Priya Sharma",
    totalChapters: 15, completedChapters: 9,
    units: [
      {
        unit: "Unit 1 — Number Systems", completed: true,
        chapters: [
          { name: "Real Numbers", status: "completed", topics: 6, completedTopics: 6, date: "Apr 5" },
          { name: "Polynomials", status: "completed", topics: 5, completedTopics: 5, date: "Apr 18" },
        ],
      },
      {
        unit: "Unit 2 — Algebra", completed: false,
        chapters: [
          { name: "Linear Equations", status: "completed", topics: 7, completedTopics: 7, date: "May 10" },
          { name: "Quadratic Equations", status: "in-progress", topics: 8, completedTopics: 5, date: "—" },
          { name: "Arithmetic Progressions", status: "pending", topics: 6, completedTopics: 0, date: "—" },
        ],
      },
      {
        unit: "Unit 3 — Geometry", completed: false,
        chapters: [
          { name: "Triangles", status: "completed", topics: 5, completedTopics: 5, date: "Jun 2" },
          { name: "Circles", status: "in-progress", topics: 6, completedTopics: 3, date: "—" },
          { name: "Constructions", status: "pending", topics: 4, completedTopics: 0, date: "—" },
        ],
      },
      {
        unit: "Unit 4 — Trigonometry", completed: false,
        chapters: [
          { name: "Intro to Trigonometry", status: "pending", topics: 5, completedTopics: 0, date: "—" },
          { name: "Applications of Trigonometry", status: "pending", topics: 4, completedTopics: 0, date: "—" },
        ],
      },
    ],
  },
  {
    subject: "Physics", color: "#8b5cf6", bg: "#f5f3ff", teacher: "Mr. Rahul Verma",
    totalChapters: 12, completedChapters: 7,
    units: [
      {
        unit: "Unit 1 — Mechanics", completed: true,
        chapters: [
          { name: "Motion in a Straight Line", status: "completed", topics: 8, completedTopics: 8, date: "Apr 8" },
          { name: "Laws of Motion", status: "completed", topics: 7, completedTopics: 7, date: "Apr 25" },
          { name: "Work, Energy & Power", status: "completed", topics: 6, completedTopics: 6, date: "May 15" },
        ],
      },
      {
        unit: "Unit 2 — Thermodynamics", completed: false,
        chapters: [
          { name: "Thermal Properties", status: "completed", topics: 5, completedTopics: 5, date: "Jun 5" },
          { name: "Thermodynamics", status: "in-progress", topics: 7, completedTopics: 4, date: "—" },
          { name: "Kinetic Theory", status: "pending", topics: 5, completedTopics: 0, date: "—" },
        ],
      },
    ],
  },
  {
    subject: "Chemistry", color: "#10b981", bg: "#f0fdf4", teacher: "Ms. Kavita Singh",
    totalChapters: 14, completedChapters: 8,
    units: [
      {
        unit: "Unit 1 — Basic Concepts", completed: true,
        chapters: [
          { name: "Some Basic Concepts of Chemistry", status: "completed", topics: 6, completedTopics: 6, date: "Apr 6" },
          { name: "Structure of Atom", status: "completed", topics: 8, completedTopics: 8, date: "Apr 22" },
        ],
      },
      {
        unit: "Unit 2 — Chemical Bonding", completed: false,
        chapters: [
          { name: "Chemical Bonding", status: "completed", topics: 9, completedTopics: 9, date: "May 12" },
          { name: "States of Matter", status: "in-progress", topics: 6, completedTopics: 3, date: "—" },
          { name: "Thermodynamics", status: "pending", topics: 7, completedTopics: 0, date: "—" },
        ],
      },
    ],
  },
];

const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
  completed:   { color: "#16a34a", bg: "#f0fdf4", label: "Completed"   },
  "in-progress":{ color: "#d97706", bg: "#fffbeb", label: "In Progress" },
  pending:     { color: "#94a3b8", bg: "#f8fafc", label: "Pending"     },
};

const classes  = ["6-A", "7-A", "8-A", "9-A", "10-A", "11-A", "12-A"];
const subjects = ["All Subjects", "Mathematics", "Physics", "Chemistry", "English", "Biology"];

export default function SyllabusPage() {
  const [selClass,   setSelClass]   = useState("10-A");
  const [selSubject, setSelSubject] = useState("All Subjects");
  const [openUnits,  setOpenUnits]  = useState<Record<string, boolean>>({});
  const [openSubjects, setOpenSubjects] = useState<Record<string, boolean>>({ Mathematics: true });

  const toggleUnit    = (key: string) => setOpenUnits(p => ({ ...p, [key]: !p[key] }));
  const toggleSubject = (key: string) => setOpenSubjects(p => ({ ...p, [key]: !p[key] }));

  const filtered = syllabusData.filter(s => selSubject === "All Subjects" || s.subject === selSubject);

  const totalChapters   = syllabusData.reduce((a, s) => a + s.totalChapters, 0);
  const completedTotal  = syllabusData.reduce((a, s) => a + s.completedChapters, 0);
  const overallPct      = Math.round((completedTotal / totalChapters) * 100);

  return (
    <div style={{ maxWidth: "1600px", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>Syllabus Tracker</h1>
          <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>Track chapter-wise syllabus completion progress</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#fff", fontSize: "13px", fontWeight: 600, color: "#334155", cursor: "pointer" }}>
            <Download size={14} /> Export
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 18px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", fontSize: "13px", fontWeight: 600, color: "#fff", cursor: "pointer", boxShadow: "0 4px 12px rgba(99,102,241,0.35)" }}>
            <Plus size={14} /> Add Chapter
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", display: "flex", alignItems: "center", gap: "12px" }}>
        <select value={selClass} onChange={e => setSelClass(e.target.value)}
          style={{ padding: "9px 14px", fontSize: "13px", fontWeight: 600, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", cursor: "pointer" }}>
          {classes.map(c => <option key={c}>Class {c}</option>)}
        </select>
        <div style={{ display: "flex", background: "#f8fafc", borderRadius: "12px", padding: "4px", gap: "2px" }}>
          {subjects.map(s => (
            <button key={s} onClick={() => setSelSubject(s)} style={{
              padding: "7px 14px", borderRadius: "9px", border: "none", cursor: "pointer",
              fontSize: "12px", fontWeight: 600, transition: "all 0.15s",
              background: selSubject === s ? "#fff" : "transparent",
              color: selSubject === s ? "#0f172a" : "#64748b",
              boxShadow: selSubject === s ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              whiteSpace: "nowrap",
            }}>{s}</button>
          ))}
        </div>
      </div>

      {/* Overall Progress */}
      <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", padding: "20px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
          <p style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>Overall Syllabus Completion — {selClass}</p>
          <span style={{ fontSize: "22px", fontWeight: 800, color: overallPct >= 75 ? "#16a34a" : overallPct >= 50 ? "#d97706" : "#e11d48" }}>{overallPct}%</span>
        </div>
        <div style={{ height: "10px", background: "#f1f5f9", borderRadius: "99px", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${overallPct}%`, background: "linear-gradient(90deg,#6366f1,#8b5cf6)", borderRadius: "99px", transition: "width 0.6s ease" }} />
        </div>
        <div style={{ display: "flex", gap: "24px", marginTop: "14px" }}>
          {[
            { label: "Total Chapters",     value: totalChapters,                    color: "#6366f1" },
            { label: "Completed",          value: completedTotal,                   color: "#16a34a" },
            { label: "In Progress",        value: totalChapters - completedTotal - 8, color: "#d97706" },
            { label: "Pending",            value: 8,                                color: "#94a3b8" },
          ].map(s => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: s.color, display: "inline-block" }} />
              <span style={{ fontSize: "12px", color: "#64748b" }}>{s.label}:</span>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Subject Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px" }}>
        {filtered.map(s => {
          const pct = Math.round((s.completedChapters / s.totalChapters) * 100);
          return (
            <div key={s.subject} style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <BookOpen size={18} color={s.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>{s.subject}</p>
                  <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "1px" }}>{s.teacher}</p>
                </div>
                <span style={{ fontSize: "16px", fontWeight: 800, color: s.color }}>{pct}%</span>
              </div>
              <div style={{ height: "6px", background: "#f1f5f9", borderRadius: "99px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: s.color, borderRadius: "99px" }} />
              </div>
              <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "8px" }}>{s.completedChapters} of {s.totalChapters} chapters completed</p>
            </div>
          );
        })}
      </div>

      {/* Detailed Accordion */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {filtered.map(subj => {
          const isSubjOpen = openSubjects[subj.subject];
          const pct = Math.round((subj.completedChapters / subj.totalChapters) * 100);
          return (
            <div key={subj.subject} style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>

              {/* Subject Header */}
              <button onClick={() => toggleSubject(subj.subject)}
                style={{ width: "100%", padding: "18px 20px", display: "flex", alignItems: "center", gap: "14px", border: "none", background: "transparent", cursor: "pointer", textAlign: "left" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: subj.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <BookOpen size={18} color={subj.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>{subj.subject}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "4px" }}>
                    <div style={{ width: "120px", height: "5px", background: "#f1f5f9", borderRadius: "99px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: subj.color, borderRadius: "99px" }} />
                    </div>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>{subj.completedChapters}/{subj.totalChapters} chapters · {pct}%</span>
                  </div>
                </div>
                {isSubjOpen ? <ChevronDown size={18} color="#94a3b8" /> : <ChevronRight size={18} color="#94a3b8" />}
              </button>

              {/* Units */}
              {isSubjOpen && (
                <div style={{ borderTop: "1px solid #f8fafc" }}>
                  {subj.units.map((unit, ui) => {
                    const unitKey = `${subj.subject}-${ui}`;
                    const isUnitOpen = openUnits[unitKey] !== false;
                    const unitCompleted = unit.chapters.every(c => c.status === "completed");
                    const unitInProgress = unit.chapters.some(c => c.status === "in-progress");

                    return (
                      <div key={ui} style={{ borderBottom: ui < subj.units.length - 1 ? "1px solid #f8fafc" : "none" }}>
                        {/* Unit Header */}
                        <button onClick={() => toggleUnit(unitKey)}
                          style={{ width: "100%", padding: "14px 20px 14px 28px", display: "flex", alignItems: "center", gap: "10px", border: "none", background: "#fafafa", cursor: "pointer", textAlign: "left" }}>
                          {unitCompleted
                            ? <CheckCircle size={16} color="#16a34a" />
                            : unitInProgress
                              ? <Clock size={16} color="#d97706" />
                              : <Circle size={16} color="#cbd5e1" />
                          }
                          <span style={{ flex: 1, fontSize: "13px", fontWeight: 600, color: "#334155" }}>{unit.unit}</span>
                          <span style={{ fontSize: "11px", color: "#94a3b8" }}>{unit.chapters.length} chapters</span>
                          {isUnitOpen ? <ChevronDown size={14} color="#94a3b8" /> : <ChevronRight size={14} color="#94a3b8" />}
                        </button>

                        {/* Chapters */}
                        {isUnitOpen && (
                          <div>
                            {unit.chapters.map((ch, ci) => {
                              const sc = statusConfig[ch.status];
                              const chPct = Math.round((ch.completedTopics / ch.topics) * 100);
                              return (
                                <div key={ci}
                                  style={{ padding: "12px 20px 12px 52px", display: "flex", alignItems: "center", gap: "12px", borderTop: "1px solid #f8fafc", transition: "background 0.15s" }}
                                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "#f8fafc"}
                                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
                                >
                                  {ch.status === "completed"
                                    ? <CheckCircle size={15} color="#16a34a" style={{ flexShrink: 0 }} />
                                    : ch.status === "in-progress"
                                      ? <Clock size={15} color="#d97706" style={{ flexShrink: 0 }} />
                                      : <Circle size={15} color="#cbd5e1" style={{ flexShrink: 0 }} />
                                  }
                                  <p style={{ flex: 1, fontSize: "13px", color: "#334155", fontWeight: 500 }}>{ch.name}</p>

                                  {/* Topics progress */}
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <div style={{ width: "60px", height: "4px", background: "#f1f5f9", borderRadius: "99px", overflow: "hidden" }}>
                                      <div style={{ height: "100%", width: `${chPct}%`, background: sc.color, borderRadius: "99px" }} />
                                    </div>
                                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>{ch.completedTopics}/{ch.topics}</span>
                                  </div>

                                  {ch.date !== "—" && (
                                    <span style={{ fontSize: "11px", color: "#94a3b8", width: "52px", textAlign: "right" }}>{ch.date}</span>
                                  )}

                                  <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "20px", background: sc.bg, color: sc.color, whiteSpace: "nowrap" }}>
                                    {sc.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

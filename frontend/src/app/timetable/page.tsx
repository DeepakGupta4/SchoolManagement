"use client";
import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Download, Clock } from "lucide-react";

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const periods = [
  { id: 1, time: "8:00 - 8:45" },
  { id: 2, time: "8:45 - 9:30" },
  { id: 3, time: "9:30 - 10:15" },
  { id: 4, time: "10:15 - 10:30", isBreak: true, label: "Short Break" },
  { id: 5, time: "10:30 - 11:15" },
  { id: 6, time: "11:15 - 12:00" },
  { id: 7, time: "12:00 - 12:45", isBreak: true, label: "Lunch Break" },
  { id: 8, time: "12:45 - 1:30" },
  { id: 9, time: "1:30 - 2:15" },
  { id: 10, time: "2:15 - 3:00" },
];

const subjectColors: Record<string, { bg: string; color: string; border: string }> = {
  Mathematics:         { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
  Physics:             { bg: "#f5f3ff", color: "#7c3aed", border: "#ddd6fe" },
  Chemistry:           { bg: "#fdf4ff", color: "#9333ea", border: "#f0abfc" },
  Biology:             { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  English:             { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  History:             { bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
  Geography:           { bg: "#ecfdf5", color: "#059669", border: "#a7f3d0" },
  "Computer Science":  { bg: "#ecfeff", color: "#0891b2", border: "#a5f3fc" },
  "Physical Education":{ bg: "#fff1f2", color: "#e11d48", border: "#fecdd3" },
  Hindi:               { bg: "#fefce8", color: "#ca8a04", border: "#fef08a" },
  "Free Period":       { bg: "#f8fafc", color: "#94a3b8", border: "#e2e8f0" },
};

type TimetableEntry = { subject: string; teacher: string } | null;

const timetableData: Record<string, Record<number, TimetableEntry>> = {
  Monday:    { 1: { subject: "Mathematics", teacher: "Dr. Priya" }, 2: { subject: "Physics", teacher: "Mr. Rahul" }, 3: { subject: "English", teacher: "Ms. Anita" }, 5: { subject: "Chemistry", teacher: "Ms. Kavita" }, 6: { subject: "History", teacher: "Mr. Suresh" }, 8: { subject: "Computer Science", teacher: "Mr. Amit" }, 9: { subject: "Physical Education", teacher: "Mr. Vikram" }, 10: { subject: "Free Period", teacher: "" } },
  Tuesday:   { 1: { subject: "English", teacher: "Ms. Anita" }, 2: { subject: "Mathematics", teacher: "Dr. Priya" }, 3: { subject: "Biology", teacher: "Ms. Deepa" }, 5: { subject: "Hindi", teacher: "Mr. Suresh" }, 6: { subject: "Physics", teacher: "Mr. Rahul" }, 8: { subject: "Geography", teacher: "Mr. Suresh" }, 9: { subject: "Chemistry", teacher: "Ms. Kavita" }, 10: { subject: "Mathematics", teacher: "Dr. Priya" } },
  Wednesday: { 1: { subject: "Physics", teacher: "Mr. Rahul" }, 2: { subject: "Chemistry", teacher: "Ms. Kavita" }, 3: { subject: "Mathematics", teacher: "Dr. Priya" }, 5: { subject: "English", teacher: "Ms. Anita" }, 6: { subject: "Computer Science", teacher: "Mr. Amit" }, 8: { subject: "Biology", teacher: "Ms. Deepa" }, 9: { subject: "Hindi", teacher: "Mr. Suresh" }, 10: { subject: "Physical Education", teacher: "Mr. Vikram" } },
  Thursday:  { 1: { subject: "Hindi", teacher: "Mr. Suresh" }, 2: { subject: "Biology", teacher: "Ms. Deepa" }, 3: { subject: "Physics", teacher: "Mr. Rahul" }, 5: { subject: "Mathematics", teacher: "Dr. Priya" }, 6: { subject: "Geography", teacher: "Mr. Suresh" }, 8: { subject: "English", teacher: "Ms. Anita" }, 9: { subject: "Chemistry", teacher: "Ms. Kavita" }, 10: { subject: "Free Period", teacher: "" } },
  Friday:    { 1: { subject: "Chemistry", teacher: "Ms. Kavita" }, 2: { subject: "English", teacher: "Ms. Anita" }, 3: { subject: "Hindi", teacher: "Mr. Suresh" }, 5: { subject: "Physics", teacher: "Mr. Rahul" }, 6: { subject: "Mathematics", teacher: "Dr. Priya" }, 8: { subject: "Computer Science", teacher: "Mr. Amit" }, 9: { subject: "Biology", teacher: "Ms. Deepa" }, 10: { subject: "Geography", teacher: "Mr. Suresh" } },
  Saturday:  { 1: { subject: "Physical Education", teacher: "Mr. Vikram" }, 2: { subject: "Computer Science", teacher: "Mr. Amit" }, 3: { subject: "Free Period", teacher: "" }, 5: null, 6: null, 8: null, 9: null, 10: null },
};

const classes = ["6-A", "6-B", "7-A", "8-A", "9-A", "9-B", "10-A", "10-B", "11-A", "12-A"];
const todayIndex = Math.min(new Date().getDay() - 1, 5);

export default function TimetablePage() {
  const [selectedClass, setSelectedClass] = useState("10-A");
  const [highlightDay, setHighlightDay] = useState<string | null>(days[todayIndex] ?? "Monday");

  return (
    <div style={{ maxWidth: "1600px", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>Timetable</h1>
          <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>Weekly class schedule & period management</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#fff", fontSize: "13px", fontWeight: 600, color: "#334155", cursor: "pointer" }}>
            <Download size={14} /> Export PDF
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 18px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", fontSize: "13px", fontWeight: 600, color: "#fff", cursor: "pointer", boxShadow: "0 4px 12px rgba(99,102,241,0.35)" }}>
            <Plus size={14} /> Edit Timetable
          </button>
        </div>
      </div>

      {/* Controls */}
      <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
        {/* Class selector */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748b" }}>Class:</span>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {classes.map(c => (
              <button key={c} onClick={() => setSelectedClass(c)} style={{
                padding: "6px 14px", borderRadius: "9px", border: "none", cursor: "pointer",
                fontSize: "12px", fontWeight: 700, transition: "all 0.15s",
                background: selectedClass === c ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "#f8fafc",
                color: selectedClass === c ? "#fff" : "#64748b",
                boxShadow: selectedClass === c ? "0 2px 8px rgba(99,102,241,0.3)" : "none",
              }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
          <button style={{ padding: "7px", borderRadius: "9px", border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer" }}><ChevronLeft size={15} color="#64748b" /></button>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#334155" }}>Week of Jul 14 – Jul 19, 2025</span>
          <button style={{ padding: "7px", borderRadius: "9px", border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer" }}><ChevronRight size={15} color="#64748b" /></button>
        </div>
      </div>

      {/* Timetable Grid */}
      <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
            <thead>
              <tr style={{ background: "#fafafa", borderBottom: "2px solid #f1f5f9" }}>
                {/* Time column header */}
                <th style={{ padding: "14px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", width: "110px", borderRight: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <Clock size={13} /> Time
                  </div>
                </th>
                {days.map(day => {
                  const isToday = day === (days[todayIndex] ?? "");
                  return (
                    <th key={day} onClick={() => setHighlightDay(highlightDay === day ? null : day)}
                      style={{ padding: "14px 12px", textAlign: "center", fontSize: "12px", fontWeight: 700, cursor: "pointer", transition: "background 0.15s", borderRight: "1px solid #f1f5f9", background: isToday ? "#eff6ff" : "transparent", color: isToday ? "#2563eb" : "#334155" }}>
                      <div>{day}</div>
                      {isToday && <div style={{ fontSize: "10px", color: "#6366f1", fontWeight: 600, marginTop: "2px" }}>Today</div>}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {periods.map((period, pi) => {
                if (period.isBreak) {
                  return (
                    <tr key={period.id} style={{ background: "#fafafa" }}>
                      <td style={{ padding: "8px 20px", borderRight: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9" }}>
                        <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600 }}>{period.time}</div>
                      </td>
                      <td colSpan={6} style={{ padding: "8px 20px", borderBottom: "1px solid #f1f5f9", textAlign: "center" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", background: "#f1f5f9", padding: "3px 12px", borderRadius: "20px" }}>
                          ☕ {period.label}
                        </span>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={period.id} style={{ borderBottom: pi < periods.length - 1 ? "1px solid #f8fafc" : "none" }}>
                    {/* Time */}
                    <td style={{ padding: "10px 20px", borderRight: "1px solid #f1f5f9", verticalAlign: "middle" }}>
                      <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}>P{period.id > 4 ? period.id - 1 : period.id}</div>
                      <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "2px" }}>{period.time}</div>
                    </td>

                    {/* Day cells */}
                    {days.map(day => {
                      const entry = timetableData[day]?.[period.id];
                      const isToday = day === (days[todayIndex] ?? "");
                      const sc = entry ? (subjectColors[entry.subject] ?? subjectColors["Free Period"]) : null;

                      return (
                        <td key={day} style={{ padding: "8px", borderRight: "1px solid #f8fafc", verticalAlign: "middle", background: isToday ? "#fafeff" : "transparent", minWidth: "130px" }}>
                          {entry ? (
                            <div style={{
                              padding: "8px 10px", borderRadius: "10px",
                              background: sc!.bg, border: `1px solid ${sc!.border}`,
                              cursor: "pointer", transition: "all 0.15s",
                            }}
                              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.transform = "scale(1.02)"}
                              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.transform = "scale(1)"}
                            >
                              <p style={{ fontSize: "12px", fontWeight: 700, color: sc!.color, lineHeight: 1.2 }}>{entry.subject}</p>
                              {entry.teacher && <p style={{ fontSize: "10px", color: "#94a3b8", marginTop: "3px" }}>{entry.teacher}</p>}
                            </div>
                          ) : (
                            <div style={{ padding: "8px 10px", borderRadius: "10px", background: "#f8fafc", border: "1px dashed #e2e8f0", textAlign: "center" }}>
                              <span style={{ fontSize: "10px", color: "#cbd5e1" }}>—</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Subject Legend */}
      <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", padding: "16px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
        <p style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>Subject Legend</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          {Object.entries(subjectColors).filter(([k]) => k !== "Free Period").map(([subject, sc]) => (
            <div key={subject} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "5px 12px", borderRadius: "20px", background: sc.bg, border: `1px solid ${sc.border}` }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: sc.color, display: "inline-block" }} />
              <span style={{ fontSize: "12px", fontWeight: 600, color: sc.color }}>{subject}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

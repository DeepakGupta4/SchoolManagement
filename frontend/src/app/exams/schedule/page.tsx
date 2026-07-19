"use client";
import React, { useState } from "react";
import { Plus, Download, Calendar, Clock, Users, Edit, Trash2, Eye, Search } from "lucide-react";

const scheduleData = [
  { id: "EX001", exam: "Mid-Term Exam",   subject: "Mathematics",   class: "10-A", date: "Jul 28, 2025", time: "8:30 AM", duration: "3 hrs",  room: "Hall A", invigilator: "Dr. Priya Sharma",  totalMarks: 100, status: "upcoming" },
  { id: "EX002", exam: "Mid-Term Exam",   subject: "Physics",       class: "10-A", date: "Jul 29, 2025", time: "8:30 AM", duration: "3 hrs",  room: "Hall B", invigilator: "Mr. Rahul Verma",   totalMarks: 100, status: "upcoming" },
  { id: "EX003", exam: "Mid-Term Exam",   subject: "Chemistry",     class: "10-A", date: "Jul 30, 2025", time: "8:30 AM", duration: "3 hrs",  room: "Hall A", invigilator: "Ms. Kavita Singh",  totalMarks: 100, status: "upcoming" },
  { id: "EX004", exam: "Unit Test 1",     subject: "English",       class: "9-B",  date: "Jul 20, 2025", time: "10:00 AM",duration: "1 hr",   room: "Room 201", invigilator: "Ms. Anita Patel", totalMarks: 25,  status: "upcoming" },
  { id: "EX005", exam: "Class Test",      subject: "Biology",       class: "11-A", date: "Jul 18, 2025", time: "11:00 AM",duration: "45 min", room: "Room 301", invigilator: "Ms. Deepa Nair",  totalMarks: 20,  status: "ongoing"  },
  { id: "EX006", exam: "Unit Test 1",     subject: "History",       class: "8-A",  date: "Jul 10, 2025", time: "9:00 AM", duration: "1 hr",   room: "Room 106", invigilator: "Mr. Suresh Kumar",totalMarks: 25,  status: "completed"},
  { id: "EX007", exam: "Practical",       subject: "Chemistry",     class: "12-A", date: "Jul 08, 2025", time: "9:00 AM", duration: "2 hrs",  room: "Chem Lab", invigilator: "Ms. Kavita Singh", totalMarks: 30,  status: "completed"},
];

const statusConfig: Record<string, { bg: string; color: string }> = {
  upcoming:  { bg: "#eff6ff", color: "#2563eb" },
  ongoing:   { bg: "#fffbeb", color: "#d97706" },
  completed: { bg: "#f0fdf4", color: "#16a34a" },
};

export default function ExamSchedulePage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const filtered = scheduleData.filter(e => {
    const matchFilter = filter === "All" || e.status === filter.toLowerCase();
    const matchSearch = e.subject.toLowerCase().includes(search.toLowerCase()) || e.class.toLowerCase().includes(search.toLowerCase()) || e.exam.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div style={{ maxWidth: "1600px", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: "12px", color: "#6366f1", fontWeight: 600, marginBottom: "4px" }}>Examinations</p>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>Exam Schedule</h1>
          <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>View and manage all scheduled examinations</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#fff", fontSize: "13px", fontWeight: 600, color: "#334155", cursor: "pointer" }}>
            <Download size={14} /> Export
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 18px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", fontSize: "13px", fontWeight: 600, color: "#fff", cursor: "pointer", boxShadow: "0 4px 12px rgba(99,102,241,0.35)" }}>
            <Plus size={14} /> Add Exam
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }}>
        {[
          { label: "Total Scheduled", value: scheduleData.length,                                    icon: "📅", color: "#6366f1", bg: "#eff6ff" },
          { label: "Upcoming",        value: scheduleData.filter(e => e.status === "upcoming").length, icon: "⏰", color: "#2563eb", bg: "#dbeafe" },
          { label: "Ongoing",         value: scheduleData.filter(e => e.status === "ongoing").length,  icon: "📝", color: "#d97706", bg: "#fffbeb" },
          { label: "Completed",       value: scheduleData.filter(e => e.status === "completed").length,icon: "✅", color: "#16a34a", bg: "#f0fdf4" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px" }}>{s.icon}</div>
            <div>
              <p style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>{s.label}</p>
              <p style={{ fontSize: "28px", fontWeight: 800, color: s.color, lineHeight: 1.1, letterSpacing: "-0.5px" }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f8fafc", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ display: "flex", background: "#f8fafc", borderRadius: "12px", padding: "4px", gap: "2px" }}>
            {["All", "Upcoming", "Ongoing", "Completed"].map(tab => (
              <button key={tab} onClick={() => setFilter(tab)} style={{ padding: "7px 14px", borderRadius: "9px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 600, background: filter === tab ? "#fff" : "transparent", color: filter === tab ? "#0f172a" : "#64748b", boxShadow: filter === tab ? "0 1px 4px rgba(0,0,0,0.08)" : "none", transition: "all 0.15s" }}>{tab}</button>
            ))}
          </div>
          <div style={{ position: "relative", flex: 1, maxWidth: "280px" }}>
            <Search size={14} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search exams..."
              style={{ width: "100%", paddingLeft: "36px", paddingRight: "16px", paddingTop: "9px", paddingBottom: "9px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", fontFamily: "inherit" }} />
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#fafafa", borderBottom: "1px solid #f1f5f9" }}>
              {["Exam", "Subject", "Class", "Date", "Time", "Duration", "Room", "Invigilator", "Marks", "Status", "Actions"].map(h => (
                <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((e, i) => {
              const sc = statusConfig[e.status];
              return (
                <tr key={e.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f8fafc" : "none" }}
                  onMouseEnter={ev => (ev.currentTarget as HTMLTableRowElement).style.background = "#fafafa"}
                  onMouseLeave={ev => (ev.currentTarget as HTMLTableRowElement).style.background = "transparent"}>
                  <td style={{ padding: "14px 20px", fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{e.exam}</td>
                  <td style={{ padding: "14px 20px", fontSize: "13px", color: "#334155" }}>{e.subject}</td>
                  <td style={{ padding: "14px 20px" }}><span style={{ fontSize: "12px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px", background: "#eff6ff", color: "#2563eb" }}>{e.class}</span></td>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "#334155", fontWeight: 600 }}><Calendar size={12} color="#94a3b8" />{e.date}</div>
                  </td>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "#64748b" }}><Clock size={11} color="#94a3b8" />{e.time}</div>
                  </td>
                  <td style={{ padding: "14px 20px", fontSize: "12px", color: "#64748b" }}>{e.duration}</td>
                  <td style={{ padding: "14px 20px", fontSize: "12px", color: "#64748b" }}>{e.room}</td>
                  <td style={{ padding: "14px 20px", fontSize: "12px", color: "#334155" }}>{e.invigilator}</td>
                  <td style={{ padding: "14px 20px" }}><span style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>{e.totalMarks}</span><span style={{ fontSize: "11px", color: "#94a3b8", marginLeft: "2px" }}>pts</span></td>
                  <td style={{ padding: "14px 20px" }}><span style={{ fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px", background: sc.bg, color: sc.color, textTransform: "capitalize" }}>{e.status}</span></td>
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", gap: "4px" }}>
                      {[{ Icon: Eye, hoverBg: "#eff6ff", color: "#2563eb" }, { Icon: Edit, hoverBg: "#f0fdf4", color: "#16a34a" }, { Icon: Trash2, hoverBg: "#fff1f2", color: "#e11d48" }].map(({ Icon, hoverBg, color }, idx) => (
                        <button key={idx} style={{ padding: "7px", borderRadius: "9px", border: "none", background: "transparent", cursor: "pointer", color: "#94a3b8", display: "flex" }}
                          onMouseEnter={ev => { (ev.currentTarget as HTMLButtonElement).style.background = hoverBg; (ev.currentTarget as HTMLButtonElement).style.color = color; }}
                          onMouseLeave={ev => { (ev.currentTarget as HTMLButtonElement).style.background = "transparent"; (ev.currentTarget as HTMLButtonElement).style.color = "#94a3b8"; }}>
                          <Icon size={14} />
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
    </div>
  );
}

"use client";
import React, { useState } from "react";
import { Plus, Download, Eye, Edit, Trash2, Search, Calendar, Clock, Users, FileText, CheckCircle, AlertCircle, XCircle } from "lucide-react";

const exams = [
  { id: "EX001", name: "Unit Test 1",       type: "Unit Test", class: "10-A", subject: "Mathematics",  date: "Jul 20, 2025", time: "9:00 AM", duration: "1 hr",   totalMarks: 25,  status: "upcoming",   students: 42 },
  { id: "EX002", name: "Mid-Term Exam",      type: "Mid-Term",  class: "All", subject: "All Subjects", date: "Jul 28, 2025", time: "8:30 AM", duration: "3 hrs",  totalMarks: 100, status: "upcoming",   students: 1240 },
  { id: "EX003", name: "Unit Test 1",        type: "Unit Test", class: "9-B", subject: "Physics",      date: "Jul 15, 2025", time: "10:00 AM",duration: "1 hr",   totalMarks: 25,  status: "completed",  students: 38 },
  { id: "EX004", name: "Practical Exam",     type: "Practical", class: "12-A",subject: "Chemistry",    date: "Jul 10, 2025", time: "9:00 AM", duration: "2 hrs",  totalMarks: 30,  status: "completed",  students: 35 },
  { id: "EX005", name: "Class Test",         type: "Class Test",class: "8-A", subject: "English",      date: "Jul 18, 2025", time: "11:00 AM",duration: "45 min", totalMarks: 20,  status: "ongoing",    students: 44 },
  { id: "EX006", name: "Final Exam",         type: "Final",     class: "All", subject: "All Subjects", date: "Oct 15, 2025", time: "8:30 AM", duration: "3 hrs",  totalMarks: 100, status: "upcoming",   students: 1240 },
  { id: "EX007", name: "Unit Test 2",        type: "Unit Test", class: "11-A",subject: "Biology",      date: "Jul 08, 2025", time: "9:00 AM", duration: "1 hr",   totalMarks: 25,  status: "completed",  students: 40 },
  { id: "EX008", name: "Assignment Test",    type: "Class Test",class: "7-A", subject: "History",      date: "Jul 22, 2025", time: "10:30 AM",duration: "30 min", totalMarks: 15,  status: "upcoming",   students: 36 },
];

const statusConfig: Record<string, { bg: string; color: string; icon: React.ElementType; label: string }> = {
  upcoming:  { bg: "#eff6ff", color: "#2563eb", icon: Clock,         label: "Upcoming"  },
  ongoing:   { bg: "#fffbeb", color: "#d97706", icon: AlertCircle,   label: "Ongoing"   },
  completed: { bg: "#f0fdf4", color: "#16a34a", icon: CheckCircle,   label: "Completed" },
  cancelled: { bg: "#fff1f2", color: "#e11d48", icon: XCircle,       label: "Cancelled" },
};

const typeColors: Record<string, { bg: string; color: string }> = {
  "Unit Test":  { bg: "#eff6ff", color: "#2563eb" },
  "Mid-Term":   { bg: "#f5f3ff", color: "#7c3aed" },
  "Final":      { bg: "#fff1f2", color: "#e11d48" },
  "Practical":  { bg: "#f0fdf4", color: "#16a34a" },
  "Class Test": { bg: "#fffbeb", color: "#d97706" },
};

const tabs = ["All", "Upcoming", "Ongoing", "Completed"];

export default function ExamsPage() {
  const [activeTab, setActiveTab]   = useState("All");
  const [search, setSearch]         = useState("");
  const [selectedExam, setSelectedExam] = useState<typeof exams[0] | null>(null);

  const filtered = exams.filter(e => {
    const matchTab    = activeTab === "All" || e.status === activeTab.toLowerCase();
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
                        e.subject.toLowerCase().includes(search.toLowerCase()) ||
                        e.class.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const counts = {
    upcoming:  exams.filter(e => e.status === "upcoming").length,
    ongoing:   exams.filter(e => e.status === "ongoing").length,
    completed: exams.filter(e => e.status === "completed").length,
  };

  return (
    <div style={{ maxWidth: "1600px", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>Examinations</h1>
          <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>Schedule, manage and track all exams</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#fff", fontSize: "13px", fontWeight: 600, color: "#334155", cursor: "pointer" }}>
            <Download size={14} /> Export
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 18px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", fontSize: "13px", fontWeight: 600, color: "#fff", cursor: "pointer", boxShadow: "0 4px 12px rgba(99,102,241,0.35)" }}>
            <Plus size={14} /> Schedule Exam
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }}>
        {[
          { label: "Total Exams",     value: exams.length,       icon: "📝", color: "#6366f1", bg: "#eff6ff" },
          { label: "Upcoming",        value: counts.upcoming,    icon: "📅", color: "#2563eb", bg: "#dbeafe" },
          { label: "Ongoing",         value: counts.ongoing,     icon: "⏳", color: "#d97706", bg: "#fffbeb" },
          { label: "Completed",       value: counts.completed,   icon: "✅", color: "#16a34a", bg: "#f0fdf4" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <p style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>{s.label}</p>
              <p style={{ fontSize: "28px", fontWeight: 800, color: s.color, lineHeight: 1.1, letterSpacing: "-0.5px" }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table Card */}
      <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>

        {/* Tabs + Search */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f8fafc", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          {/* Tabs */}
          <div style={{ display: "flex", background: "#f8fafc", borderRadius: "12px", padding: "4px", gap: "2px" }}>
            {tabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: "7px 16px", borderRadius: "9px", border: "none", cursor: "pointer",
                fontSize: "12px", fontWeight: 600, transition: "all 0.15s",
                background: activeTab === tab ? "#fff" : "transparent",
                color: activeTab === tab ? "#0f172a" : "#64748b",
                boxShadow: activeTab === tab ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}>
                {tab}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ position: "relative", flex: 1, maxWidth: "300px" }}>
            <Search size={14} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search exams..."
              style={{ width: "100%", paddingLeft: "36px", paddingRight: "16px", paddingTop: "9px", paddingBottom: "9px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", fontFamily: "inherit" }}
              onFocus={e => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
              onBlur={e  => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          <p style={{ marginLeft: "auto", fontSize: "12px", color: "#94a3b8" }}>{filtered.length} exams</p>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#fafafa", borderBottom: "1px solid #f1f5f9" }}>
                {["Exam", "Type", "Class", "Subject", "Date & Time", "Duration", "Marks", "Students", "Status", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((exam, i) => {
                const sc = statusConfig[exam.status];
                const tc = typeColors[exam.type] ?? { bg: "#f8fafc", color: "#64748b" };
                const StatusIcon = sc.icon;
                return (
                  <tr key={exam.id}
                    style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f8fafc" : "none", transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "#fafafa"}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                  >
                    {/* Exam name */}
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: tc.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <FileText size={16} color={tc.color} />
                        </div>
                        <div>
                          <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{exam.name}</p>
                          <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "1px" }}>{exam.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px", background: tc.bg, color: tc.color, whiteSpace: "nowrap" }}>{exam.type}</span>
                    </td>

                    {/* Class */}
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px", background: "#eff6ff", color: "#2563eb" }}>{exam.class}</span>
                    </td>

                    {/* Subject */}
                    <td style={{ padding: "14px 20px", fontSize: "13px", color: "#334155", fontWeight: 500, whiteSpace: "nowrap" }}>{exam.subject}</td>

                    {/* Date & Time */}
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "#334155", fontWeight: 600 }}>
                        <Calendar size={12} color="#94a3b8" />{exam.date}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "#94a3b8", marginTop: "3px" }}>
                        <Clock size={11} color="#94a3b8" />{exam.time}
                      </div>
                    </td>

                    {/* Duration */}
                    <td style={{ padding: "14px 20px", fontSize: "13px", color: "#64748b", whiteSpace: "nowrap" }}>{exam.duration}</td>

                    {/* Marks */}
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>{exam.totalMarks}</span>
                      <span style={{ fontSize: "11px", color: "#94a3b8", marginLeft: "2px" }}>pts</span>
                    </td>

                    {/* Students */}
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <Users size={13} color="#94a3b8" />
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#334155" }}>{exam.students.toLocaleString()}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "5px 10px", borderRadius: "20px", background: sc.bg }}>
                        <StatusIcon size={12} color={sc.color} />
                        <span style={{ fontSize: "11px", fontWeight: 700, color: sc.color }}>{sc.label}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", gap: "4px" }}>
                        {[
                          { Icon: Eye,    hoverBg: "#eff6ff", color: "#2563eb" },
                          { Icon: Edit,   hoverBg: "#f0fdf4", color: "#16a34a" },
                          { Icon: Trash2, hoverBg: "#fff1f2", color: "#e11d48" },
                        ].map(({ Icon, hoverBg, color }, idx) => (
                          <button key={idx}
                            style={{ padding: "7px", borderRadius: "9px", border: "none", background: "transparent", cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = hoverBg; (e.currentTarget as HTMLButtonElement).style.color = color; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "#94a3b8"; }}
                          >
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

          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px", color: "#94a3b8" }}>
              <FileText size={40} color="#e2e8f0" style={{ margin: "0 auto 12px" }} />
              <p style={{ fontSize: "14px", fontWeight: 600 }}>No exams found</p>
              <p style={{ fontSize: "12px", marginTop: "4px" }}>Try adjusting your filters</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid #f8fafc", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: "12px", color: "#94a3b8" }}>
            Showing <strong style={{ color: "#334155" }}>{filtered.length}</strong> of <strong style={{ color: "#334155" }}>{exams.length}</strong> exams
          </p>
          <div style={{ display: "flex", gap: "4px" }}>
            {[1, 2, 3].map(p => (
              <button key={p} style={{ width: "32px", height: "32px", borderRadius: "9px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 600, background: p === 1 ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "#f8fafc", color: p === 1 ? "#fff" : "#64748b", boxShadow: p === 1 ? "0 2px 8px rgba(99,102,241,0.3)" : "none" }}>{p}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Exams Timeline */}
      <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
        <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #f8fafc" }}>
          <p style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>Upcoming Exam Timeline</p>
          <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>Next 3 months schedule</p>
        </div>
        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "0px" }}>
          {exams.filter(e => e.status === "upcoming").map((exam, i, arr) => {
            const tc = typeColors[exam.type] ?? { bg: "#f8fafc", color: "#64748b" };
            return (
              <div key={exam.id} style={{ display: "flex", gap: "16px", paddingBottom: i < arr.length - 1 ? "20px" : "0" }}>
                {/* Timeline line */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: tc.color, border: `3px solid ${tc.bg}`, boxShadow: `0 0 0 2px ${tc.color}`, marginTop: "4px" }} />
                  {i < arr.length - 1 && <div style={{ width: "2px", flex: 1, background: "#f1f5f9", marginTop: "4px" }} />}
                </div>
                {/* Content */}
                <div style={{ flex: 1, paddingBottom: i < arr.length - 1 ? "4px" : "0" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <p style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{exam.name} — {exam.subject}</p>
                    <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "20px", background: tc.bg, color: tc.color }}>{exam.type}</span>
                  </div>
                  <div style={{ display: "flex", gap: "16px", marginTop: "5px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#64748b" }}>
                      <Calendar size={11} color="#94a3b8" />{exam.date}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#64748b" }}>
                      <Clock size={11} color="#94a3b8" />{exam.time} · {exam.duration}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#64748b" }}>
                      <Users size={11} color="#94a3b8" />{exam.students.toLocaleString()} students
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#64748b" }}>
                      Class: <strong style={{ color: "#334155" }}>{exam.class}</strong>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

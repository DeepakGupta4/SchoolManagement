"use client";
import React, { useState } from "react";
import { Plus, Search, Download, Eye, Edit, Trash2, Calendar, Clock, Users, Paperclip, CheckCircle, AlertCircle, XCircle, BookOpen } from "lucide-react";

const assignments = [
  { id: "A001", title: "Quadratic Equations Practice",    subject: "Mathematics", class: "10-A", teacher: "Dr. Priya Sharma",  given: "Jul 10", due: "Jul 17", totalMarks: 20, submitted: 38, total: 42, status: "active",   type: "Worksheet"  },
  { id: "A002", title: "Newton's Laws Problems",          subject: "Physics",     class: "11-A", teacher: "Mr. Rahul Verma",   given: "Jul 12", due: "Jul 19", totalMarks: 15, submitted: 30, total: 40, status: "active",   type: "Problem Set"},
  { id: "A003", title: "Essay — My Favourite Season",     subject: "English",     class: "8-B",  teacher: "Ms. Anita Patel",   given: "Jul 8",  due: "Jul 15", totalMarks: 10, submitted: 44, total: 44, status: "completed",type: "Essay"      },
  { id: "A004", title: "Periodic Table Elements",         subject: "Chemistry",   class: "9-A",  teacher: "Ms. Kavita Singh",  given: "Jul 14", due: "Jul 21", totalMarks: 25, submitted: 12, total: 38, status: "active",   type: "Research"   },
  { id: "A005", title: "World War II Summary",            subject: "History",     class: "10-B", teacher: "Mr. Suresh Kumar",  given: "Jul 5",  due: "Jul 12", totalMarks: 15, submitted: 40, total: 40, status: "completed",type: "Essay"      },
  { id: "A006", title: "Cell Division Diagrams",          subject: "Biology",     class: "12-A", teacher: "Ms. Deepa Nair",    given: "Jul 15", due: "Jul 22", totalMarks: 20, submitted: 5,  total: 35, status: "active",   type: "Diagram"    },
  { id: "A007", title: "Python Basics Program",           subject: "Comp. Sci",   class: "9-B",  teacher: "Mr. Amit Joshi",    given: "Jul 16", due: "Jul 23", totalMarks: 30, submitted: 0,  total: 36, status: "upcoming", type: "Practical"  },
  { id: "A008", title: "Trigonometry Identities",         subject: "Mathematics", class: "11-A", teacher: "Dr. Priya Sharma",  given: "Jul 18", due: "Jul 25", totalMarks: 20, submitted: 0,  total: 40, status: "upcoming", type: "Worksheet"  },
];

const statusConfig: Record<string, { bg: string; color: string; icon: React.ElementType; label: string }> = {
  active:    { bg: "#eff6ff", color: "#2563eb", icon: Clock,         label: "Active"    },
  completed: { bg: "#f0fdf4", color: "#16a34a", icon: CheckCircle,   label: "Completed" },
  upcoming:  { bg: "#fffbeb", color: "#d97706", icon: AlertCircle,   label: "Upcoming"  },
  overdue:   { bg: "#fff1f2", color: "#e11d48", icon: XCircle,       label: "Overdue"   },
};

const typeColors: Record<string, { bg: string; color: string }> = {
  Worksheet:   { bg: "#eff6ff", color: "#2563eb" },
  "Problem Set":{ bg: "#f5f3ff", color: "#7c3aed" },
  Essay:       { bg: "#fff7ed", color: "#c2410c" },
  Research:    { bg: "#ecfeff", color: "#0891b2" },
  Diagram:     { bg: "#f0fdf4", color: "#16a34a" },
  Practical:   { bg: "#fdf4ff", color: "#9333ea" },
};

const subjectColors: Record<string, string> = {
  Mathematics: "#6366f1", Physics: "#8b5cf6", English: "#f59e0b",
  Chemistry: "#10b981", History: "#d97706", Biology: "#16a34a", "Comp. Sci": "#06b6d4",
};

const tabs = ["All", "Active", "Upcoming", "Completed"];

export default function AssignmentsPage() {
  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch]       = useState("");
  const [selected, setSelected]   = useState<typeof assignments[0] | null>(null);

  const filtered = assignments.filter(a => {
    const matchTab    = activeTab === "All" || a.status === activeTab.toLowerCase();
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase()) ||
                        a.subject.toLowerCase().includes(search.toLowerCase()) ||
                        a.class.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  return (
    <div style={{ maxWidth: "1600px", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>Assignments</h1>
          <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>Manage and track all class assignments</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#fff", fontSize: "13px", fontWeight: 600, color: "#334155", cursor: "pointer" }}>
            <Download size={14} /> Export
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 18px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", fontSize: "13px", fontWeight: 600, color: "#fff", cursor: "pointer", boxShadow: "0 4px 12px rgba(99,102,241,0.35)" }}>
            <Plus size={14} /> New Assignment
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }}>
        {[
          { label: "Total",     value: assignments.length,                                      icon: "📝", color: "#6366f1", bg: "#eff6ff" },
          { label: "Active",    value: assignments.filter(a => a.status === "active").length,    icon: "⏳", color: "#2563eb", bg: "#dbeafe" },
          { label: "Completed", value: assignments.filter(a => a.status === "completed").length, icon: "✅", color: "#16a34a", bg: "#f0fdf4" },
          { label: "Upcoming",  value: assignments.filter(a => a.status === "upcoming").length,  icon: "📅", color: "#d97706", bg: "#fffbeb" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>{s.icon}</div>
            <div>
              <p style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>{s.label}</p>
              <p style={{ fontSize: "28px", fontWeight: 800, color: s.color, lineHeight: 1.1, letterSpacing: "-0.5px" }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 380px" : "1fr", gap: "20px" }}>

        {/* Table */}
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>

          {/* Toolbar */}
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f8fafc", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", background: "#f8fafc", borderRadius: "12px", padding: "4px", gap: "2px" }}>
              {tabs.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  padding: "7px 14px", borderRadius: "9px", border: "none", cursor: "pointer",
                  fontSize: "12px", fontWeight: 600, transition: "all 0.15s",
                  background: activeTab === tab ? "#fff" : "transparent",
                  color: activeTab === tab ? "#0f172a" : "#64748b",
                  boxShadow: activeTab === tab ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                }}>{tab}</button>
              ))}
            </div>
            <div style={{ position: "relative", flex: 1, maxWidth: "280px" }}>
              <Search size={14} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search assignments..."
                style={{ width: "100%", paddingLeft: "36px", paddingRight: "16px", paddingTop: "9px", paddingBottom: "9px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", fontFamily: "inherit" }}
                onFocus={e => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
                onBlur={e  => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
              />
            </div>
            <p style={{ marginLeft: "auto", fontSize: "12px", color: "#94a3b8" }}>{filtered.length} assignments</p>
          </div>

          {/* Table */}
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#fafafa", borderBottom: "1px solid #f1f5f9" }}>
                {["Assignment", "Subject", "Class", "Due Date", "Submission", "Marks", "Status", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a, i) => {
                const sc  = statusConfig[a.status];
                const tc  = typeColors[a.type] ?? { bg: "#f8fafc", color: "#64748b" };
                const StatusIcon = sc.icon;
                const subPct = Math.round((a.submitted / a.total) * 100);
                const isSelected = selected?.id === a.id;

                return (
                  <tr key={a.id}
                    style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f8fafc" : "none", background: isSelected ? "#f5f3ff" : "transparent", cursor: "pointer", transition: "background 0.15s" }}
                    onMouseEnter={ev => { if (!isSelected) (ev.currentTarget as HTMLTableRowElement).style.background = "#fafafa"; }}
                    onMouseLeave={ev => { if (!isSelected) (ev.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
                    onClick={() => setSelected(isSelected ? null : a)}
                  >
                    {/* Title */}
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: tc.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <BookOpen size={16} color={tc.color} />
                        </div>
                        <div>
                          <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{a.title}</p>
                          <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                            <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "20px", background: tc.bg, color: tc.color }}>{a.type}</span>
                            <span style={{ fontSize: "11px", color: "#94a3b8" }}>{a.teacher}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Subject */}
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: subjectColors[a.subject] ?? "#94a3b8", display: "inline-block" }} />
                        <span style={{ fontSize: "13px", color: "#334155", fontWeight: 500 }}>{a.subject}</span>
                      </div>
                    </td>

                    {/* Class */}
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px", background: "#eff6ff", color: "#2563eb" }}>{a.class}</span>
                    </td>

                    {/* Due Date */}
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "#334155", fontWeight: 600 }}>
                        <Calendar size={12} color="#94a3b8" />{a.due}
                      </div>
                      <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>Given: {a.given}</div>
                    </td>

                    {/* Submission */}
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{ width: "56px", height: "5px", background: "#f1f5f9", borderRadius: "99px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${subPct}%`, background: subPct === 100 ? "#10b981" : subPct >= 50 ? "#6366f1" : "#f59e0b", borderRadius: "99px" }} />
                        </div>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#334155" }}>{a.submitted}/{a.total}</span>
                      </div>
                    </td>

                    {/* Marks */}
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>{a.totalMarks}</span>
                      <span style={{ fontSize: "11px", color: "#94a3b8", marginLeft: "2px" }}>pts</span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "5px 10px", borderRadius: "20px", background: sc.bg }}>
                        <StatusIcon size={12} color={sc.color} />
                        <span style={{ fontSize: "11px", fontWeight: 700, color: sc.color }}>{sc.label}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "14px 20px" }} onClick={e => e.stopPropagation()}>
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

          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px", color: "#94a3b8" }}>
              <BookOpen size={40} color="#e2e8f0" style={{ margin: "0 auto 12px" }} />
              <p style={{ fontSize: "14px", fontWeight: 600 }}>No assignments found</p>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div style={{ background: "#fff", borderRadius: "16px", border: "2px solid #6366f1", boxShadow: "0 4px 20px rgba(99,102,241,0.1)", overflow: "hidden", height: "fit-content" }}>
            {/* Header */}
            <div style={{ background: "linear-gradient(135deg,#1e1b4b,#312e81)", padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <div style={{ width: "42px", height: "42px", borderRadius: "12px", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <BookOpen size={20} color="#fff" />
                </div>
                <button onClick={() => setSelected(null)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", borderRadius: "8px", padding: "4px 10px", cursor: "pointer", fontSize: "12px" }}>✕</button>
              </div>
              <p style={{ fontSize: "15px", fontWeight: 700, color: "#fff", marginTop: "12px", lineHeight: 1.3 }}>{selected.title}</p>
              <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.6)", marginTop: "4px" }}>{selected.subject} · Class {selected.class}</p>
            </div>

            {/* Details */}
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
              {[
                { label: "Teacher",     value: selected.teacher,    icon: Users    },
                { label: "Given On",    value: selected.given,      icon: Calendar },
                { label: "Due Date",    value: selected.due,        icon: Clock    },
                { label: "Total Marks", value: `${selected.totalMarks} pts`, icon: CheckCircle },
                { label: "Type",        value: selected.type,       icon: Paperclip },
              ].map(d => (
                <div key={d.label} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <d.icon size={14} color="#6366f1" />
                  </div>
                  <div>
                    <p style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{d.label}</p>
                    <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", marginTop: "1px" }}>{d.value}</p>
                  </div>
                </div>
              ))}

              {/* Submission Progress */}
              <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <p style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>Submission Progress</p>
                  <p style={{ fontSize: "13px", fontWeight: 800, color: "#6366f1" }}>{selected.submitted}/{selected.total}</p>
                </div>
                <div style={{ height: "8px", background: "#e2e8f0", borderRadius: "99px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.round((selected.submitted / selected.total) * 100)}%`, background: "linear-gradient(90deg,#6366f1,#8b5cf6)", borderRadius: "99px" }} />
                </div>
                <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "6px" }}>{selected.total - selected.submitted} students yet to submit</p>
              </div>

              <button style={{ width: "100%", padding: "11px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(99,102,241,0.3)" }}>
                View Submissions
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";
import React, { useState } from "react";
import { Plus, Users, BookOpen, Eye, Edit, Trash2, ChevronDown, GraduationCap, UserCheck } from "lucide-react";

const classesData = [
  { id: 1, name: "Class 6",  sections: ["A", "B", "C"], students: 165, teachers: 8,  classTeacher: "Ms. Anita Patel",    room: "101-103", stream: "General",  color: "#6366f1" },
  { id: 2, name: "Class 7",  sections: ["A", "B"],      students: 142, teachers: 7,  classTeacher: "Mr. Suresh Kumar",   room: "104-105", stream: "General",  color: "#8b5cf6" },
  { id: 3, name: "Class 8",  sections: ["A", "B", "C"], students: 178, teachers: 9,  classTeacher: "Ms. Kavita Singh",   room: "106-108", stream: "General",  color: "#06b6d4" },
  { id: 4, name: "Class 9",  sections: ["A", "B"],      students: 160, teachers: 10, classTeacher: "Mr. Rahul Verma",    room: "201-202", stream: "General",  color: "#10b981" },
  { id: 5, name: "Class 10", sections: ["A", "B", "C"], students: 185, teachers: 11, classTeacher: "Dr. Priya Sharma",   room: "203-205", stream: "General",  color: "#f59e0b" },
  { id: 6, name: "Class 11", sections: ["A", "B"],      students: 148, teachers: 12, classTeacher: "Ms. Deepa Nair",     room: "301-302", stream: "Science/Commerce", color: "#f43f5e" },
  { id: 7, name: "Class 12", sections: ["A", "B"],      students: 140, teachers: 12, classTeacher: "Mr. Amit Joshi",     room: "303-304", stream: "Science/Commerce", color: "#e11d48" },
];

const sectionStudents: Record<string, { id: string; name: string; roll: number; attendance: number; fees: string }[]> = {
  "6-A": [
    { id: "S001", name: "Aarav Sharma",  roll: 1, attendance: 94, fees: "Paid"    },
    { id: "S002", name: "Priya Patel",   roll: 2, attendance: 98, fees: "Paid"    },
    { id: "S003", name: "Rohan Verma",   roll: 3, attendance: 72, fees: "Pending" },
    { id: "S004", name: "Sneha Gupta",   roll: 4, attendance: 88, fees: "Paid"    },
    { id: "S005", name: "Karan Singh",   roll: 5, attendance: 65, fees: "Overdue" },
  ],
};

const feeStyle: Record<string, { bg: string; color: string }> = {
  Paid:    { bg: "#f0fdf4", color: "#16a34a" },
  Pending: { bg: "#fffbeb", color: "#d97706" },
  Overdue: { bg: "#fff1f2", color: "#e11d48" },
};

export default function ClassesPage() {
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "list">("grid");

  const cls = classesData.find(c => c.id === selectedClass);

  return (
    <div style={{ maxWidth: "1600px", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>Classes & Sections</h1>
          <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>Manage classes, sections and student assignments</p>
        </div>
        <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 18px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", fontSize: "13px", fontWeight: 600, color: "#fff", cursor: "pointer", boxShadow: "0 4px 12px rgba(99,102,241,0.35)" }}>
          <Plus size={14} /> Add Class
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }}>
        {[
          { label: "Total Classes",   value: "7",    icon: "🏫", color: "#6366f1", bg: "#eff6ff" },
          { label: "Total Sections",  value: "18",   icon: "📋", color: "#10b981", bg: "#f0fdf4" },
          { label: "Total Students",  value: "1,118",icon: "👨‍🎓", color: "#f59e0b", bg: "#fffbeb" },
          { label: "Total Teachers",  value: "69",   icon: "👨‍🏫", color: "#8b5cf6", bg: "#f5f3ff" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <p style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>{s.label}</p>
              <p style={{ fontSize: "26px", fontWeight: 800, color: s.color, lineHeight: 1.1, letterSpacing: "-0.5px" }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Class Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }}>
        {classesData.map(cls => (
          <div
            key={cls.id}
            onClick={() => { setSelectedClass(cls.id); setSelectedSection(null); }}
            style={{
              background: "#fff", borderRadius: "16px", border: `2px solid ${selectedClass === cls.id ? cls.color : "#f1f5f9"}`,
              padding: "20px", cursor: "pointer", boxShadow: selectedClass === cls.id ? `0 4px 20px ${cls.color}25` : "0 1px 4px rgba(0,0,0,0.04)",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={e => { if (selectedClass !== cls.id) (e.currentTarget as HTMLDivElement).style.borderColor = "#e2e8f0"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = selectedClass === cls.id ? cls.color : "#f1f5f9"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}
          >
            {/* Top */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: cls.color, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 12px ${cls.color}40` }}>
                <GraduationCap size={20} color="#fff" />
              </div>
              <div style={{ display: "flex", gap: "4px" }}>
                {cls.sections.map(s => (
                  <span key={s} style={{ width: "24px", height: "24px", borderRadius: "6px", background: `${cls.color}15`, color: cls.color, fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{s}</span>
                ))}
              </div>
            </div>

            <p style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>{cls.name}</p>
            <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>{cls.stream}</p>

            <div style={{ display: "flex", gap: "16px", marginTop: "14px", paddingTop: "14px", borderTop: "1px solid #f8fafc" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <Users size={13} color="#94a3b8" />
                <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>{cls.students}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <BookOpen size={13} color="#94a3b8" />
                <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>{cls.teachers} teachers</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Class Detail */}
      {cls && (
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>

          {/* Header */}
          <div style={{ padding: "18px 24px", borderBottom: "1px solid #f8fafc", display: "flex", alignItems: "center", justifyContent: "space-between", background: `linear-gradient(135deg, ${cls.color}08, ${cls.color}03)` }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: cls.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <GraduationCap size={18} color="#fff" />
              </div>
              <div>
                <p style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>{cls.name} — Details</p>
                <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "1px" }}>Class Teacher: {cls.classTeacher} &nbsp;·&nbsp; Room: {cls.room}</p>
              </div>
            </div>
            <button onClick={() => setSelectedClass(null)} style={{ padding: "6px 14px", borderRadius: "10px", border: "1px solid #e2e8f0", background: "#fff", fontSize: "12px", color: "#64748b", cursor: "pointer", fontWeight: 600 }}>
              Close
            </button>
          </div>

          {/* Section Tabs */}
          <div style={{ padding: "16px 24px", borderBottom: "1px solid #f8fafc", display: "flex", gap: "8px" }}>
            {cls.sections.map(sec => {
              const key = `${cls.name.replace("Class ", "")}-${sec}`;
              const isActive = selectedSection === key;
              return (
                <button
                  key={sec}
                  onClick={() => setSelectedSection(isActive ? null : key)}
                  style={{ padding: "8px 20px", borderRadius: "10px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 700, transition: "all 0.15s", background: isActive ? cls.color : "#f8fafc", color: isActive ? "#fff" : "#64748b", boxShadow: isActive ? `0 4px 12px ${cls.color}40` : "none" }}
                >
                  Section {sec}
                </button>
              );
            })}
          </div>

          {/* Section Info */}
          {selectedSection ? (
            <div>
              <div style={{ padding: "16px 24px", borderBottom: "1px solid #f8fafc", display: "flex", gap: "24px" }}>
                {[
                  { label: "Students", value: "42", icon: Users },
                  { label: "Avg Attendance", value: "91%", icon: UserCheck },
                  { label: "Fee Collected", value: "85%", icon: BookOpen },
                ].map(info => (
                  <div key={info.label} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: `${cls.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <info.icon size={16} color={cls.color} />
                    </div>
                    <div>
                      <p style={{ fontSize: "18px", fontWeight: 800, color: "#0f172a", lineHeight: 1 }}>{info.value}</p>
                      <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>{info.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Students table */}
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#fafafa", borderBottom: "1px solid #f1f5f9" }}>
                    {["Roll", "Student", "Attendance", "Fee Status", "Actions"].map(h => (
                      <th key={h} style={{ padding: "12px 24px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(sectionStudents[selectedSection] ?? sectionStudents["6-A"]).map((s, i, arr) => {
                    const fs = feeStyle[s.fees];
                    const attColor = s.attendance >= 90 ? "#10b981" : s.attendance >= 75 ? "#f59e0b" : "#ef4444";
                    return (
                      <tr key={s.id} style={{ borderBottom: i < arr.length - 1 ? "1px solid #f8fafc" : "none" }}
                        onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "#fafafa"}
                        onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}>
                        <td style={{ padding: "12px 24px", fontSize: "13px", color: "#64748b", fontWeight: 600 }}>#{String(s.roll).padStart(2, "0")}</td>
                        <td style={{ padding: "12px 24px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: cls.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "13px", fontWeight: 700 }}>{s.name.charAt(0)}</div>
                            <div>
                              <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{s.name}</p>
                              <p style={{ fontSize: "11px", color: "#94a3b8" }}>{s.id}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "12px 24px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ width: "60px", height: "5px", background: "#f1f5f9", borderRadius: "99px", overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${s.attendance}%`, background: attColor, borderRadius: "99px" }} />
                            </div>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: attColor }}>{s.attendance}%</span>
                          </div>
                        </td>
                        <td style={{ padding: "12px 24px" }}>
                          <span style={{ fontSize: "12px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px", background: fs.bg, color: fs.color }}>{s.fees}</span>
                        </td>
                        <td style={{ padding: "12px 24px" }}>
                          <div style={{ display: "flex", gap: "4px" }}>
                            {[Eye, Edit, Trash2].map((Icon, idx) => (
                              <button key={idx} style={{ padding: "6px", borderRadius: "8px", border: "none", background: "transparent", cursor: "pointer", color: "#94a3b8" }}
                                onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "#f8fafc"}
                                onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "transparent"}>
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
          ) : (
            <div style={{ padding: "32px", textAlign: "center", color: "#94a3b8" }}>
              <ChevronDown size={32} color="#e2e8f0" style={{ margin: "0 auto 8px" }} />
              <p style={{ fontSize: "14px", fontWeight: 600 }}>Select a section to view students</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

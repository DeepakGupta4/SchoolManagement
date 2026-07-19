"use client";
import React, { useState } from "react";
import { Save, Search, CheckCircle } from "lucide-react";

const subjects = ["Mathematics", "Physics", "Chemistry", "English", "Biology", "History"];
const classes  = ["6-A", "7-A", "8-A", "9-A", "9-B", "10-A", "10-B", "11-A", "12-A"];
const exams    = ["Unit Test 1", "Mid-Term Exam", "Final Exam"];

const studentsData = [
  { id: "S001", name: "Aarav Sharma",  roll: 1  },
  { id: "S002", name: "Priya Patel",   roll: 2  },
  { id: "S003", name: "Rohan Verma",   roll: 3  },
  { id: "S004", name: "Sneha Gupta",   roll: 4  },
  { id: "S005", name: "Karan Singh",   roll: 5  },
  { id: "S006", name: "Ananya Joshi",  roll: 6  },
  { id: "S007", name: "Vikram Nair",   roll: 7  },
  { id: "S008", name: "Meera Iyer",    roll: 8  },
  { id: "S009", name: "Arjun Reddy",   roll: 9  },
  { id: "S010", name: "Pooja Mishra",  roll: 10 },
];

export default function MarkEntryPage() {
  const [selectedClass,   setSelectedClass]   = useState("10-A");
  const [selectedSubject, setSelectedSubject] = useState("Mathematics");
  const [selectedExam,    setSelectedExam]    = useState("Mid-Term Exam");
  const [totalMarks,      setTotalMarks]      = useState(100);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = studentsData.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  const handleMark = (id: string, val: string) => {
    const num = parseInt(val);
    if (val === "" || (!isNaN(num) && num >= 0 && num <= totalMarks)) {
      setMarks(prev => ({ ...prev, [id]: val }));
      setSaved(false);
    }
  };

  const getGrade = (mark: number, total: number) => {
    const pct = (mark / total) * 100;
    if (pct >= 90) return { grade: "A+", color: "#16a34a", bg: "#f0fdf4" };
    if (pct >= 80) return { grade: "A",  color: "#2563eb", bg: "#eff6ff" };
    if (pct >= 70) return { grade: "B+", color: "#7c3aed", bg: "#f5f3ff" };
    if (pct >= 60) return { grade: "B",  color: "#d97706", bg: "#fffbeb" };
    if (pct >= 50) return { grade: "C",  color: "#ea580c", bg: "#fff7ed" };
    return { grade: "F", color: "#e11d48", bg: "#fff1f2" };
  };

  const entered   = Object.values(marks).filter(v => v !== "").length;
  const avgMarks  = entered > 0 ? Math.round(Object.values(marks).filter(v => v !== "").reduce((a, b) => a + parseInt(b), 0) / entered) : 0;
  const passCount = Object.values(marks).filter(v => v !== "" && (parseInt(v) / totalMarks) * 100 >= 33).length;

  return (
    <div style={{ maxWidth: "1600px", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <p style={{ fontSize: "12px", color: "#6366f1", fontWeight: 600, marginBottom: "4px" }}>Examinations</p>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>Mark Entry</h1>
          <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>Enter and manage student marks</p>
        </div>
        <button onClick={() => setSaved(true)} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 18px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", fontSize: "13px", fontWeight: 600, color: "#fff", cursor: "pointer", boxShadow: "0 4px 12px rgba(99,102,241,0.35)" }}>
          <Save size={14} /> Save Marks
        </button>
      </div>

      {/* Filters */}
      <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", display: "flex", gap: "16px", flexWrap: "wrap", alignItems: "flex-end" }}>
        {[
          { label: "Class",    value: selectedClass,   setter: setSelectedClass,   options: classes   },
          { label: "Subject",  value: selectedSubject, setter: setSelectedSubject, options: subjects  },
          { label: "Exam",     value: selectedExam,    setter: setSelectedExam,    options: exams     },
        ].map(f => (
          <div key={f.label}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>{f.label}</p>
            <select value={f.value} onChange={e => f.setter(e.target.value)}
              style={{ padding: "9px 14px", fontSize: "13px", fontWeight: 600, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", cursor: "pointer", minWidth: "140px" }}>
              {f.options.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
        ))}
        <div>
          <p style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>Total Marks</p>
          <input type="number" value={totalMarks} onChange={e => setTotalMarks(parseInt(e.target.value) || 100)}
            style={{ padding: "9px 14px", fontSize: "13px", fontWeight: 600, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", width: "100px" }} />
        </div>
      </div>

      {/* Live Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }}>
        {[
          { label: "Total Students", value: studentsData.length, color: "#6366f1", bg: "#eff6ff" },
          { label: "Marks Entered",  value: `${entered}/${studentsData.length}`, color: "#2563eb", bg: "#dbeafe" },
          { label: "Class Average",  value: entered > 0 ? `${avgMarks}/${totalMarks}` : "—", color: "#d97706", bg: "#fffbeb" },
          { label: "Pass Count",     value: entered > 0 ? passCount : "—", color: "#16a34a", bg: "#f0fdf4" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <p style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>{s.label}</p>
            <p style={{ fontSize: "24px", fontWeight: 800, color: s.color, marginTop: "4px", letterSpacing: "-0.5px" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Mark Entry Table */}
      <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f8fafc", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>{selectedClass} — {selectedSubject} — {selectedExam}</p>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {saved && (
              <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", color: "#16a34a", fontWeight: 600 }}>
                <CheckCircle size={14} /> Marks saved!
              </div>
            )}
            <div style={{ position: "relative" }}>
              <Search size={14} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search student..."
                style={{ paddingLeft: "36px", paddingRight: "16px", paddingTop: "8px", paddingBottom: "8px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", fontFamily: "inherit", width: "200px" }} />
            </div>
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#fafafa", borderBottom: "1px solid #f1f5f9" }}>
              {["Roll", "Student", `Marks (out of ${totalMarks})`, "Percentage", "Grade", "Remarks"].map(h => (
                <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => {
              const markVal = marks[s.id] ?? "";
              const num     = parseInt(markVal);
              const pct     = markVal !== "" && !isNaN(num) ? Math.round((num / totalMarks) * 100) : null;
              const grade   = pct !== null ? getGrade(num, totalMarks) : null;
              const pctColor = pct === null ? "#94a3b8" : pct >= 75 ? "#16a34a" : pct >= 50 ? "#d97706" : "#e11d48";

              return (
                <tr key={s.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f8fafc" : "none" }}
                  onMouseEnter={ev => (ev.currentTarget as HTMLTableRowElement).style.background = "#fafafa"}
                  onMouseLeave={ev => (ev.currentTarget as HTMLTableRowElement).style.background = "transparent"}>

                  <td style={{ padding: "12px 20px", fontSize: "13px", color: "#64748b", fontWeight: 600 }}>#{String(s.roll).padStart(2, "0")}</td>

                  <td style={{ padding: "12px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "13px", fontWeight: 700, flexShrink: 0 }}>{s.name.charAt(0)}</div>
                      <div>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{s.name}</p>
                        <p style={{ fontSize: "11px", color: "#94a3b8" }}>{s.id}</p>
                      </div>
                    </div>
                  </td>

                  <td style={{ padding: "12px 20px" }}>
                    <input
                      type="number" value={markVal} onChange={e => handleMark(s.id, e.target.value)}
                      placeholder={`0 - ${totalMarks}`}
                      style={{ width: "100px", padding: "8px 12px", fontSize: "14px", fontWeight: 700, background: markVal !== "" ? (pct! >= 33 ? "#f0fdf4" : "#fff1f2") : "#f8fafc", border: `1px solid ${markVal !== "" ? (pct! >= 33 ? "#bbf7d0" : "#fecdd3") : "#e2e8f0"}`, borderRadius: "10px", outline: "none", color: "#0f172a", textAlign: "center", fontFamily: "inherit" }}
                      onFocus={e => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
                      onBlur={e  => { e.target.style.boxShadow = "none"; }}
                    />
                  </td>

                  <td style={{ padding: "12px 20px" }}>
                    {pct !== null ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "60px", height: "5px", background: "#f1f5f9", borderRadius: "99px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: pctColor, borderRadius: "99px" }} />
                        </div>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: pctColor }}>{pct}%</span>
                      </div>
                    ) : <span style={{ fontSize: "12px", color: "#cbd5e1" }}>—</span>}
                  </td>

                  <td style={{ padding: "12px 20px" }}>
                    {grade ? (
                      <span style={{ fontSize: "13px", fontWeight: 800, padding: "4px 12px", borderRadius: "20px", background: grade.bg, color: grade.color }}>{grade.grade}</span>
                    ) : <span style={{ fontSize: "12px", color: "#cbd5e1" }}>—</span>}
                  </td>

                  <td style={{ padding: "12px 20px" }}>
                    {pct !== null && (
                      <span style={{ fontSize: "12px", color: pct >= 75 ? "#16a34a" : pct >= 33 ? "#d97706" : "#e11d48", fontWeight: 600 }}>
                        {pct >= 75 ? "Excellent" : pct >= 60 ? "Good" : pct >= 33 ? "Average" : "Fail"}
                      </span>
                    )}
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

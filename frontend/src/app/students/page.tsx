"use client";
import React, { useState } from "react";
import { Search, Plus, Filter, Download, Eye, Edit, Trash2, GraduationCap, Phone } from "lucide-react";

const students = [
  { id: "S001", name: "Aarav Sharma",  class: "10-A", roll: 1,  gender: "Male",   fees: "Paid",    attendance: 94, phone: "98765XXXXX", status: "active"   },
  { id: "S002", name: "Priya Patel",   class: "10-A", roll: 2,  gender: "Female", fees: "Paid",    attendance: 98, phone: "87654XXXXX", status: "active"   },
  { id: "S003", name: "Rohan Verma",   class: "9-B",  roll: 5,  gender: "Male",   fees: "Pending", attendance: 72, phone: "76543XXXXX", status: "active"   },
  { id: "S004", name: "Sneha Gupta",   class: "11-C", roll: 12, gender: "Female", fees: "Paid",    attendance: 88, phone: "65432XXXXX", status: "active"   },
  { id: "S005", name: "Karan Singh",   class: "8-A",  roll: 3,  gender: "Male",   fees: "Overdue", attendance: 65, phone: "54321XXXXX", status: "inactive" },
  { id: "S006", name: "Ananya Joshi",  class: "12-B", roll: 8,  gender: "Female", fees: "Paid",    attendance: 96, phone: "43210XXXXX", status: "active"   },
  { id: "S007", name: "Vikram Nair",   class: "7-A",  roll: 15, gender: "Male",   fees: "Pending", attendance: 80, phone: "32109XXXXX", status: "active"   },
  { id: "S008", name: "Meera Iyer",    class: "6-B",  roll: 7,  gender: "Female", fees: "Paid",    attendance: 91, phone: "21098XXXXX", status: "active"   },
  { id: "S009", name: "Arjun Reddy",   class: "9-A",  roll: 4,  gender: "Male",   fees: "Paid",    attendance: 87, phone: "11987XXXXX", status: "active"   },
  { id: "S010", name: "Pooja Mishra",  class: "10-B", roll: 9,  gender: "Female", fees: "Overdue", attendance: 60, phone: "10876XXXXX", status: "inactive" },
];

const feeStyles: Record<string, { bg: string; color: string }> = {
  Paid:    { bg: "#f0fdf4", color: "#16a34a" },
  Pending: { bg: "#fffbeb", color: "#d97706" },
  Overdue: { bg: "#fff1f2", color: "#e11d48" },
};

const avatarGradients = [
  "linear-gradient(135deg,#6366f1,#8b5cf6)",
  "linear-gradient(135deg,#10b981,#059669)",
  "linear-gradient(135deg,#f59e0b,#d97706)",
  "linear-gradient(135deg,#f43f5e,#e11d48)",
  "linear-gradient(135deg,#06b6d4,#0891b2)",
  "linear-gradient(135deg,#8b5cf6,#7c3aed)",
];

export default function StudentsPage() {
  const [search, setSearch]           = useState("");
  const [classFilter, setClassFilter] = useState("All");
  const [activePage, setActivePage]   = useState(1);

  const filtered = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.id.includes(search);
    const matchClass  = classFilter === "All" || s.class.startsWith(classFilter);
    return matchSearch && matchClass;
  });

  return (
    <div style={{ maxWidth: "1600px", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>Students</h1>
          <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>Manage all student records & profiles</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#fff", fontSize: "13px", fontWeight: 600, color: "#334155", cursor: "pointer" }}>
            <Download size={14} /> Export
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 18px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", fontSize: "13px", fontWeight: 600, color: "#fff", cursor: "pointer", boxShadow: "0 4px 12px rgba(99,102,241,0.35)" }}>
            <Plus size={14} /> Add Student
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }}>
        {[
          { label: "Total Students",  value: "1,240", color: "#6366f1", bg: "#eff6ff",  icon: "👨‍🎓" },
          { label: "Active",          value: "1,198", color: "#10b981", bg: "#f0fdf4",  icon: "✅" },
          { label: "Fee Defaulters",  value: "42",    color: "#e11d48", bg: "#fff1f2",  icon: "⚠️" },
          { label: "Avg Attendance",  value: "91.4%", color: "#d97706", bg: "#fffbeb",  icon: "📊" },
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

      {/* ── Table Card ── */}
      <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>

        {/* Filters bar */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f8fafc", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: 1, maxWidth: "320px" }}>
            <Search size={14} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or ID..."
              style={{ width: "100%", paddingLeft: "36px", paddingRight: "16px", paddingTop: "9px", paddingBottom: "9px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", fontFamily: "inherit" }}
              onFocus={e => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
              onBlur={e  => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          {/* Class filter */}
          <select
            value={classFilter}
            onChange={e => setClassFilter(e.target.value)}
            style={{ padding: "9px 14px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", cursor: "pointer", fontFamily: "inherit" }}
          >
            {["All", "6", "7", "8", "9", "10", "11", "12"].map(c => (
              <option key={c} value={c}>{c === "All" ? "All Classes" : `Class ${c}`}</option>
            ))}
          </select>

          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 14px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: "13px", color: "#64748b", cursor: "pointer", fontWeight: 500 }}>
            <Filter size={13} /> More Filters
          </button>

          <p style={{ marginLeft: "auto", fontSize: "12px", color: "#94a3b8" }}>
            {filtered.length} students found
          </p>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#fafafa", borderBottom: "1px solid #f1f5f9" }}>
                {["Student", "Class", "Roll No", "Gender", "Attendance", "Fee Status", "Contact", "Status", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => {
                const fs = feeStyles[s.fees];
                const grad = avatarGradients[i % avatarGradients.length];
                const attColor = s.attendance >= 90 ? "#10b981" : s.attendance >= 75 ? "#f59e0b" : "#ef4444";

                return (
                  <tr
                    key={s.id}
                    style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f8fafc" : "none", transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "#fafafa"}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                  >
                    {/* Student */}
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: grad, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "15px", fontWeight: 700, flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.12)" }}>
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{s.name}</p>
                          <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "1px" }}>{s.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Class */}
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px", background: "#eff6ff", color: "#2563eb" }}>
                        Class {s.class}
                      </span>
                    </td>

                    {/* Roll */}
                    <td style={{ padding: "14px 20px", fontSize: "13px", color: "#64748b", fontWeight: 500 }}>
                      #{String(s.roll).padStart(2, "0")}
                    </td>

                    {/* Gender */}
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px", background: s.gender === "Male" ? "#eff6ff" : "#fdf4ff", color: s.gender === "Male" ? "#2563eb" : "#9333ea" }}>
                        {s.gender}
                      </span>
                    </td>

                    {/* Attendance */}
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "64px", height: "6px", background: "#f1f5f9", borderRadius: "99px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${s.attendance}%`, background: attColor, borderRadius: "99px", transition: "width 0.4s ease" }} />
                        </div>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: attColor }}>{s.attendance}%</span>
                      </div>
                    </td>

                    {/* Fee Status */}
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px", background: fs.bg, color: fs.color }}>
                        {s.fees}
                      </span>
                    </td>

                    {/* Contact */}
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "#64748b" }}>
                        <Phone size={11} color="#94a3b8" />
                        {s.phone}
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: s.status === "active" ? "#22c55e" : "#94a3b8", display: "inline-block" }} />
                        <span style={{ fontSize: "12px", fontWeight: 600, color: s.status === "active" ? "#16a34a" : "#64748b", textTransform: "capitalize" }}>
                          {s.status}
                        </span>
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
                          <button
                            key={idx}
                            style={{ padding: "7px", borderRadius: "9px", border: "none", background: "transparent", cursor: "pointer", color: "#94a3b8", transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center" }}
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
            <div style={{ textAlign: "center", padding: "48px", color: "#94a3b8", fontSize: "14px" }}>
              <GraduationCap size={40} color="#e2e8f0" style={{ margin: "0 auto 12px" }} />
              <p style={{ fontWeight: 600 }}>No students found</p>
              <p style={{ fontSize: "12px", marginTop: "4px" }}>Try adjusting your search or filters</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid #f8fafc", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: "12px", color: "#94a3b8" }}>
            Showing <strong style={{ color: "#334155" }}>{filtered.length}</strong> of <strong style={{ color: "#334155" }}>1,240</strong> students
          </p>
          <div style={{ display: "flex", gap: "4px" }}>
            {[1, 2, 3, 4, "...", 12].map((p, i) => (
              <button
                key={i}
                onClick={() => typeof p === "number" && setActivePage(p)}
                style={{
                  width: "32px", height: "32px", borderRadius: "9px", border: "none",
                  cursor: "pointer", fontSize: "12px", fontWeight: 600,
                  background: activePage === p ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "#f8fafc",
                  color: activePage === p ? "#fff" : "#64748b",
                  boxShadow: activePage === p ? "0 2px 8px rgba(99,102,241,0.3)" : "none",
                  transition: "all 0.15s",
                }}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";
import React, { useState } from "react";
import { Search, Plus, Filter, Download, Eye, Edit, Trash2, Phone, Mail, Star } from "lucide-react";

const teachers = [
  { id: "T001", name: "Dr. Priya Sharma",    subject: "Mathematics",       class: "10,11,12", exp: 12, phone: "98765XXXXX", email: "priya@school.edu",   status: "active",   rating: 4.8, type: "Full-time" },
  { id: "T002", name: "Mr. Rahul Verma",     subject: "Physics",           class: "11,12",    exp: 8,  phone: "87654XXXXX", email: "rahul@school.edu",   status: "active",   rating: 4.5, type: "Full-time" },
  { id: "T003", name: "Ms. Anita Patel",     subject: "English",           class: "6,7,8",    exp: 6,  phone: "76543XXXXX", email: "anita@school.edu",   status: "active",   rating: 4.7, type: "Full-time" },
  { id: "T004", name: "Mr. Suresh Kumar",    subject: "History",           class: "9,10",     exp: 15, phone: "65432XXXXX", email: "suresh@school.edu",  status: "on-leave", rating: 4.3, type: "Full-time" },
  { id: "T005", name: "Ms. Kavita Singh",    subject: "Chemistry",         class: "11,12",    exp: 9,  phone: "54321XXXXX", email: "kavita@school.edu",  status: "active",   rating: 4.6, type: "Full-time" },
  { id: "T006", name: "Mr. Amit Joshi",      subject: "Computer Science",  class: "8,9,10",   exp: 5,  phone: "43210XXXXX", email: "amit@school.edu",    status: "active",   rating: 4.9, type: "Part-time" },
  { id: "T007", name: "Ms. Deepa Nair",      subject: "Biology",           class: "11,12",    exp: 11, phone: "32109XXXXX", email: "deepa@school.edu",   status: "active",   rating: 4.4, type: "Full-time" },
  { id: "T008", name: "Mr. Vikram Gupta",    subject: "Physical Education",class: "6-12",     exp: 7,  phone: "21098XXXXX", email: "vikram@school.edu",  status: "active",   rating: 4.2, type: "Full-time" },
];

const subjectColors: Record<string, { bg: string; color: string }> = {
  Mathematics:        { bg: "#eff6ff", color: "#2563eb" },
  Physics:            { bg: "#f5f3ff", color: "#7c3aed" },
  English:            { bg: "#f0fdf4", color: "#16a34a" },
  History:            { bg: "#fffbeb", color: "#d97706" },
  Chemistry:          { bg: "#fdf4ff", color: "#9333ea" },
  "Computer Science": { bg: "#ecfeff", color: "#0891b2" },
  Biology:            { bg: "#f0fdf4", color: "#059669" },
  "Physical Education":{ bg: "#fff1f2", color: "#e11d48" },
};

export default function TeachersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filtered = teachers.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.subject.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div style={{ maxWidth: "1600px", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>Teachers</h1>
          <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>Manage teaching staff & assignments</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#fff", fontSize: "13px", fontWeight: 600, color: "#334155", cursor: "pointer" }}>
            <Download size={14} /> Export
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", fontSize: "13px", fontWeight: 600, color: "#fff", cursor: "pointer", boxShadow: "0 4px 12px rgba(99,102,241,0.3)" }}>
            <Plus size={14} /> Add Teacher
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }}>
        {[
          { label: "Total Teachers", value: "86", color: "#6366f1", bg: "#eff6ff" },
          { label: "Full-time", value: "72", color: "#10b981", bg: "#f0fdf4" },
          { label: "Part-time", value: "14", color: "#f59e0b", bg: "#fffbeb" },
          { label: "On Leave", value: "3", color: "#ef4444", bg: "#fff1f2" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <p style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>{s.label}</p>
            <p style={{ fontSize: "28px", fontWeight: 800, color: s.color, marginTop: "6px", letterSpacing: "-0.5px" }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>

        {/* Filters */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f8fafc", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ position: "relative", flex: 1, maxWidth: "320px" }}>
            <Search size={14} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or subject..."
              style={{ width: "100%", paddingLeft: "36px", paddingRight: "16px", paddingTop: "9px", paddingBottom: "9px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", fontFamily: "inherit" }} />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: "9px 14px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", cursor: "pointer" }}>
            <option>All</option>
            <option value="active">Active</option>
            <option value="on-leave">On Leave</option>
          </select>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 14px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: "13px", color: "#64748b", cursor: "pointer" }}>
            <Filter size={13} /> Filters
          </button>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                {["Teacher", "Subject", "Classes", "Experience", "Rating", "Contact", "Type", "Status", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((t, i) => {
                const sc = subjectColors[t.subject] ?? { bg: "#f8fafc", color: "#64748b" };
                return (
                  <tr key={t.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f8fafc" : "none", transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "#fafafa"}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}>

                    {/* Teacher */}
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "38px", height: "38px", borderRadius: "12px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "14px", fontWeight: 700, flexShrink: 0 }}>
                          {t.name.charAt(0)}
                        </div>
                        <div>
                          <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{t.name}</p>
                          <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "1px" }}>{t.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Subject */}
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px", background: sc.bg, color: sc.color }}>{t.subject}</span>
                    </td>

                    {/* Classes */}
                    <td style={{ padding: "14px 20px", fontSize: "13px", color: "#64748b" }}>Class {t.class}</td>

                    {/* Experience */}
                    <td style={{ padding: "14px 20px", fontSize: "13px", color: "#64748b" }}>{t.exp} yrs</td>

                    {/* Rating */}
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Star size={13} color="#f59e0b" fill="#f59e0b" />
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{t.rating}</span>
                      </div>
                    </td>

                    {/* Contact */}
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "#64748b" }}>
                          <Phone size={11} color="#94a3b8" />{t.phone}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "#64748b" }}>
                          <Mail size={11} color="#94a3b8" />{t.email}
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px", background: t.type === "Full-time" ? "#f0fdf4" : "#fffbeb", color: t.type === "Full-time" ? "#16a34a" : "#d97706" }}>{t.type}</span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: t.status === "active" ? "#22c55e" : "#f59e0b", display: "inline-block" }} />
                        <span style={{ fontSize: "12px", fontWeight: 600, color: t.status === "active" ? "#16a34a" : "#d97706", textTransform: "capitalize" }}>{t.status}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", gap: "4px" }}>
                        {[Eye, Edit, Trash2].map((Icon, idx) => (
                          <button key={idx} style={{ padding: "6px", borderRadius: "8px", border: "none", background: "transparent", cursor: "pointer", color: idx === 2 ? "#ef4444" : "#64748b", transition: "background 0.15s" }}
                            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = idx === 2 ? "#fff1f2" : "#f8fafc"}
                            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "transparent"}>
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

        {/* Pagination */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid #f8fafc", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: "12px", color: "#94a3b8" }}>Showing {filtered.length} of {teachers.length} teachers</p>
          <div style={{ display: "flex", gap: "4px" }}>
            {[1, 2, 3].map(p => (
              <button key={p} style={{ width: "30px", height: "30px", borderRadius: "8px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 600, background: p === 1 ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "#f8fafc", color: p === 1 ? "#fff" : "#64748b" }}>{p}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

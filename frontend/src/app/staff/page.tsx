"use client";
import React, { useState } from "react";
import { Search, Plus, Download, Eye, Edit, Trash2, Phone, Mail, Users, Briefcase, Clock, UserCheck } from "lucide-react";

const staffList = [
  { id: "ST001", name: "Mr. Rajesh Sharma",   role: "Principal",         dept: "Administration", type: "Full-time", status: "active",   phone: "98765-11111", email: "rajesh@school.edu",   join: "Jan 2015", salary: "₹85,000" },
  { id: "ST002", name: "Ms. Sunita Verma",    role: "Vice Principal",    dept: "Administration", type: "Full-time", status: "active",   phone: "98765-22222", email: "sunita@school.edu",   join: "Mar 2017", salary: "₹72,000" },
  { id: "ST003", name: "Mr. Anil Kumar",      role: "Accountant",        dept: "Finance",        type: "Full-time", status: "active",   phone: "98765-33333", email: "anil@school.edu",     join: "Jun 2018", salary: "₹45,000" },
  { id: "ST004", name: "Ms. Pooja Mehta",     role: "HR Manager",        dept: "HR",             type: "Full-time", status: "active",   phone: "98765-44444", email: "pooja@school.edu",    join: "Aug 2019", salary: "₹50,000" },
  { id: "ST005", name: "Mr. Suresh Nair",     role: "IT Administrator",  dept: "IT",             type: "Full-time", status: "active",   phone: "98765-55555", email: "suresh@school.edu",   join: "Feb 2020", salary: "₹55,000" },
  { id: "ST006", name: "Ms. Kavita Joshi",    role: "Librarian",         dept: "Library",        type: "Full-time", status: "on-leave", phone: "98765-66666", email: "kavita@school.edu",   join: "Apr 2016", salary: "₹38,000" },
  { id: "ST007", name: "Mr. Deepak Singh",    role: "Security Head",     dept: "Security",       type: "Full-time", status: "active",   phone: "98765-77777", email: "deepak@school.edu",   join: "Jan 2018", salary: "₹32,000" },
  { id: "ST008", name: "Ms. Anita Gupta",     role: "Receptionist",      dept: "Administration", type: "Full-time", status: "active",   phone: "98765-88888", email: "anita@school.edu",    join: "Sep 2021", salary: "₹28,000" },
  { id: "ST009", name: "Mr. Ramesh Patel",    role: "Transport Manager", dept: "Transport",      type: "Full-time", status: "active",   phone: "98765-99999", email: "ramesh@school.edu",   join: "Jul 2017", salary: "₹42,000" },
  { id: "ST010", name: "Ms. Nisha Reddy",     role: "Nurse",             dept: "Health",         type: "Part-time", status: "active",   phone: "98765-10101", email: "nisha@school.edu",    join: "Mar 2022", salary: "₹25,000" },
  { id: "ST011", name: "Mr. Vinod Tiwari",    role: "Canteen Manager",   dept: "Canteen",        type: "Full-time", status: "active",   phone: "98765-11211", email: "vinod@school.edu",    join: "Nov 2019", salary: "₹30,000" },
  { id: "ST012", name: "Ms. Rekha Iyer",      role: "Counselor",         dept: "HR",             type: "Part-time", status: "inactive", phone: "98765-12121", email: "rekha@school.edu",    join: "Jan 2023", salary: "₹22,000" },
];

const deptColors: Record<string, { bg: string; color: string }> = {
  Administration: { bg: "#eff6ff", color: "#2563eb" },
  Finance:        { bg: "#f0fdf4", color: "#16a34a" },
  HR:             { bg: "#fdf4ff", color: "#9333ea" },
  IT:             { bg: "#ecfeff", color: "#0891b2" },
  Library:        { bg: "#fffbeb", color: "#d97706" },
  Security:       { bg: "#fff1f2", color: "#e11d48" },
  Transport:      { bg: "#f5f3ff", color: "#7c3aed" },
  Health:         { bg: "#fdf2f8", color: "#db2777" },
  Canteen:        { bg: "#fff7ed", color: "#ea580c" },
};

const statusStyle: Record<string, { dot: string; color: string; label: string }> = {
  active:   { dot: "#22c55e", color: "#16a34a", label: "Active" },
  "on-leave": { dot: "#f59e0b", color: "#d97706", label: "On Leave" },
  inactive: { dot: "#94a3b8", color: "#64748b", label: "Inactive" },
};

const departments = ["All", ...Array.from(new Set(staffList.map(s => s.dept)))];

export default function StaffPage() {
  const [search, setSearch]       = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const filtered = staffList.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
                        s.role.toLowerCase().includes(search.toLowerCase()) ||
                        s.id.toLowerCase().includes(search.toLowerCase());
    const matchDept   = deptFilter === "All" || s.dept === deptFilter;
    const matchType   = typeFilter === "All" || s.type === typeFilter;
    const matchStatus = statusFilter === "All" || s.status === statusFilter;
    return matchSearch && matchDept && matchType && matchStatus;
  });

  const totalActive   = staffList.filter(s => s.status === "active").length;
  const totalOnLeave  = staffList.filter(s => s.status === "on-leave").length;
  const totalPartTime = staffList.filter(s => s.type === "Part-time").length;

  return (
    <div style={{ maxWidth: "1600px", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>Staff Management</h1>
          <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>Manage non-teaching staff across all departments</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#fff", fontSize: "13px", fontWeight: 600, color: "#334155", cursor: "pointer" }}>
            <Download size={14} /> Export
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 18px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#0891b2,#0e7490)", fontSize: "13px", fontWeight: 600, color: "#fff", cursor: "pointer", boxShadow: "0 4px 12px rgba(8,145,178,0.35)" }}>
            <Plus size={14} /> Add Staff
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }}>
        {[
          { label: "Total Staff",   value: staffList.length, icon: <Users size={22} />,     color: "#0891b2", bg: "#ecfeff" },
          { label: "Active",        value: totalActive,      icon: <UserCheck size={22} />, color: "#16a34a", bg: "#f0fdf4" },
          { label: "On Leave",      value: totalOnLeave,     icon: <Clock size={22} />,     color: "#d97706", bg: "#fffbeb" },
          { label: "Part-time",     value: totalPartTime,    icon: <Briefcase size={22} />, color: "#7c3aed", bg: "#f5f3ff" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", color: s.color, flexShrink: 0 }}>{s.icon}</div>
            <div>
              <p style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>{s.label}</p>
              <p style={{ fontSize: "28px", fontWeight: 800, color: s.color, lineHeight: 1.1, letterSpacing: "-0.5px" }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Department Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "12px" }}>
        {Object.entries(
          staffList.reduce<Record<string, number>>((acc, s) => { acc[s.dept] = (acc[s.dept] || 0) + 1; return acc; }, {})
        ).map(([dept, count]) => {
          const dc = deptColors[dept] ?? { bg: "#f8fafc", color: "#64748b" };
          return (
            <div key={dept} onClick={() => setDeptFilter(deptFilter === dept ? "All" : dept)}
              style={{ background: deptFilter === dept ? dc.bg : "#fff", borderRadius: "14px", border: `1.5px solid ${deptFilter === dept ? dc.color + "40" : "#f1f5f9"}`, padding: "14px 16px", cursor: "pointer", transition: "all 0.15s", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <p style={{ fontSize: "11px", fontWeight: 700, color: dc.color, textTransform: "uppercase", letterSpacing: "0.05em" }}>{dept}</p>
              <p style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", marginTop: "4px" }}>{count}</p>
              <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>members</p>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>

        {/* Toolbar */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f8fafc", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>

          {/* Search */}
          <div style={{ position: "relative", flex: 1, maxWidth: "300px" }}>
            <Search size={14} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, role or ID..."
              style={{ width: "100%", paddingLeft: "36px", paddingRight: "16px", paddingTop: "9px", paddingBottom: "9px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", fontFamily: "inherit" }}
              onFocus={e => { e.target.style.borderColor = "#0891b2"; e.target.style.boxShadow = "0 0 0 3px rgba(8,145,178,0.1)"; }}
              onBlur={e  => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
            style={{ padding: "9px 14px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", cursor: "pointer" }}>
            {departments.map(d => <option key={d}>{d}</option>)}
          </select>

          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
            style={{ padding: "9px 14px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", cursor: "pointer" }}>
            <option value="All">All Types</option>
            <option>Full-time</option>
            <option>Part-time</option>
          </select>

          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: "9px 14px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", cursor: "pointer" }}>
            <option value="All">All Status</option>
            <option value="active">Active</option>
            <option value="on-leave">On Leave</option>
            <option value="inactive">Inactive</option>
          </select>

          <p style={{ marginLeft: "auto", fontSize: "12px", color: "#94a3b8" }}>{filtered.length} staff members</p>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#fafafa", borderBottom: "1px solid #f1f5f9" }}>
                {["Staff Member", "Role", "Department", "Type", "Salary", "Join Date", "Contact", "Status", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => {
                const dc = deptColors[s.dept] ?? { bg: "#f8fafc", color: "#64748b" };
                const ss = statusStyle[s.status];
                return (
                  <tr key={s.id}
                    style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f8fafc" : "none", transition: "background 0.15s" }}
                    onMouseEnter={ev => (ev.currentTarget as HTMLTableRowElement).style.background = "#fafafa"}
                    onMouseLeave={ev => (ev.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                  >
                    {/* Staff Member */}
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "38px", height: "38px", borderRadius: "12px", background: "linear-gradient(135deg,#0891b2,#0e7490)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "14px", fontWeight: 700, flexShrink: 0 }}>
                          {s.name.charAt(0)}
                        </div>
                        <div>
                          <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{s.name}</p>
                          <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "1px" }}>{s.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td style={{ padding: "14px 20px", fontSize: "13px", color: "#334155", fontWeight: 500 }}>{s.role}</td>

                    {/* Department */}
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px", background: dc.bg, color: dc.color }}>{s.dept}</span>
                    </td>

                    {/* Type */}
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px", background: s.type === "Full-time" ? "#f0fdf4" : "#fffbeb", color: s.type === "Full-time" ? "#16a34a" : "#d97706" }}>{s.type}</span>
                    </td>

                    {/* Salary */}
                    <td style={{ padding: "14px 20px", fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{s.salary}</td>

                    {/* Join Date */}
                    <td style={{ padding: "14px 20px", fontSize: "12px", color: "#64748b" }}>{s.join}</td>

                    {/* Contact */}
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "#64748b" }}>
                          <Phone size={11} color="#94a3b8" />{s.phone}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "#64748b" }}>
                          <Mail size={11} color="#94a3b8" />{s.email}
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: ss.dot, display: "inline-block" }} />
                        <span style={{ fontSize: "12px", fontWeight: 600, color: ss.color }}>{ss.label}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", gap: "4px" }}>
                        {[{ Icon: Eye, hoverBg: "#eff6ff", color: "#2563eb" }, { Icon: Edit, hoverBg: "#f0fdf4", color: "#16a34a" }, { Icon: Trash2, hoverBg: "#fff1f2", color: "#e11d48" }].map(({ Icon, hoverBg, color }, idx) => (
                          <button key={idx}
                            style={{ padding: "7px", borderRadius: "9px", border: "none", background: "transparent", cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center", transition: "all 0.15s" }}
                            onMouseEnter={ev => { (ev.currentTarget as HTMLButtonElement).style.background = hoverBg; (ev.currentTarget as HTMLButtonElement).style.color = color; }}
                            onMouseLeave={ev => { (ev.currentTarget as HTMLButtonElement).style.background = "transparent"; (ev.currentTarget as HTMLButtonElement).style.color = "#94a3b8"; }}
                          ><Icon size={14} /></button>
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
              <Users size={40} color="#e2e8f0" style={{ margin: "0 auto 12px" }} />
              <p style={{ fontSize: "14px", fontWeight: 600 }}>No staff found</p>
              <p style={{ fontSize: "12px", marginTop: "4px" }}>Try adjusting your filters</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid #f8fafc", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: "12px", color: "#94a3b8" }}>
            Showing <strong style={{ color: "#334155" }}>{filtered.length}</strong> of <strong style={{ color: "#334155" }}>{staffList.length}</strong> staff members
          </p>
          <div style={{ display: "flex", gap: "16px" }}>
            {["active", "on-leave", "inactive"].map(st => {
              const ss = statusStyle[st];
              const count = filtered.filter(s => s.status === st).length;
              return (
                <div key={st} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: ss.dot, display: "inline-block" }} />
                  <span style={{ fontSize: "12px", color: "#64748b" }}>{ss.label}: <strong style={{ color: "#0f172a" }}>{count}</strong></span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

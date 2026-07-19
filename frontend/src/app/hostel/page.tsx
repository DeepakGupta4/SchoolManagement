"use client";
import React, { useState } from "react";
import { Search, Plus, Download, Edit, Trash2, Eye, Users, Home, CheckCircle, AlertCircle, Clock } from "lucide-react";

const hostels = [
  { id: "H001", name: "Boys Hostel A",   type: "Boys",  totalRooms: 30, occupied: 28, warden: "Mr. Ramesh Gupta",   contact: "98765-11111", floors: 3, amenities: ["WiFi", "Mess", "Gym", "Laundry"] },
  { id: "H002", name: "Boys Hostel B",   type: "Boys",  totalRooms: 25, occupied: 20, warden: "Mr. Suresh Sharma",  contact: "98765-22222", floors: 2, amenities: ["WiFi", "Mess", "Study Room"] },
  { id: "H003", name: "Girls Hostel A",  type: "Girls", totalRooms: 35, occupied: 34, warden: "Ms. Priya Verma",    contact: "98765-33333", floors: 4, amenities: ["WiFi", "Mess", "Gym", "Salon"] },
  { id: "H004", name: "Girls Hostel B",  type: "Girls", totalRooms: 20, occupied: 15, warden: "Ms. Anita Patel",    contact: "98765-44444", floors: 2, amenities: ["WiFi", "Mess", "Library"] },
];

const students = [
  { id: "S001", name: "Aarav Sharma",   class: "10-A", hostel: "Boys Hostel A",  room: "A-101", type: "Boys",  fees: "Paid",    joinDate: "Apr 2025", contact: "98765-XXXXX" },
  { id: "S002", name: "Rohan Verma",    class: "9-B",  hostel: "Boys Hostel A",  room: "A-102", type: "Boys",  fees: "Pending", joinDate: "Apr 2025", contact: "87654-XXXXX" },
  { id: "S003", name: "Karan Singh",    class: "11-A", hostel: "Boys Hostel B",  room: "B-201", type: "Boys",  fees: "Paid",    joinDate: "Apr 2025", contact: "76543-XXXXX" },
  { id: "S004", name: "Vikram Nair",    class: "8-A",  hostel: "Boys Hostel B",  room: "B-105", type: "Boys",  fees: "Overdue", joinDate: "Jan 2025", contact: "65432-XXXXX" },
  { id: "S005", name: "Priya Patel",    class: "10-A", hostel: "Girls Hostel A", room: "G-301", type: "Girls", fees: "Paid",    joinDate: "Apr 2025", contact: "54321-XXXXX" },
  { id: "S006", name: "Sneha Gupta",    class: "11-C", hostel: "Girls Hostel A", room: "G-302", type: "Girls", fees: "Paid",    joinDate: "Apr 2025", contact: "43210-XXXXX" },
  { id: "S007", name: "Ananya Joshi",   class: "12-B", hostel: "Girls Hostel A", room: "G-401", type: "Girls", fees: "Paid",    joinDate: "Jan 2025", contact: "32109-XXXXX" },
  { id: "S008", name: "Meera Iyer",     class: "6-B",  hostel: "Girls Hostel B", room: "GB-101",type: "Girls", fees: "Pending", joinDate: "Apr 2025", contact: "21098-XXXXX" },
  { id: "S009", name: "Arjun Reddy",    class: "9-A",  hostel: "Boys Hostel A",  room: "A-205", type: "Boys",  fees: "Paid",    joinDate: "Apr 2025", contact: "11987-XXXXX" },
  { id: "S010", name: "Pooja Mishra",   class: "10-B", hostel: "Girls Hostel B", room: "GB-202",type: "Girls", fees: "Overdue", joinDate: "Jan 2025", contact: "10876-XXXXX" },
];

const feeStyles: Record<string, { bg: string; color: string }> = {
  Paid:    { bg: "#f0fdf4", color: "#16a34a" },
  Pending: { bg: "#fffbeb", color: "#d97706" },
  Overdue: { bg: "#fff1f2", color: "#e11d48" },
};

const hostelColors = [
  { bg: "linear-gradient(135deg,#6366f1,#8b5cf6)", light: "#eff6ff", text: "#6366f1" },
  { bg: "linear-gradient(135deg,#06b6d4,#0891b2)", light: "#ecfeff", text: "#0891b2" },
  { bg: "linear-gradient(135deg,#f43f5e,#e11d48)", light: "#fff1f2", text: "#e11d48" },
  { bg: "linear-gradient(135deg,#10b981,#059669)", light: "#f0fdf4", text: "#16a34a" },
];

const tabs = ["All", "Boys", "Girls"];

export default function HostelPage() {
  const [search, setSearch]         = useState("");
  const [activeTab, setActiveTab]   = useState("All");
  const [hostelFilter, setHostelFilter] = useState("All");
  const [feeFilter, setFeeFilter]   = useState("All");

  const filtered = students.filter(s => {
    const matchTab    = activeTab === "All" || s.type === activeTab;
    const matchHostel = hostelFilter === "All" || s.hostel === hostelFilter;
    const matchFee    = feeFilter === "All" || s.fees === feeFilter;
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
                        s.id.toLowerCase().includes(search.toLowerCase()) ||
                        s.room.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchHostel && matchFee && matchSearch;
  });

  const totalOccupied  = hostels.reduce((s, h) => s + h.occupied, 0);
  const totalRooms     = hostels.reduce((s, h) => s + h.totalRooms, 0);
  const totalVacant    = totalRooms - totalOccupied;

  return (
    <div style={{ maxWidth: "1600px", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>Hostel</h1>
          <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>Manage hostel rooms, students and wardens</p>
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

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }}>
        {[
          { label: "Total Hostels",   value: hostels.length, icon: "🏠", color: "#6366f1", bg: "#eff6ff" },
          { label: "Total Rooms",     value: totalRooms,     icon: "🚪", color: "#8b5cf6", bg: "#f5f3ff" },
          { label: "Occupied",        value: totalOccupied,  icon: "👥", color: "#16a34a", bg: "#f0fdf4" },
          { label: "Vacant",          value: totalVacant,    icon: "🔓", color: "#d97706", bg: "#fffbeb" },
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

      {/* Hostel Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }}>
        {hostels.map((h, idx) => {
          const hc = hostelColors[idx % hostelColors.length];
          const occupancyPct = Math.round((h.occupied / h.totalRooms) * 100);
          const occColor = occupancyPct >= 90 ? "#e11d48" : occupancyPct >= 70 ? "#d97706" : "#16a34a";
          return (
            <div key={h.id} style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
              {/* Top gradient bar */}
              <div style={{ height: "5px", background: hc.bg }} />
              <div style={{ padding: "18px 20px" }}>
                {/* Icon + name */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                  <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: hc.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Home size={20} color="#fff" />
                  </div>
                  <div>
                    <p style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>{h.name}</p>
                    <span style={{ fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", background: h.type === "Boys" ? "#eff6ff" : "#fdf4ff", color: h.type === "Boys" ? "#2563eb" : "#9333ea" }}>
                      {h.type}
                    </span>
                  </div>
                </div>

                {/* Occupancy bar */}
                <div style={{ marginBottom: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>Occupancy</span>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: occColor }}>{h.occupied}/{h.totalRooms} ({occupancyPct}%)</span>
                  </div>
                  <div style={{ height: "6px", background: "#f1f5f9", borderRadius: "99px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${occupancyPct}%`, background: occColor, borderRadius: "99px" }} />
                  </div>
                </div>

                {/* Info */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>Warden</span>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#334155" }}>{h.warden}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>Floors</span>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#334155" }}>{h.floors}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "11px", color: "#94a3b8" }}>Contact</span>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "#334155" }}>{h.contact}</span>
                  </div>
                </div>

                {/* Amenities */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "5px" }}>
                  {h.amenities.map(a => (
                    <span key={a} style={{ fontSize: "10px", fontWeight: 600, padding: "3px 8px", borderRadius: "20px", background: hc.light, color: hc.text }}>{a}</span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Students Table */}
      <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>

        {/* Toolbar */}
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
              }}>{tab}</button>
            ))}
          </div>

          {/* Hostel filter */}
          <select value={hostelFilter} onChange={e => setHostelFilter(e.target.value)}
            style={{ padding: "9px 14px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", cursor: "pointer" }}>
            <option value="All">All Hostels</option>
            {hostels.map(h => <option key={h.id}>{h.name}</option>)}
          </select>

          {/* Fee filter */}
          <select value={feeFilter} onChange={e => setFeeFilter(e.target.value)}
            style={{ padding: "9px 14px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", cursor: "pointer" }}>
            <option value="All">All Fee Status</option>
            <option>Paid</option>
            <option>Pending</option>
            <option>Overdue</option>
          </select>

          {/* Search */}
          <div style={{ position: "relative", flex: 1, maxWidth: "300px" }}>
            <Search size={14} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, ID or room..."
              style={{ width: "100%", paddingLeft: "36px", paddingRight: "16px", paddingTop: "9px", paddingBottom: "9px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", fontFamily: "inherit" }}
              onFocus={e => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
              onBlur={e  => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          <p style={{ marginLeft: "auto", fontSize: "12px", color: "#94a3b8" }}>{filtered.length} students</p>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#fafafa", borderBottom: "1px solid #f1f5f9" }}>
                {["Student", "Class", "Hostel", "Room No.", "Type", "Join Date", "Contact", "Fee Status", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => {
                const fs = feeStyles[s.fees];
                const isBoy = s.type === "Boys";
                return (
                  <tr key={s.id}
                    style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f8fafc" : "none", transition: "background 0.15s" }}
                    onMouseEnter={ev => (ev.currentTarget as HTMLTableRowElement).style.background = "#fafafa"}
                    onMouseLeave={ev => (ev.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                  >
                    {/* Student */}
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "38px", height: "38px", borderRadius: "12px", background: isBoy ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "linear-gradient(135deg,#f43f5e,#e11d48)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "14px", fontWeight: 700, flexShrink: 0 }}>
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
                      <span style={{ fontSize: "12px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px", background: "#eff6ff", color: "#2563eb" }}>Class {s.class}</span>
                    </td>

                    {/* Hostel */}
                    <td style={{ padding: "14px 20px", fontSize: "13px", color: "#334155", whiteSpace: "nowrap" }}>{s.hostel}</td>

                    {/* Room */}
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: "#6366f1", background: "#eff6ff", padding: "4px 10px", borderRadius: "8px" }}>{s.room}</span>
                    </td>

                    {/* Type */}
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px", background: isBoy ? "#eff6ff" : "#fdf4ff", color: isBoy ? "#2563eb" : "#9333ea" }}>
                        {s.type}
                      </span>
                    </td>

                    {/* Join Date */}
                    <td style={{ padding: "14px 20px", fontSize: "12px", color: "#64748b" }}>{s.joinDate}</td>

                    {/* Contact */}
                    <td style={{ padding: "14px 20px", fontSize: "12px", color: "#64748b" }}>{s.contact}</td>

                    {/* Fee Status */}
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, padding: "5px 10px", borderRadius: "20px", background: fs.bg, color: fs.color }}>{s.fees}</span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", gap: "4px" }}>
                        {[{ Icon: Eye, hoverBg: "#eff6ff", color: "#2563eb" }, { Icon: Edit, hoverBg: "#f0fdf4", color: "#16a34a" }, { Icon: Trash2, hoverBg: "#fff1f2", color: "#e11d48" }].map(({ Icon, hoverBg, color }, idx) => (
                          <button key={idx}
                            style={{ padding: "7px", borderRadius: "9px", border: "none", background: "transparent", cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center", transition: "all 0.15s" }}
                            onMouseEnter={ev => { (ev.currentTarget as HTMLButtonElement).style.background = hoverBg; (ev.currentTarget as HTMLButtonElement).style.color = color; }}
                            onMouseLeave={ev => { (ev.currentTarget as HTMLButtonElement).style.background = "transparent"; (ev.currentTarget as HTMLButtonElement).style.color = "#94a3b8"; }}
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
              <Home size={40} color="#e2e8f0" style={{ margin: "0 auto 12px" }} />
              <p style={{ fontSize: "14px", fontWeight: 600 }}>No students found</p>
              <p style={{ fontSize: "12px", marginTop: "4px" }}>Try adjusting your filters</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid #f8fafc", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: "12px", color: "#94a3b8" }}>
            Showing <strong style={{ color: "#334155" }}>{filtered.length}</strong> of <strong style={{ color: "#334155" }}>{students.length}</strong> students
          </p>
          <div style={{ display: "flex", gap: "16px" }}>
            {["Paid", "Pending", "Overdue"].map(status => {
              const fs = feeStyles[status];
              const count = filtered.filter(s => s.fees === status).length;
              return (
                <div key={status} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: fs.color, display: "inline-block" }} />
                  <span style={{ fontSize: "12px", color: "#64748b" }}>{status}: <strong style={{ color: "#0f172a" }}>{count}</strong></span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";
import React, { useState } from "react";
import { Plus, Search, Edit, Trash2, Award, Download, CheckCircle, Clock, XCircle } from "lucide-react";

const scholarships = [
  { id: "SCH001", student: "Priya Patel",    class: "9-B",  type: "Merit",       percentage: 100, amount: 10900, reason: "School Topper",         status: "active",  since: "Apr 2025" },
  { id: "SCH002", student: "Ananya Singh",   class: "7-A",  type: "Need-Based",  percentage: 50,  amount: 4400,  reason: "Financial Hardship",    status: "active",  since: "Apr 2025" },
  { id: "SCH003", student: "Rohan Das",      class: "9-A",  type: "Sports",      percentage: 75,  amount: 8175,  reason: "State Level Athlete",   status: "active",  since: "Apr 2025" },
  { id: "SCH004", student: "Meera Nair",     class: "11-B", type: "Merit",       percentage: 50,  amount: 6900,  reason: "Top 5 in Class",        status: "active",  since: "Apr 2025" },
  { id: "SCH005", student: "Vikram Joshi",   class: "6-B",  type: "Need-Based",  percentage: 25,  amount: 1650,  reason: "Single Parent Family",  status: "pending", since: "Jul 2025" },
  { id: "SCH006", student: "Kavya Reddy",    class: "12-B", type: "Cultural",    percentage: 30,  amount: 4140,  reason: "National Dance Award",  status: "active",  since: "Apr 2025" },
  { id: "SCH007", student: "Deepak Yadav",   class: "10-B", type: "Need-Based",  percentage: 50,  amount: 5450,  reason: "BPL Category",          status: "expired", since: "Jan 2025" },
  { id: "SCH008", student: "Sunita Devi",    class: "8-A",  type: "Need-Based",  percentage: 75,  amount: 6600,  reason: "Orphan Student",        status: "active",  since: "Apr 2025" },
];

const typeColors: Record<string, { bg: string; color: string }> = {
  "Merit":      { bg: "#eff6ff", color: "#2563eb" },
  "Need-Based": { bg: "#f0fdf4", color: "#16a34a" },
  "Sports":     { bg: "#fffbeb", color: "#d97706" },
  "Cultural":   { bg: "#f5f3ff", color: "#7c3aed" },
};

const statusConfig: Record<string, { bg: string; color: string; icon: React.ElementType; label: string }> = {
  active:  { bg: "#f0fdf4", color: "#16a34a", icon: CheckCircle, label: "Active"  },
  pending: { bg: "#fffbeb", color: "#d97706", icon: Clock,       label: "Pending" },
  expired: { bg: "#f8fafc", color: "#94a3b8", icon: XCircle,     label: "Expired" },
};

const tabs = ["All", "Active", "Pending", "Expired"];

export default function ScholarshipsPage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");

  const filtered = scholarships.filter(s => {
    const matchTab = activeTab === "All" || s.status === activeTab.toLowerCase();
    const matchSearch = s.student.toLowerCase().includes(search.toLowerCase()) ||
      s.type.toLowerCase().includes(search.toLowerCase()) ||
      s.class.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const totalSaved = scholarships.filter(s => s.status === "active").reduce((sum, s) => sum + s.amount, 0);

  return (
    <div style={{ maxWidth: "1600px", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>Scholarships & Concessions</h1>
          <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>Manage fee waivers, merit and need-based scholarships</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#fff", fontSize: "13px", fontWeight: 600, color: "#334155", cursor: "pointer" }}>
            <Download size={14} /> Export
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 18px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#7c3aed,#8b5cf6)", fontSize: "13px", fontWeight: 600, color: "#fff", cursor: "pointer", boxShadow: "0 4px 12px rgba(124,58,237,0.35)" }}>
            <Plus size={14} /> Add Scholarship
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }}>
        {[
          { label: "Total Scholarships", value: scholarships.length,                                    icon: "🎓", color: "#7c3aed", bg: "#f5f3ff" },
          { label: "Active",             value: scholarships.filter(s => s.status === "active").length,  icon: "✅", color: "#16a34a", bg: "#f0fdf4" },
          { label: "Total Fee Waived",   value: `₹${totalSaved.toLocaleString()}`,                      icon: "💜", color: "#7c3aed", bg: "#f5f3ff" },
          { label: "Pending Review",     value: scholarships.filter(s => s.status === "pending").length, icon: "⏳", color: "#d97706", bg: "#fffbeb" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>{s.icon}</div>
            <div>
              <p style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>{s.label}</p>
              <p style={{ fontSize: "22px", fontWeight: 800, color: s.color, lineHeight: 1.1 }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Scholarship Type Breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "14px" }}>
        {Object.entries(typeColors).map(([type, tc]) => {
          const count = scholarships.filter(s => s.type === type && s.status === "active").length;
          const total = scholarships.filter(s => s.type === type && s.status === "active").reduce((sum, s) => sum + s.amount, 0);
          return (
            <div key={type} style={{ background: "#fff", borderRadius: "14px", border: "1px solid #f1f5f9", padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "9px", background: tc.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Award size={15} color={tc.color} />
                </div>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{type}</span>
              </div>
              <p style={{ fontSize: "22px", fontWeight: 800, color: tc.color }}>{count}</p>
              <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>₹{total.toLocaleString()} waived</p>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f8fafc", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
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
          <div style={{ position: "relative", flex: 1, maxWidth: "300px" }}>
            <Search size={14} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search scholarships..."
              style={{ width: "100%", paddingLeft: "36px", paddingRight: "16px", paddingTop: "9px", paddingBottom: "9px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", fontFamily: "inherit" }}
              onFocus={e => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
              onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
            />
          </div>
          <p style={{ marginLeft: "auto", fontSize: "12px", color: "#94a3b8" }}>{filtered.length} records</p>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#fafafa", borderBottom: "1px solid #f1f5f9" }}>
                {["ID", "Student", "Class", "Type", "Concession", "Amount Waived", "Reason", "Since", "Status", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => {
                const tc = typeColors[s.type] ?? { bg: "#f8fafc", color: "#64748b" };
                const sc = statusConfig[s.status];
                const StatusIcon = sc.icon;
                return (
                  <tr key={s.id}
                    style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f8fafc" : "none", transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "#fafafa"}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                  >
                    <td style={{ padding: "14px 20px", fontSize: "12px", fontWeight: 700, color: "#7c3aed" }}>{s.id}</td>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: tc.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Award size={15} color={tc.color} />
                        </div>
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap" }}>{s.student}</span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px", background: "#eff6ff", color: "#2563eb" }}>{s.class}</span>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px", background: tc.bg, color: tc.color }}>{s.type}</span>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{ flex: 1, height: "6px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden", width: "60px" }}>
                          <div style={{ height: "100%", width: `${s.percentage}%`, background: `linear-gradient(90deg,${tc.color},${tc.color}88)`, borderRadius: "4px" }} />
                        </div>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: tc.color }}>{s.percentage}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: "14px", fontWeight: 800, color: "#7c3aed" }}>₹{s.amount.toLocaleString()}</td>
                    <td style={{ padding: "14px 20px", fontSize: "12px", color: "#64748b", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.reason}</td>
                    <td style={{ padding: "14px 20px", fontSize: "12px", color: "#94a3b8", whiteSpace: "nowrap" }}>{s.since}</td>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "5px 10px", borderRadius: "20px", background: sc.bg }}>
                        <StatusIcon size={12} color={sc.color} />
                        <span style={{ fontSize: "11px", fontWeight: 700, color: sc.color }}>{sc.label}</span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", gap: "4px" }}>
                        {[{ Icon: Edit, hoverBg: "#f0fdf4", color: "#16a34a" }, { Icon: Trash2, hoverBg: "#fff1f2", color: "#e11d48" }].map(({ Icon, hoverBg, color }, idx) => (
                          <button key={idx}
                            style={{ padding: "7px", borderRadius: "9px", border: "none", background: "transparent", cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center", transition: "all 0.15s" }}
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
        </div>
      </div>
    </div>
  );
}

"use client";
import React, { useState } from "react";
import { Plus, Edit, Trash2, Search, Download, BookOpen } from "lucide-react";

const feeStructures = [
  { id: "FS001", class: "Class 1-5",  tuition: 4000,  transport: 1500, lab: 0,    library: 300, sports: 500, misc: 200, total: 6500  },
  { id: "FS002", class: "Class 6-8",  tuition: 5500,  transport: 1500, lab: 500,  library: 400, sports: 600, misc: 300, total: 8800  },
  { id: "FS003", class: "Class 9-10", tuition: 7000,  transport: 1500, lab: 800,  library: 500, sports: 700, misc: 400, total: 10900 },
  { id: "FS004", class: "Class 11-12 (Science)", tuition: 9000, transport: 1500, lab: 1500, library: 600, sports: 700, misc: 500, total: 13800 },
  { id: "FS005", class: "Class 11-12 (Commerce)", tuition: 8000, transport: 1500, lab: 500, library: 600, sports: 700, misc: 500, total: 11800 },
  { id: "FS006", class: "Class 11-12 (Arts)", tuition: 7500, transport: 1500, lab: 0, library: 600, sports: 700, misc: 500, total: 10800 },
];

const feeHeads = ["Tuition", "Transport", "Lab", "Library", "Sports", "Misc", "Total"];

export default function FeeStructurePage() {
  const [search, setSearch] = useState("");
  const filtered = feeStructures.filter(f => f.class.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ maxWidth: "1600px", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>Fee Structure</h1>
          <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>Define and manage class-wise fee heads</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#fff", fontSize: "13px", fontWeight: 600, color: "#334155", cursor: "pointer" }}>
            <Download size={14} /> Export
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 18px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", fontSize: "13px", fontWeight: 600, color: "#fff", cursor: "pointer", boxShadow: "0 4px 12px rgba(99,102,241,0.35)" }}>
            <Plus size={14} /> Add Structure
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }}>
        {[
          { label: "Fee Categories",  value: feeStructures.length, icon: "📋", color: "#6366f1", bg: "#eff6ff" },
          { label: "Lowest Fee",      value: "₹6,500",             icon: "📉", color: "#16a34a", bg: "#f0fdf4" },
          { label: "Highest Fee",     value: "₹13,800",            icon: "📈", color: "#e11d48", bg: "#fff1f2" },
          { label: "Fee Heads",       value: "6",                  icon: "🗂️", color: "#7c3aed", bg: "#f5f3ff" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>{s.icon}</div>
            <div>
              <p style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>{s.label}</p>
              <p style={{ fontSize: "24px", fontWeight: 800, color: s.color, lineHeight: 1.1 }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f8fafc", display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ position: "relative", flex: 1, maxWidth: "300px" }}>
            <Search size={14} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search class..."
              style={{ width: "100%", paddingLeft: "36px", paddingRight: "16px", paddingTop: "9px", paddingBottom: "9px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", fontFamily: "inherit" }}
              onFocus={e => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
              onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
            />
          </div>
          <p style={{ marginLeft: "auto", fontSize: "12px", color: "#94a3b8" }}>{filtered.length} structures</p>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#fafafa", borderBottom: "1px solid #f1f5f9" }}>
                <th style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>Class</th>
                {feeHeads.map(h => (
                  <th key={h} style={{ padding: "12px 20px", textAlign: "right", fontSize: "11px", fontWeight: 700, color: h === "Total" ? "#6366f1" : "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h} (₹)</th>
                ))}
                <th style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f, i) => (
                <tr key={f.id}
                  style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f8fafc" : "none", transition: "background 0.15s" }}
                  onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "#fafafa"}
                  onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                >
                  <td style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <BookOpen size={15} color="#6366f1" />
                      </div>
                      <div>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{f.class}</p>
                        <p style={{ fontSize: "11px", color: "#94a3b8" }}>{f.id}</p>
                      </div>
                    </div>
                  </td>
                  {[f.tuition, f.transport, f.lab, f.library, f.sports, f.misc].map((val, idx) => (
                    <td key={idx} style={{ padding: "14px 20px", textAlign: "right", fontSize: "13px", color: val === 0 ? "#cbd5e1" : "#334155", fontWeight: 500 }}>
                      {val === 0 ? "—" : val.toLocaleString()}
                    </td>
                  ))}
                  <td style={{ padding: "14px 20px", textAlign: "right" }}>
                    <span style={{ fontSize: "14px", fontWeight: 800, color: "#6366f1" }}>₹{f.total.toLocaleString()}</span>
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
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

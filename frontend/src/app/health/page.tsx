"use client";
import React, { useState } from "react";
import { Search, Plus, Download, Edit, Trash2, Eye, Activity, Heart, Pill, AlertCircle } from "lucide-react";

const patients = [
  { id: "P001", name: "Aarav Sharma",  class: "10-A", issue: "Fever",        status: "Recovered", date: "12 Jul 2025", doctor: "Dr. Mehta",  type: "Student" },
  { id: "P002", name: "Priya Patel",   class: "9-B",  issue: "Sprained Ankle",status: "Under Treatment", date: "14 Jul 2025", doctor: "Dr. Mehta",  type: "Student" },
  { id: "P003", name: "Rohan Verma",   class: "11-A", issue: "Headache",     status: "Recovered", date: "10 Jul 2025", doctor: "Dr. Singh",  type: "Student" },
  { id: "P004", name: "Sneha Gupta",   class: "8-C",  issue: "Stomach Ache", status: "Referred",  date: "15 Jul 2025", doctor: "Dr. Mehta",  type: "Student" },
  { id: "P005", name: "Karan Singh",   class: "12-B", issue: "Eye Infection", status: "Under Treatment", date: "13 Jul 2025", doctor: "Dr. Singh",  type: "Student" },
  { id: "P006", name: "Mr. Ramesh",    class: "—",    issue: "BP Check",     status: "Recovered", date: "11 Jul 2025", doctor: "Dr. Mehta",  type: "Staff" },
  { id: "P007", name: "Ananya Joshi",  class: "7-A",  issue: "Allergy",      status: "Under Treatment", date: "15 Jul 2025", doctor: "Dr. Singh",  type: "Student" },
  { id: "P008", name: "Vikram Nair",   class: "6-B",  issue: "Cold & Cough", status: "Recovered", date: "09 Jul 2025", doctor: "Dr. Mehta",  type: "Student" },
];

const medicines = [
  { id: "M001", name: "Paracetamol 500mg", category: "Analgesic",    stock: 240, unit: "Tablets", expiry: "Dec 2026", status: "In Stock" },
  { id: "M002", name: "Amoxicillin 250mg", category: "Antibiotic",   stock: 80,  unit: "Capsules",expiry: "Jun 2026", status: "In Stock" },
  { id: "M003", name: "ORS Sachets",       category: "Electrolyte",  stock: 12,  unit: "Sachets", expiry: "Mar 2026", status: "Low Stock" },
  { id: "M004", name: "Ibuprofen 400mg",   category: "Analgesic",    stock: 0,   unit: "Tablets", expiry: "Sep 2026", status: "Out of Stock" },
  { id: "M005", name: "Antacid Syrup",     category: "Antacid",      stock: 6,   unit: "Bottles", expiry: "Nov 2025", status: "Low Stock" },
  { id: "M006", name: "Bandages",          category: "First Aid",    stock: 50,  unit: "Rolls",   expiry: "—",        status: "In Stock" },
  { id: "M007", name: "Antiseptic Cream",  category: "First Aid",    stock: 18,  unit: "Tubes",   expiry: "Aug 2026", status: "In Stock" },
];

const statusStyles: Record<string, { bg: string; color: string }> = {
  "Recovered":        { bg: "#f0fdf4", color: "#16a34a" },
  "Under Treatment":  { bg: "#fffbeb", color: "#d97706" },
  "Referred":         { bg: "#fff1f2", color: "#e11d48" },
};

const stockStyles: Record<string, { bg: string; color: string }> = {
  "In Stock":     { bg: "#f0fdf4", color: "#16a34a" },
  "Low Stock":    { bg: "#fffbeb", color: "#d97706" },
  "Out of Stock": { bg: "#fff1f2", color: "#e11d48" },
};

export default function HealthPage() {
  const [search, setSearch]     = useState("");
  const [tab, setTab]           = useState<"patients" | "medicines">("patients");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter]     = useState("All");

  const filteredPatients = patients.filter(p => {
    const matchStatus = statusFilter === "All" || p.status === statusFilter;
    const matchType   = typeFilter === "All" || p.type === typeFilter;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                        p.issue.toLowerCase().includes(search.toLowerCase()) ||
                        p.id.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchType && matchSearch;
  });

  const filteredMedicines = medicines.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.category.toLowerCase().includes(search.toLowerCase())
  );

  const recovered      = patients.filter(p => p.status === "Recovered").length;
  const underTreatment = patients.filter(p => p.status === "Under Treatment").length;
  const referred       = patients.filter(p => p.status === "Referred").length;
  const lowStock       = medicines.filter(m => m.status !== "In Stock").length;

  return (
    <div style={{ maxWidth: "1600px", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>Health</h1>
          <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>Manage patient records, medicines and health reports</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#fff", fontSize: "13px", fontWeight: 600, color: "#334155", cursor: "pointer" }}>
            <Download size={14} /> Export
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 18px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#f43f5e,#e11d48)", fontSize: "13px", fontWeight: 600, color: "#fff", cursor: "pointer", boxShadow: "0 4px 12px rgba(244,63,94,0.35)" }}>
            <Plus size={14} /> Add Record
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }}>
        {[
          { label: "Total Patients",    value: patients.length, icon: <Heart size={22} />,       color: "#e11d48", bg: "#fff1f2" },
          { label: "Recovered",         value: recovered,       icon: <Activity size={22} />,    color: "#16a34a", bg: "#f0fdf4" },
          { label: "Under Treatment",   value: underTreatment,  icon: <AlertCircle size={22} />, color: "#d97706", bg: "#fffbeb" },
          { label: "Medicine Alerts",   value: lowStock,        icon: <Pill size={22} />,        color: "#6366f1", bg: "#eff6ff" },
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

      {/* Tabs + Table */}
      <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>

        {/* Toolbar */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f8fafc", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>

          {/* Tabs */}
          <div style={{ display: "flex", background: "#f8fafc", borderRadius: "12px", padding: "4px", gap: "2px" }}>
            {(["patients", "medicines"] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setSearch(""); setStatusFilter("All"); setTypeFilter("All"); }} style={{
                padding: "7px 18px", borderRadius: "9px", border: "none", cursor: "pointer",
                fontSize: "12px", fontWeight: 600, transition: "all 0.15s", textTransform: "capitalize",
                background: tab === t ? "#fff" : "transparent",
                color: tab === t ? "#0f172a" : "#64748b",
                boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}>{t}</button>
            ))}
          </div>

          {tab === "patients" && (
            <>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                style={{ padding: "9px 14px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", cursor: "pointer" }}>
                <option value="All">All Status</option>
                <option>Recovered</option>
                <option>Under Treatment</option>
                <option>Referred</option>
              </select>
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                style={{ padding: "9px 14px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", cursor: "pointer" }}>
                <option value="All">All Types</option>
                <option>Student</option>
                <option>Staff</option>
              </select>
            </>
          )}

          {/* Search */}
          <div style={{ position: "relative", flex: 1, maxWidth: "300px" }}>
            <Search size={14} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={tab === "patients" ? "Search patients..." : "Search medicines..."}
              style={{ width: "100%", paddingLeft: "36px", paddingRight: "16px", paddingTop: "9px", paddingBottom: "9px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", fontFamily: "inherit" }}
              onFocus={e => { e.target.style.borderColor = "#e11d48"; e.target.style.boxShadow = "0 0 0 3px rgba(244,63,94,0.1)"; }}
              onBlur={e  => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          <p style={{ marginLeft: "auto", fontSize: "12px", color: "#94a3b8" }}>
            {tab === "patients" ? `${filteredPatients.length} records` : `${filteredMedicines.length} items`}
          </p>
        </div>

        {/* Patients Table */}
        {tab === "patients" && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#fafafa", borderBottom: "1px solid #f1f5f9" }}>
                  {["Patient", "Class", "Issue", "Doctor", "Date", "Type", "Status", "Actions"].map(h => (
                    <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((p, i) => {
                  const ss = statusStyles[p.status];
                  return (
                    <tr key={p.id}
                      style={{ borderBottom: i < filteredPatients.length - 1 ? "1px solid #f8fafc" : "none", transition: "background 0.15s" }}
                      onMouseEnter={ev => (ev.currentTarget as HTMLTableRowElement).style.background = "#fafafa"}
                      onMouseLeave={ev => (ev.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                    >
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "38px", height: "38px", borderRadius: "12px", background: "linear-gradient(135deg,#f43f5e,#e11d48)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "14px", fontWeight: 700, flexShrink: 0 }}>
                            {p.name.charAt(0)}
                          </div>
                          <div>
                            <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{p.name}</p>
                            <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "1px" }}>{p.id}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px", background: "#eff6ff", color: "#2563eb" }}>{p.class}</span>
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: "13px", color: "#334155" }}>{p.issue}</td>
                      <td style={{ padding: "14px 20px", fontSize: "13px", color: "#64748b" }}>{p.doctor}</td>
                      <td style={{ padding: "14px 20px", fontSize: "12px", color: "#64748b", whiteSpace: "nowrap" }}>{p.date}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px", background: p.type === "Student" ? "#eff6ff" : "#f5f3ff", color: p.type === "Student" ? "#2563eb" : "#7c3aed" }}>{p.type}</span>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, padding: "5px 10px", borderRadius: "20px", background: ss.bg, color: ss.color }}>{p.status}</span>
                      </td>
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
            {filteredPatients.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px", color: "#94a3b8" }}>
                <Heart size={40} color="#e2e8f0" style={{ margin: "0 auto 12px" }} />
                <p style={{ fontSize: "14px", fontWeight: 600 }}>No records found</p>
              </div>
            )}
          </div>
        )}

        {/* Medicines Table */}
        {tab === "medicines" && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#fafafa", borderBottom: "1px solid #f1f5f9" }}>
                  {["Medicine", "Category", "Stock", "Unit", "Expiry", "Status", "Actions"].map(h => (
                    <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredMedicines.map((m, i) => {
                  const ms = stockStyles[m.status];
                  return (
                    <tr key={m.id}
                      style={{ borderBottom: i < filteredMedicines.length - 1 ? "1px solid #f8fafc" : "none", transition: "background 0.15s" }}
                      onMouseEnter={ev => (ev.currentTarget as HTMLTableRowElement).style.background = "#fafafa"}
                      onMouseLeave={ev => (ev.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                    >
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "38px", height: "38px", borderRadius: "12px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Pill size={16} color="#fff" />
                          </div>
                          <div>
                            <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{m.name}</p>
                            <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "1px" }}>{m.id}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px", background: "#f5f3ff", color: "#7c3aed" }}>{m.category}</span>
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: "14px", fontWeight: 700, color: m.stock === 0 ? "#e11d48" : m.stock < 15 ? "#d97706" : "#0f172a" }}>{m.stock}</td>
                      <td style={{ padding: "14px 20px", fontSize: "13px", color: "#64748b" }}>{m.unit}</td>
                      <td style={{ padding: "14px 20px", fontSize: "12px", color: "#64748b" }}>{m.expiry}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, padding: "5px 10px", borderRadius: "20px", background: ms.bg, color: ms.color }}>{m.status}</span>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", gap: "4px" }}>
                          {[{ Icon: Edit, hoverBg: "#f0fdf4", color: "#16a34a" }, { Icon: Trash2, hoverBg: "#fff1f2", color: "#e11d48" }].map(({ Icon, hoverBg, color }, idx) => (
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
            {filteredMedicines.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px", color: "#94a3b8" }}>
                <Pill size={40} color="#e2e8f0" style={{ margin: "0 auto 12px" }} />
                <p style={{ fontSize: "14px", fontWeight: 600 }}>No medicines found</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid #f8fafc", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: "12px", color: "#94a3b8" }}>
            Showing <strong style={{ color: "#334155" }}>{tab === "patients" ? filteredPatients.length : filteredMedicines.length}</strong> of{" "}
            <strong style={{ color: "#334155" }}>{tab === "patients" ? patients.length : medicines.length}</strong> {tab === "patients" ? "records" : "items"}
          </p>
          {tab === "patients" && (
            <div style={{ display: "flex", gap: "16px" }}>
              {["Recovered", "Under Treatment", "Referred"].map(s => {
                const ss = statusStyles[s];
                const count = filteredPatients.filter(p => p.status === s).length;
                return (
                  <div key={s} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: ss.color, display: "inline-block" }} />
                    <span style={{ fontSize: "12px", color: "#64748b" }}>{s}: <strong style={{ color: "#0f172a" }}>{count}</strong></span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

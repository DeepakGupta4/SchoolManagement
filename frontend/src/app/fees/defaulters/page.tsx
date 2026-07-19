"use client";
import React, { useState } from "react";
import { Search, AlertTriangle, Phone, Mail, Send, Download, Filter } from "lucide-react";

const defaulters = [
  { id: "STU005", name: "Karan Mehta",     class: "12-A", parent: "Suresh Mehta",   phone: "98765-43210", totalFee: 13800, paid: 0,     due: 13800, months: 3, lastPaid: "Apr 2025" },
  { id: "STU011", name: "Deepak Yadav",    class: "10-B", parent: "Ramesh Yadav",   phone: "87654-32109", totalFee: 10900, paid: 2725,  due: 8175,  months: 2, lastPaid: "May 2025" },
  { id: "STU018", name: "Pooja Sharma",    class: "9-A",  parent: "Anil Sharma",    phone: "76543-21098", totalFee: 10900, paid: 5450,  due: 5450,  months: 1, lastPaid: "Jun 2025" },
  { id: "STU023", name: "Amit Tiwari",     class: "11-B", parent: "Rajesh Tiwari",  phone: "65432-10987", totalFee: 13800, paid: 4600,  due: 9200,  months: 2, lastPaid: "May 2025" },
  { id: "STU031", name: "Sunita Devi",     class: "8-A",  parent: "Mohan Devi",     phone: "54321-09876", totalFee: 8800,  paid: 2200,  due: 6600,  months: 3, lastPaid: "Apr 2025" },
  { id: "STU042", name: "Ravi Kumar",      class: "7-B",  parent: "Sunil Kumar",    phone: "43210-98765", totalFee: 8800,  paid: 4400,  due: 4400,  months: 1, lastPaid: "Jun 2025" },
  { id: "STU055", name: "Nisha Pandey",    class: "6-A",  parent: "Vinod Pandey",   phone: "32109-87654", totalFee: 6500,  paid: 0,     due: 6500,  months: 3, lastPaid: "Never"    },
  { id: "STU067", name: "Gaurav Singh",    class: "12-B", parent: "Harish Singh",   phone: "21098-76543", totalFee: 13800, paid: 6900,  due: 6900,  months: 1, lastPaid: "Jun 2025" },
];

const urgencyConfig = (months: number) => {
  if (months >= 3) return { label: "Critical", bg: "#fff1f2", color: "#e11d48" };
  if (months === 2) return { label: "High",     bg: "#fffbeb", color: "#d97706" };
  return                  { label: "Medium",    bg: "#eff6ff", color: "#2563eb" };
};

export default function DefaultersPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  const filtered = defaulters.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.id.toLowerCase().includes(search.toLowerCase()) ||
      d.class.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" ||
      (filter === "Critical" && d.months >= 3) ||
      (filter === "High" && d.months === 2) ||
      (filter === "Medium" && d.months === 1);
    return matchSearch && matchFilter;
  });

  const totalDue = defaulters.reduce((s, d) => s + d.due, 0);

  return (
    <div style={{ maxWidth: "1600px", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>Fee Defaulters</h1>
          <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>Students with pending fee dues</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#fff", fontSize: "13px", fontWeight: 600, color: "#334155", cursor: "pointer" }}>
            <Download size={14} /> Export
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 18px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#e11d48,#f43f5e)", fontSize: "13px", fontWeight: 600, color: "#fff", cursor: "pointer", boxShadow: "0 4px 12px rgba(225,29,72,0.35)" }}>
            <Send size={14} /> Send Reminders
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }}>
        {[
          { label: "Total Defaulters",  value: defaulters.length,                                    icon: "👥", color: "#e11d48", bg: "#fff1f2" },
          { label: "Total Due Amount",  value: `₹${totalDue.toLocaleString()}`,                      icon: "💸", color: "#d97706", bg: "#fffbeb" },
          { label: "Critical (3+ mo.)", value: defaulters.filter(d => d.months >= 3).length,         icon: "🚨", color: "#e11d48", bg: "#fff1f2" },
          { label: "High (2 mo.)",      value: defaulters.filter(d => d.months === 2).length,        icon: "⚠️", color: "#d97706", bg: "#fffbeb" },
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

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f8fafc", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          {/* Filter tabs */}
          <div style={{ display: "flex", background: "#f8fafc", borderRadius: "12px", padding: "4px", gap: "2px" }}>
            {["All", "Critical", "High", "Medium"].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: "7px 16px", borderRadius: "9px", border: "none", cursor: "pointer",
                fontSize: "12px", fontWeight: 600, transition: "all 0.15s",
                background: filter === f ? "#fff" : "transparent",
                color: filter === f ? "#0f172a" : "#64748b",
                boxShadow: filter === f ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}>{f}</button>
            ))}
          </div>
          <div style={{ position: "relative", flex: 1, maxWidth: "300px" }}>
            <Search size={14} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search defaulters..."
              style={{ width: "100%", paddingLeft: "36px", paddingRight: "16px", paddingTop: "9px", paddingBottom: "9px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", fontFamily: "inherit" }}
              onFocus={e => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
              onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
            />
          </div>
          <p style={{ marginLeft: "auto", fontSize: "12px", color: "#94a3b8" }}>{filtered.length} students</p>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#fafafa", borderBottom: "1px solid #f1f5f9" }}>
                {["Student", "Class", "Parent / Guardian", "Contact", "Total Fee", "Paid", "Due Amount", "Overdue", "Last Paid", "Urgency", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => {
                const urg = urgencyConfig(d.months);
                return (
                  <tr key={d.id}
                    style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f8fafc" : "none", transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "#fafafa"}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                  >
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: urg.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <AlertTriangle size={15} color={urg.color} />
                        </div>
                        <div>
                          <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{d.name}</p>
                          <p style={{ fontSize: "11px", color: "#94a3b8" }}>{d.id}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px", background: "#eff6ff", color: "#2563eb" }}>{d.class}</span>
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: "13px", color: "#334155", whiteSpace: "nowrap" }}>{d.parent}</td>
                    <td style={{ padding: "14px 20px", fontSize: "12px", color: "#64748b", whiteSpace: "nowrap" }}>{d.phone}</td>
                    <td style={{ padding: "14px 20px", fontSize: "13px", color: "#64748b" }}>₹{d.totalFee.toLocaleString()}</td>
                    <td style={{ padding: "14px 20px", fontSize: "13px", color: "#16a34a", fontWeight: 600 }}>₹{d.paid.toLocaleString()}</td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontSize: "14px", fontWeight: 800, color: "#e11d48" }}>₹{d.due.toLocaleString()}</span>
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: "13px", color: "#64748b" }}>{d.months} mo.</td>
                    <td style={{ padding: "14px 20px", fontSize: "12px", color: "#94a3b8", whiteSpace: "nowrap" }}>{d.lastPaid}</td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px", background: urg.bg, color: urg.color }}>{urg.label}</span>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", gap: "4px" }}>
                        {[{ Icon: Phone, hoverBg: "#f0fdf4", color: "#16a34a" }, { Icon: Mail, hoverBg: "#eff6ff", color: "#2563eb" }, { Icon: Send, hoverBg: "#fff1f2", color: "#e11d48" }].map(({ Icon, hoverBg, color }, idx) => (
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

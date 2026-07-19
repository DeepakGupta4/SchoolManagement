"use client";
import React, { useState } from "react";
import { Search, Download, Eye, Printer, CheckCircle, Clock, XCircle, Filter } from "lucide-react";

const receipts = [
  { id: "RCP001", student: "Arjun Sharma",   class: "10-A", feeType: "Tuition Fee",   amount: 5450,  method: "Online",  date: "Jul 18, 2025", status: "paid",    txnId: "TXN8821" },
  { id: "RCP002", student: "Priya Patel",    class: "9-B",  feeType: "Full Fee",       amount: 10900, method: "Cash",    date: "Jul 17, 2025", status: "paid",    txnId: "TXN8820" },
  { id: "RCP003", student: "Rahul Verma",    class: "11-A", feeType: "Tuition Fee",   amount: 6900,  method: "Cheque",  date: "Jul 16, 2025", status: "pending", txnId: "TXN8819" },
  { id: "RCP004", student: "Sneha Gupta",    class: "8-B",  feeType: "Full Fee",       amount: 8800,  method: "Online",  date: "Jul 15, 2025", status: "paid",    txnId: "TXN8818" },
  { id: "RCP005", student: "Karan Mehta",    class: "12-A", feeType: "Transport Fee", amount: 1500,  method: "UPI",     date: "Jul 14, 2025", status: "paid",    txnId: "TXN8817" },
  { id: "RCP006", student: "Ananya Singh",   class: "7-A",  feeType: "Tuition Fee",   amount: 4400,  method: "Cash",    date: "Jul 13, 2025", status: "paid",    txnId: "TXN8816" },
  { id: "RCP007", student: "Vikram Joshi",   class: "6-B",  feeType: "Lab Fee",        amount: 500,   method: "Online",  date: "Jul 12, 2025", status: "cancelled", txnId: "TXN8815" },
  { id: "RCP008", student: "Meera Nair",     class: "11-B", feeType: "Full Fee",       amount: 13800, method: "DD",      date: "Jul 11, 2025", status: "paid",    txnId: "TXN8814" },
  { id: "RCP009", student: "Rohan Das",      class: "9-A",  feeType: "Sports Fee",    amount: 700,   method: "Cash",    date: "Jul 10, 2025", status: "paid",    txnId: "TXN8813" },
  { id: "RCP010", student: "Kavya Reddy",    class: "12-B", feeType: "Tuition Fee",   amount: 9000,  method: "Online",  date: "Jul 09, 2025", status: "pending", txnId: "TXN8812" },
];

const statusConfig: Record<string, { bg: string; color: string; icon: React.ElementType; label: string }> = {
  paid:      { bg: "#f0fdf4", color: "#16a34a", icon: CheckCircle, label: "Paid"      },
  pending:   { bg: "#fffbeb", color: "#d97706", icon: Clock,       label: "Pending"   },
  cancelled: { bg: "#fff1f2", color: "#e11d48", icon: XCircle,     label: "Cancelled" },
};

const tabs = ["All", "Paid", "Pending", "Cancelled"];

export default function ReceiptsPage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("All");

  const filtered = receipts.filter(r => {
    const matchTab = activeTab === "All" || r.status === activeTab.toLowerCase();
    const matchSearch = r.student.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase()) ||
      r.feeType.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const totalCollected = receipts.filter(r => r.status === "paid").reduce((s, r) => s + r.amount, 0);

  return (
    <div style={{ maxWidth: "1600px", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>Fee Receipts</h1>
          <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>View, print and download fee receipts</p>
        </div>
        <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#fff", fontSize: "13px", fontWeight: 600, color: "#334155", cursor: "pointer" }}>
          <Download size={14} /> Export All
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }}>
        {[
          { label: "Total Receipts",  value: receipts.length,                                          icon: "🧾", color: "#6366f1", bg: "#eff6ff" },
          { label: "Total Collected", value: `₹${totalCollected.toLocaleString()}`,                    icon: "💰", color: "#16a34a", bg: "#f0fdf4" },
          { label: "Pending",         value: receipts.filter(r => r.status === "pending").length,      icon: "⏳", color: "#d97706", bg: "#fffbeb" },
          { label: "Cancelled",       value: receipts.filter(r => r.status === "cancelled").length,    icon: "❌", color: "#e11d48", bg: "#fff1f2" },
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
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search receipts..."
              style={{ width: "100%", paddingLeft: "36px", paddingRight: "16px", paddingTop: "9px", paddingBottom: "9px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", fontFamily: "inherit" }}
              onFocus={e => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
              onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
            />
          </div>
          <p style={{ marginLeft: "auto", fontSize: "12px", color: "#94a3b8" }}>{filtered.length} receipts</p>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#fafafa", borderBottom: "1px solid #f1f5f9" }}>
                {["Receipt ID", "Student", "Class", "Fee Type", "Amount", "Method", "Date", "Txn ID", "Status", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => {
                const sc = statusConfig[r.status];
                const StatusIcon = sc.icon;
                return (
                  <tr key={r.id}
                    style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f8fafc" : "none", transition: "background 0.15s" }}
                    onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = "#fafafa"}
                    onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                  >
                    <td style={{ padding: "14px 20px", fontSize: "12px", fontWeight: 700, color: "#6366f1" }}>{r.id}</td>
                    <td style={{ padding: "14px 20px", fontSize: "13px", fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap" }}>{r.student}</td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px", background: "#eff6ff", color: "#2563eb" }}>{r.class}</span>
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: "13px", color: "#334155", whiteSpace: "nowrap" }}>{r.feeType}</td>
                    <td style={{ padding: "14px 20px", fontSize: "14px", fontWeight: 800, color: "#0f172a", whiteSpace: "nowrap" }}>₹{r.amount.toLocaleString()}</td>
                    <td style={{ padding: "14px 20px", fontSize: "12px", color: "#64748b" }}>{r.method}</td>
                    <td style={{ padding: "14px 20px", fontSize: "12px", color: "#64748b", whiteSpace: "nowrap" }}>{r.date}</td>
                    <td style={{ padding: "14px 20px", fontSize: "11px", color: "#94a3b8", fontFamily: "monospace" }}>{r.txnId}</td>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "5px 10px", borderRadius: "20px", background: sc.bg }}>
                        <StatusIcon size={12} color={sc.color} />
                        <span style={{ fontSize: "11px", fontWeight: 700, color: sc.color }}>{sc.label}</span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", gap: "4px" }}>
                        {[{ Icon: Eye, hoverBg: "#eff6ff", color: "#2563eb" }, { Icon: Printer, hoverBg: "#f0fdf4", color: "#16a34a" }, { Icon: Download, hoverBg: "#f5f3ff", color: "#7c3aed" }].map(({ Icon, hoverBg, color }, idx) => (
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

        <div style={{ padding: "14px 20px", borderTop: "1px solid #f8fafc", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: "12px", color: "#94a3b8" }}>
            Showing <strong style={{ color: "#334155" }}>{filtered.length}</strong> of <strong style={{ color: "#334155" }}>{receipts.length}</strong> receipts
          </p>
          <div style={{ display: "flex", gap: "4px" }}>
            {[1, 2, 3].map(p => (
              <button key={p} style={{ width: "32px", height: "32px", borderRadius: "9px", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: 600, background: p === 1 ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "#f8fafc", color: p === 1 ? "#fff" : "#64748b", boxShadow: p === 1 ? "0 2px 8px rgba(99,102,241,0.3)" : "none" }}>{p}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

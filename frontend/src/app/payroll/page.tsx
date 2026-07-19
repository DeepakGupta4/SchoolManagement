"use client";
import React, { useState } from "react";
import { Search, Download, Eye, CheckCircle, Clock, AlertCircle, Send, Plus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const payrollData = [
  { id: "EMP001", name: "Dr. Priya Sharma",    role: "Teacher",       dept: "Mathematics",       basic: 55000, hra: 22000, ta: 5000, deductions: 8250,  net: 73750, status: "paid",    bank: "SBI ****4521"   },
  { id: "EMP002", name: "Mr. Rahul Verma",     role: "Teacher",       dept: "Physics",           basic: 48000, hra: 19200, ta: 5000, deductions: 7200,  net: 65000, status: "paid",    bank: "HDFC ****7832"  },
  { id: "EMP003", name: "Ms. Anita Patel",     role: "Teacher",       dept: "English",           basic: 45000, hra: 18000, ta: 5000, deductions: 6750,  net: 61250, status: "paid",    bank: "ICICI ****2341" },
  { id: "EMP004", name: "Mr. Suresh Kumar",    role: "Teacher",       dept: "History",           basic: 52000, hra: 20800, ta: 5000, deductions: 7800,  net: 70000, status: "pending", bank: "SBI ****9012"   },
  { id: "EMP005", name: "Ms. Kavita Singh",    role: "Teacher",       dept: "Chemistry",         basic: 50000, hra: 20000, ta: 5000, deductions: 7500,  net: 67500, status: "paid",    bank: "Axis ****5678"  },
  { id: "EMP006", name: "Mr. Amit Joshi",      role: "Teacher",       dept: "Computer Science",  basic: 42000, hra: 16800, ta: 5000, deductions: 6300,  net: 57500, status: "paid",    bank: "HDFC ****3344"  },
  { id: "EMP007", name: "Ms. Deepa Nair",      role: "Teacher",       dept: "Biology",           basic: 49000, hra: 19600, ta: 5000, deductions: 7350,  net: 66250, status: "pending", bank: "SBI ****8821"   },
  { id: "EMP008", name: "Mr. Vikram Gupta",    role: "Teacher",       dept: "Physical Education",basic: 38000, hra: 15200, ta: 5000, deductions: 5700,  net: 52500, status: "paid",    bank: "PNB ****1122"   },
  { id: "EMP009", name: "Mrs. Sunita Rao",     role: "Admin Staff",   dept: "Administration",    basic: 32000, hra: 12800, ta: 3000, deductions: 4800,  net: 43000, status: "paid",    bank: "SBI ****6677"   },
  { id: "EMP010", name: "Mr. Rajan Mehta",     role: "Accountant",    dept: "Finance",           basic: 40000, hra: 16000, ta: 3000, deductions: 6000,  net: 53000, status: "paid",    bank: "ICICI ****9900" },
  { id: "EMP011", name: "Ms. Pooja Iyer",      role: "Librarian",     dept: "Library",           basic: 30000, hra: 12000, ta: 3000, deductions: 4500,  net: 40500, status: "paid",    bank: "Axis ****4455"  },
  { id: "EMP012", name: "Mr. Dinesh Yadav",    role: "Security",      dept: "Operations",        basic: 22000, hra: 8800,  ta: 2000, deductions: 3300,  net: 29500, status: "on-hold", bank: "SBI ****7788"   },
];

const deptColors: Record<string, { bg: string; color: string }> = {
  Mathematics:         { bg: "#eff6ff", color: "#2563eb" },
  Physics:             { bg: "#f5f3ff", color: "#7c3aed" },
  English:             { bg: "#f0fdf4", color: "#16a34a" },
  History:             { bg: "#fffbeb", color: "#d97706" },
  Chemistry:           { bg: "#fdf4ff", color: "#9333ea" },
  "Computer Science":  { bg: "#ecfeff", color: "#0891b2" },
  Biology:             { bg: "#f0fdf4", color: "#059669" },
  "Physical Education":{ bg: "#fff1f2", color: "#e11d48" },
  Administration:      { bg: "#f8fafc", color: "#475569" },
  Finance:             { bg: "#fffbeb", color: "#b45309" },
  Library:             { bg: "#fdf4ff", color: "#7c3aed" },
  Operations:          { bg: "#f1f5f9", color: "#64748b" },
};

const statusConfig: Record<string, { bg: string; color: string; icon: React.ElementType; label: string }> = {
  paid:     { bg: "#f0fdf4", color: "#16a34a", icon: CheckCircle, label: "Paid"    },
  pending:  { bg: "#fffbeb", color: "#d97706", icon: Clock,       label: "Pending" },
  "on-hold":{ bg: "#fff1f2", color: "#e11d48", icon: AlertCircle, label: "On Hold" },
};

const monthlyPayroll = [
  { month: "Feb", amount: 820000 },
  { month: "Mar", amount: 835000 },
  { month: "Apr", amount: 828000 },
  { month: "May", amount: 842000 },
  { month: "Jun", amount: 838000 },
  { month: "Jul", amount: 855000 },
];

const tooltipStyle = { borderRadius: "10px", border: "1px solid #f1f5f9", boxShadow: "0 8px 24px rgba(0,0,0,0.08)", fontSize: "12px", background: "#fff" };
const tabs = ["All", "Paid", "Pending", "On Hold"];

export default function PayrollPage() {
  const [search, setSearch]       = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");

  const filtered = payrollData.filter(e => {
    const tabVal   = activeTab === "On Hold" ? "on-hold" : activeTab.toLowerCase();
    const matchTab = activeTab === "All" || e.status === tabVal;
    const matchRole = roleFilter === "All" || e.role === roleFilter;
    const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
                        e.dept.toLowerCase().includes(search.toLowerCase()) ||
                        e.id.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchRole && matchSearch;
  });

  const totalNet     = payrollData.reduce((s, e) => s + e.net, 0);
  const totalPaid    = payrollData.filter(e => e.status === "paid").reduce((s, e) => s + e.net, 0);
  const totalPending = payrollData.filter(e => e.status === "pending").reduce((s, e) => s + e.net, 0);
  const roles        = ["All", ...Array.from(new Set(payrollData.map(e => e.role)))];

  return (
    <div style={{ maxWidth: "1600px", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>Payroll</h1>
          <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>Manage staff salaries and monthly disbursements</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#fff", fontSize: "13px", fontWeight: 600, color: "#334155", cursor: "pointer" }}>
            <Download size={14} /> Export
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 18px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", fontSize: "13px", fontWeight: 600, color: "#fff", cursor: "pointer", boxShadow: "0 4px 12px rgba(99,102,241,0.35)" }}>
            <Send size={14} /> Run Payroll
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }}>
        {[
          { label: "Total Payroll (Jul)", value: `₹${totalNet.toLocaleString()}`,     icon: "💰", color: "#6366f1", bg: "#eff6ff" },
          { label: "Disbursed",           value: `₹${totalPaid.toLocaleString()}`,    icon: "✅", color: "#16a34a", bg: "#f0fdf4" },
          { label: "Pending",             value: `₹${totalPending.toLocaleString()}`, icon: "⏳", color: "#d97706", bg: "#fffbeb" },
          { label: "Total Staff",         value: payrollData.length,                  icon: "👥", color: "#8b5cf6", bg: "#f5f3ff" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>{s.icon}</div>
            <div>
              <p style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>{s.label}</p>
              <p style={{ fontSize: "22px", fontWeight: 800, color: s.color, lineHeight: 1.1, letterSpacing: "-0.5px" }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Chart */}
      <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
        <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #f8fafc" }}>
          <p style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>Monthly Payroll Disbursement</p>
          <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>Total salary paid per month</p>
        </div>
        <div style={{ padding: "16px 20px 20px" }}>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyPayroll} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 100000).toFixed(1)}L`} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f8fafc" }} formatter={v => [`₹${Number(v).toLocaleString("en-IN")}`, "Payroll"]} />
              <Bar dataKey="amount" fill="#6366f1" radius={[6, 6, 0, 0]} name="Payroll" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>

        {/* Toolbar */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f8fafc", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", background: "#f8fafc", borderRadius: "12px", padding: "4px", gap: "2px" }}>
            {tabs.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: "7px 14px", borderRadius: "9px", border: "none", cursor: "pointer",
                fontSize: "12px", fontWeight: 600, transition: "all 0.15s",
                background: activeTab === tab ? "#fff" : "transparent",
                color: activeTab === tab ? "#0f172a" : "#64748b",
                boxShadow: activeTab === tab ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}>{tab}</button>
            ))}
          </div>

          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
            style={{ padding: "9px 14px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", cursor: "pointer" }}>
            {roles.map(r => <option key={r}>{r === "All" ? "All Roles" : r}</option>)}
          </select>

          <div style={{ position: "relative", flex: 1, maxWidth: "300px" }}>
            <Search size={14} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search staff..."
              style={{ width: "100%", paddingLeft: "36px", paddingRight: "16px", paddingTop: "9px", paddingBottom: "9px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", fontFamily: "inherit" }}
              onFocus={e => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
              onBlur={e  => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
            />
          </div>
          <p style={{ marginLeft: "auto", fontSize: "12px", color: "#94a3b8" }}>{filtered.length} employees</p>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#fafafa", borderBottom: "1px solid #f1f5f9" }}>
                {["Employee", "Role", "Department", "Basic", "HRA", "TA", "Deductions", "Net Salary", "Bank", "Status", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp, i) => {
                const dc = deptColors[emp.dept] ?? { bg: "#f8fafc", color: "#64748b" };
                const sc = statusConfig[emp.status];
                const StatusIcon = sc.icon;
                return (
                  <tr key={emp.id}
                    style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f8fafc" : "none", transition: "background 0.15s" }}
                    onMouseEnter={ev => (ev.currentTarget as HTMLTableRowElement).style.background = "#fafafa"}
                    onMouseLeave={ev => (ev.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                  >
                    {/* Employee */}
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "38px", height: "38px", borderRadius: "12px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "14px", fontWeight: 700, flexShrink: 0 }}>
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{emp.name}</p>
                          <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "1px" }}>{emp.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td style={{ padding: "14px 20px", fontSize: "12px", color: "#64748b", fontWeight: 500, whiteSpace: "nowrap" }}>{emp.role}</td>

                    {/* Department */}
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px", background: dc.bg, color: dc.color, whiteSpace: "nowrap" }}>{emp.dept}</span>
                    </td>

                    {/* Basic */}
                    <td style={{ padding: "14px 20px", fontSize: "13px", color: "#334155", fontWeight: 500 }}>₹{emp.basic.toLocaleString()}</td>

                    {/* HRA */}
                    <td style={{ padding: "14px 20px", fontSize: "13px", color: "#334155" }}>₹{emp.hra.toLocaleString()}</td>

                    {/* TA */}
                    <td style={{ padding: "14px 20px", fontSize: "13px", color: "#334155" }}>₹{emp.ta.toLocaleString()}</td>

                    {/* Deductions */}
                    <td style={{ padding: "14px 20px", fontSize: "13px", color: "#e11d48", fontWeight: 600 }}>-₹{emp.deductions.toLocaleString()}</td>

                    {/* Net Salary */}
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontSize: "15px", fontWeight: 800, color: "#16a34a" }}>₹{emp.net.toLocaleString()}</span>
                    </td>

                    {/* Bank */}
                    <td style={{ padding: "14px 20px", fontSize: "12px", color: "#64748b", whiteSpace: "nowrap", fontFamily: "monospace" }}>{emp.bank}</td>

                    {/* Status */}
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "5px 10px", borderRadius: "20px", background: sc.bg }}>
                        <StatusIcon size={12} color={sc.color} />
                        <span style={{ fontSize: "11px", fontWeight: 700, color: sc.color }}>{sc.label}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", gap: "4px" }}>
                        {[
                          { Icon: Eye,      hoverBg: "#eff6ff", color: "#2563eb", title: "View Slip" },
                          { Icon: Download, hoverBg: "#f0fdf4", color: "#16a34a", title: "Download"  },
                        ].map(({ Icon, hoverBg, color, title }, idx) => (
                          <button key={idx} title={title}
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
              <p style={{ fontSize: "14px", fontWeight: 600 }}>No records found</p>
              <p style={{ fontSize: "12px", marginTop: "4px" }}>Try adjusting your filters</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid #f8fafc", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: "12px", color: "#94a3b8" }}>
            Showing <strong style={{ color: "#334155" }}>{filtered.length}</strong> of <strong style={{ color: "#334155" }}>{payrollData.length}</strong> employees
          </p>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
            Net Payable: <span style={{ color: "#16a34a" }}>₹{filtered.reduce((s, e) => s + e.net, 0).toLocaleString()}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

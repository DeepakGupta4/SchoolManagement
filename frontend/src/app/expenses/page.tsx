"use client";
import React, { useState } from "react";
import { Plus, Search, Download, Edit, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const expenses = [
  { id: "EXP001", title: "Electricity Bill",        category: "Utilities",   amount: 18500,  date: "Jul 15, 2025", paidTo: "BSES Rajdhani",       method: "Online",  status: "paid",    recurring: true  },
  { id: "EXP002", title: "Lab Equipment Purchase",  category: "Equipment",   amount: 45000,  date: "Jul 12, 2025", paidTo: "Science Supplies Co.", method: "Cheque",  status: "paid",    recurring: false },
  { id: "EXP003", title: "Water Bill",              category: "Utilities",   amount: 4200,   date: "Jul 10, 2025", paidTo: "Delhi Jal Board",      method: "Online",  status: "paid",    recurring: true  },
  { id: "EXP004", title: "Stationery & Supplies",   category: "Supplies",    amount: 12800,  date: "Jul 08, 2025", paidTo: "Office Mart",          method: "Cash",    status: "paid",    recurring: false },
  { id: "EXP005", title: "Internet & Broadband",    category: "Utilities",   amount: 6500,   date: "Jul 05, 2025", paidTo: "Airtel Business",      method: "Online",  status: "paid",    recurring: true  },
  { id: "EXP006", title: "Building Maintenance",    category: "Maintenance", amount: 32000,  date: "Jul 03, 2025", paidTo: "FixIt Services",       method: "Cheque",  status: "paid",    recurring: false },
  { id: "EXP007", title: "Sports Equipment",        category: "Equipment",   amount: 28000,  date: "Jun 28, 2025", paidTo: "Sports World",         method: "Online",  status: "paid",    recurring: false },
  { id: "EXP008", title: "Canteen Raw Materials",   category: "Canteen",     amount: 22000,  date: "Jun 25, 2025", paidTo: "Fresh Mart",           method: "Cash",    status: "paid",    recurring: true  },
  { id: "EXP009", title: "Security Services",       category: "Services",    amount: 15000,  date: "Jul 18, 2025", paidTo: "SecureGuard Pvt Ltd",  method: "Online",  status: "pending", recurring: true  },
  { id: "EXP010", title: "Annual Software License", category: "Technology",  amount: 85000,  date: "Jul 20, 2025", paidTo: "EduSoft Solutions",    method: "Online",  status: "pending", recurring: true  },
];

const categoryColors: Record<string, { bg: string; color: string; border: string; emoji: string }> = {
  Utilities:   { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe", emoji: "⚡" },
  Equipment:   { bg: "#f5f3ff", color: "#7c3aed", border: "#ddd6fe", emoji: "🔧" },
  Supplies:    { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0", emoji: "📦" },
  Maintenance: { bg: "#fffbeb", color: "#d97706", border: "#fde68a", emoji: "🏗️" },
  Canteen:     { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa", emoji: "🍽️" },
  Services:    { bg: "#ecfeff", color: "#0891b2", border: "#a5f3fc", emoji: "🛡️" },
  Technology:  { bg: "#fdf4ff", color: "#9333ea", border: "#f0abfc", emoji: "💻" },
};

const monthlyData = [
  { month: "Feb", amount: 180000 },
  { month: "Mar", amount: 210000 },
  { month: "Apr", amount: 195000 },
  { month: "May", amount: 225000 },
  { month: "Jun", amount: 198000 },
  { month: "Jul", amount: 269000 },
];

const categoryBreakdown = Object.entries(
  expenses.reduce((acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc; }, {} as Record<string, number>)
).map(([name, value]) => ({ name, value, color: categoryColors[name]?.color ?? "#94a3b8" }));

const tooltipStyle = { borderRadius: "10px", border: "1px solid #f1f5f9", boxShadow: "0 8px 24px rgba(0,0,0,0.08)", fontSize: "12px", background: "#fff" };
const tabs = ["All", "Paid", "Pending"];

export default function ExpensesPage() {
  const [search, setSearch]       = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [catFilter, setCatFilter] = useState("All");

  const filtered = expenses.filter(e => {
    const matchTab    = activeTab === "All" || e.status === activeTab.toLowerCase();
    const matchCat    = catFilter === "All" || e.category === catFilter;
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
                        e.paidTo.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchCat && matchSearch;
  });

  const totalPaid    = expenses.filter(e => e.status === "paid").reduce((s, e) => s + e.amount, 0);
  const totalPending = expenses.filter(e => e.status === "pending").reduce((s, e) => s + e.amount, 0);
  const thisMonth    = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div style={{ maxWidth: "1600px", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>Expenses</h1>
          <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>Track and manage all school expenditures</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#fff", fontSize: "13px", fontWeight: 600, color: "#334155", cursor: "pointer" }}>
            <Download size={14} /> Export
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 18px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", fontSize: "13px", fontWeight: 600, color: "#fff", cursor: "pointer", boxShadow: "0 4px 12px rgba(99,102,241,0.35)" }}>
            <Plus size={14} /> Add Expense
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }}>
        {[
          { label: "Total This Month", value: `₹${thisMonth.toLocaleString()}`,   icon: "💸", color: "#6366f1", bg: "#eff6ff" },
          { label: "Paid",             value: `₹${totalPaid.toLocaleString()}`,    icon: "✅", color: "#16a34a", bg: "#f0fdf4" },
          { label: "Pending",          value: `₹${totalPending.toLocaleString()}`, icon: "⏳", color: "#d97706", bg: "#fffbeb" },
          { label: "Transactions",     value: expenses.length,                     icon: "📋", color: "#8b5cf6", bg: "#f5f3ff" },
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

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>

        {/* Monthly Trend */}
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
          <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #f8fafc" }}>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>Monthly Expense Trend</p>
            <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>Total expenditure per month</p>
          </div>
          <div style={{ padding: "16px 20px 20px" }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f8fafc" }} formatter={v => [`₹${Number(v).toLocaleString("en-IN")}`, "Amount"]} />
                <Bar dataKey="amount" fill="#6366f1" radius={[6, 6, 0, 0]} name="Amount" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
          <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #f8fafc" }}>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>By Category</p>
            <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>Current month breakdown</p>
          </div>
          <div style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={categoryBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                  {categoryBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={v => [`₹${Number(v).toLocaleString("en-IN")}`, ""]} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "6px" }}>
              {categoryBreakdown.map(c => {
                const cc = categoryColors[c.name] ?? { color: "#94a3b8" };
                return (
                  <div key={c.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "3px", background: cc.color, display: "inline-block" }} />
                      <span style={{ fontSize: "12px", color: "#64748b" }}>{c.name}</span>
                    </div>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a" }}>₹{c.value.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>

        {/* Toolbar */}
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

          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
            style={{ padding: "9px 14px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", cursor: "pointer" }}>
            <option value="All">All Categories</option>
            {Object.keys(categoryColors).map(c => <option key={c}>{c}</option>)}
          </select>

          <div style={{ position: "relative", flex: 1, maxWidth: "300px" }}>
            <Search size={14} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search expenses..."
              style={{ width: "100%", paddingLeft: "36px", paddingRight: "16px", paddingTop: "9px", paddingBottom: "9px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", fontFamily: "inherit" }}
              onFocus={e => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
              onBlur={e  => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
            />
          </div>
          <p style={{ marginLeft: "auto", fontSize: "12px", color: "#94a3b8" }}>{filtered.length} records</p>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#fafafa", borderBottom: "1px solid #f1f5f9" }}>
                {["Expense", "Category", "Paid To", "Date", "Method", "Recurring", "Amount", "Status", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => {
                const cc = categoryColors[e.category] ?? { bg: "#f8fafc", color: "#64748b", border: "#e2e8f0", emoji: "📌" };
                const isPaid = e.status === "paid";
                return (
                  <tr key={e.id}
                    style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f8fafc" : "none", transition: "background 0.15s" }}
                    onMouseEnter={ev => (ev.currentTarget as HTMLTableRowElement).style.background = "#fafafa"}
                    onMouseLeave={ev => (ev.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                  >
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: cc.bg, border: `1px solid ${cc.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "16px" }}>
                          {cc.emoji}
                        </div>
                        <div>
                          <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{e.title}</p>
                          <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "1px" }}>{e.id}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px", background: cc.bg, color: cc.color, border: `1px solid ${cc.border}` }}>{e.category}</span>
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: "13px", color: "#334155", whiteSpace: "nowrap" }}>{e.paidTo}</td>
                    <td style={{ padding: "14px 20px", fontSize: "12px", color: "#64748b", whiteSpace: "nowrap" }}>{e.date}</td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px", background: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0" }}>{e.method}</span>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      {e.recurring
                        ? <span style={{ fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px", background: "#eff6ff", color: "#2563eb" }}>🔄 Yes</span>
                        : <span style={{ fontSize: "12px", color: "#cbd5e1" }}>—</span>
                      }
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a" }}>₹{e.amount.toLocaleString()}</span>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, padding: "5px 10px", borderRadius: "20px", background: isPaid ? "#f0fdf4" : "#fffbeb", color: isPaid ? "#16a34a" : "#d97706" }}>
                        {isPaid ? "✓ Paid" : "⏳ Pending"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", gap: "4px" }}>
                        {[{ Icon: Edit, hoverBg: "#f0fdf4", color: "#16a34a" }, { Icon: Trash2, hoverBg: "#fff1f2", color: "#e11d48" }].map(({ Icon, hoverBg, color }, idx) => (
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
              <p style={{ fontSize: "14px", fontWeight: 600 }}>No expenses found</p>
              <p style={{ fontSize: "12px", marginTop: "4px" }}>Try adjusting your filters</p>
            </div>
          )}
        </div>

        <div style={{ padding: "14px 20px", borderTop: "1px solid #f8fafc", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: "12px", color: "#94a3b8" }}>
            Showing <strong style={{ color: "#334155" }}>{filtered.length}</strong> of <strong style={{ color: "#334155" }}>{expenses.length}</strong> expenses
          </p>
          <p style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
            Total: <span style={{ color: "#6366f1" }}>₹{filtered.reduce((s, e) => s + e.amount, 0).toLocaleString()}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

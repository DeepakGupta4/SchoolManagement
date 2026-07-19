"use client";
import React, { useState } from "react";
import { Plus, Search, Download, Edit, Trash2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const menuItems = [
  { id: "M001", name: "Veg Thali",        category: "Meals",    price: 45,  available: true,  sold: 120, emoji: "🍱" },
  { id: "M002", name: "Chicken Biryani",  category: "Meals",    price: 70,  available: true,  sold: 85,  emoji: "🍛" },
  { id: "M003", name: "Paneer Sandwich",  category: "Snacks",   price: 30,  available: true,  sold: 200, emoji: "🥪" },
  { id: "M004", name: "Cold Coffee",      category: "Drinks",   price: 25,  available: true,  sold: 310, emoji: "☕" },
  { id: "M005", name: "Samosa (2 pcs)",   category: "Snacks",   price: 15,  available: true,  sold: 450, emoji: "🥟" },
  { id: "M006", name: "Fresh Lime Soda",  category: "Drinks",   price: 20,  available: false, sold: 95,  emoji: "🍋" },
  { id: "M007", name: "Chole Bhature",    category: "Meals",    price: 55,  available: true,  sold: 60,  emoji: "🫓" },
  { id: "M008", name: "Fruit Bowl",       category: "Healthy",  price: 40,  available: true,  sold: 75,  emoji: "🍎" },
  { id: "M009", name: "Maggi Noodles",    category: "Snacks",   price: 25,  available: true,  sold: 380, emoji: "🍜" },
  { id: "M010", name: "Lassi",            category: "Drinks",   price: 30,  available: true,  sold: 140, emoji: "🥛" },
];

const orders = [
  { id: "ORD001", customer: "Rahul Sharma",   class: "10-A", items: "Veg Thali, Cold Coffee",    total: 70,  time: "12:05 PM", status: "delivered" },
  { id: "ORD002", customer: "Priya Singh",    class: "9-B",  items: "Samosa, Fresh Lime Soda",   total: 35,  time: "12:10 PM", status: "delivered" },
  { id: "ORD003", customer: "Amit Verma",     class: "11-C", items: "Chicken Biryani",           total: 70,  time: "12:15 PM", status: "preparing" },
  { id: "ORD004", customer: "Sneha Patel",    class: "8-A",  items: "Paneer Sandwich, Lassi",    total: 60,  time: "12:18 PM", status: "preparing" },
  { id: "ORD005", customer: "Karan Mehta",    class: "12-B", items: "Chole Bhature, Cold Coffee",total: 80,  time: "12:22 PM", status: "pending"   },
  { id: "ORD006", customer: "Divya Nair",     class: "7-C",  items: "Fruit Bowl, Lassi",         total: 70,  time: "12:25 PM", status: "pending"   },
  { id: "ORD007", customer: "Rohan Gupta",    class: "10-B", items: "Maggi Noodles",             total: 25,  time: "12:30 PM", status: "delivered" },
  { id: "ORD008", customer: "Ananya Joshi",   class: "9-A",  items: "Veg Thali",                 total: 45,  time: "12:35 PM", status: "cancelled" },
];

const salesData = [
  { day: "Mon", revenue: 4200 },
  { day: "Tue", revenue: 5800 },
  { day: "Wed", revenue: 4900 },
  { day: "Thu", revenue: 6300 },
  { day: "Fri", revenue: 7100 },
  { day: "Sat", revenue: 3200 },
];

const categoryColors: Record<string, { bg: string; color: string; border: string }> = {
  Meals:   { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" },
  Snacks:  { bg: "#fefce8", color: "#a16207", border: "#fef08a" },
  Drinks:  { bg: "#eff6ff", color: "#2563eb", border: "#bfdbfe" },
  Healthy: { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
};

const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
  delivered: { bg: "#f0fdf4", color: "#16a34a", label: "✓ Delivered" },
  preparing: { bg: "#fffbeb", color: "#d97706", label: "🔥 Preparing" },
  pending:   { bg: "#eff6ff", color: "#2563eb", label: "⏳ Pending"   },
  cancelled: { bg: "#fff1f2", color: "#e11d48", label: "✕ Cancelled"  },
};

const catPieData = Object.entries(
  menuItems.reduce((acc, m) => { acc[m.category] = (acc[m.category] || 0) + m.sold; return acc; }, {} as Record<string, number>)
).map(([name, value]) => ({ name, value, color: categoryColors[name]?.color ?? "#94a3b8" }));

const tooltipStyle = { borderRadius: "10px", border: "1px solid #f1f5f9", boxShadow: "0 8px 24px rgba(0,0,0,0.08)", fontSize: "12px", background: "#fff" };
const sections = ["Menu", "Orders"];
const tabs = ["All", "Delivered", "Preparing", "Pending", "Cancelled"];

export default function CanteenPage() {
  const [section, setSection]     = useState("Menu");
  const [search, setSearch]       = useState("");
  const [activeTab, setActiveTab] = useState("All");
  const [catFilter, setCatFilter] = useState("All");

  const filteredMenu = menuItems.filter(m =>
    (catFilter === "All" || m.category === catFilter) &&
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredOrders = orders.filter(o => {
    const matchTab    = activeTab === "All" || o.status === activeTab.toLowerCase();
    const matchSearch = o.customer.toLowerCase().includes(search.toLowerCase()) ||
                        o.items.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const todayRevenue  = orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
  const totalOrders   = orders.length;
  const delivered     = orders.filter(o => o.status === "delivered").length;
  const activeItems   = menuItems.filter(m => m.available).length;

  return (
    <div style={{ maxWidth: "1600px", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>Canteen</h1>
          <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>Manage menu, orders and daily sales</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#fff", fontSize: "13px", fontWeight: 600, color: "#334155", cursor: "pointer" }}>
            <Download size={14} /> Export
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 18px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", fontSize: "13px", fontWeight: 600, color: "#fff", cursor: "pointer", boxShadow: "0 4px 12px rgba(99,102,241,0.35)" }}>
            <Plus size={14} /> Add Item
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }}>
        {[
          { label: "Today's Revenue",  value: `₹${todayRevenue.toLocaleString()}`, icon: "💰", color: "#6366f1", bg: "#eff6ff" },
          { label: "Total Orders",     value: totalOrders,                          icon: "🧾", color: "#10b981", bg: "#f0fdf4" },
          { label: "Delivered",        value: delivered,                            icon: "✅", color: "#16a34a", bg: "#f0fdf4" },
          { label: "Active Menu Items",value: activeItems,                          icon: "🍽️", color: "#f59e0b", bg: "#fffbeb" },
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

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
          <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #f8fafc" }}>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>Weekly Revenue</p>
            <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>Daily canteen sales this week</p>
          </div>
          <div style={{ padding: "16px 20px 20px" }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={salesData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(1)}k`} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#f8fafc" }} formatter={v => [`₹${Number(v).toLocaleString()}`, "Revenue"]} />
                <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
          <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #f8fafc" }}>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>Sales by Category</p>
            <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>Items sold per category</p>
          </div>
          <div style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={catPieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                  {catPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} formatter={v => [`${v} sold`, ""]} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "6px" }}>
              {catPieData.map(c => (
                <div key={c.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "3px", background: c.color, display: "inline-block" }} />
                    <span style={{ fontSize: "12px", color: "#64748b" }}>{c.name}</span>
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "#0f172a" }}>{c.value} sold</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Section Toggle */}
      <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "14px", padding: "4px", gap: "4px", width: "fit-content" }}>
        {sections.map(s => (
          <button key={s} onClick={() => { setSection(s); setSearch(""); setActiveTab("All"); setCatFilter("All"); }}
            style={{ padding: "8px 24px", borderRadius: "11px", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 600, transition: "all 0.15s",
              background: section === s ? "#fff" : "transparent",
              color: section === s ? "#0f172a" : "#64748b",
              boxShadow: section === s ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
            }}>{s}</button>
        ))}
      </div>

      {/* Menu Section */}
      {section === "Menu" && (
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f8fafc", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
              style={{ padding: "9px 14px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", cursor: "pointer" }}>
              <option value="All">All Categories</option>
              {Object.keys(categoryColors).map(c => <option key={c}>{c}</option>)}
            </select>
            <div style={{ position: "relative", flex: 1, maxWidth: "300px" }}>
              <Search size={14} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search menu..."
                style={{ width: "100%", paddingLeft: "36px", paddingRight: "16px", paddingTop: "9px", paddingBottom: "9px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", fontFamily: "inherit" }}
                onFocus={e => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
                onBlur={e  => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
              />
            </div>
            <p style={{ marginLeft: "auto", fontSize: "12px", color: "#94a3b8" }}>{filteredMenu.length} items</p>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#fafafa", borderBottom: "1px solid #f1f5f9" }}>
                  {["Item", "Category", "Price", "Sold Today", "Status", "Actions"].map(h => (
                    <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredMenu.map((m, i) => {
                  const cc = categoryColors[m.category] ?? { bg: "#f8fafc", color: "#64748b", border: "#e2e8f0" };
                  return (
                    <tr key={m.id}
                      style={{ borderBottom: i < filteredMenu.length - 1 ? "1px solid #f8fafc" : "none", transition: "background 0.15s" }}
                      onMouseEnter={ev => (ev.currentTarget as HTMLTableRowElement).style.background = "#fafafa"}
                      onMouseLeave={ev => (ev.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                    >
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: cc.bg, border: `1px solid ${cc.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>{m.emoji}</div>
                          <div>
                            <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{m.name}</p>
                            <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "1px" }}>{m.id}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px", background: cc.bg, color: cc.color, border: `1px solid ${cc.border}` }}>{m.category}</span>
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: "15px", fontWeight: 800, color: "#0f172a" }}>₹{m.price}</td>
                      <td style={{ padding: "14px 20px", fontSize: "13px", fontWeight: 600, color: "#334155" }}>{m.sold}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, padding: "5px 10px", borderRadius: "20px", background: m.available ? "#f0fdf4" : "#fff1f2", color: m.available ? "#16a34a" : "#e11d48" }}>
                          {m.available ? "✓ Available" : "✕ Unavailable"}
                        </span>
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
          </div>
        </div>
      )}

      {/* Orders Section */}
      {section === "Orders" && (
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
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
            <div style={{ position: "relative", flex: 1, maxWidth: "300px" }}>
              <Search size={14} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders..."
                style={{ width: "100%", paddingLeft: "36px", paddingRight: "16px", paddingTop: "9px", paddingBottom: "9px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", fontFamily: "inherit" }}
                onFocus={e => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
                onBlur={e  => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
              />
            </div>
            <p style={{ marginLeft: "auto", fontSize: "12px", color: "#94a3b8" }}>{filteredOrders.length} orders</p>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#fafafa", borderBottom: "1px solid #f1f5f9" }}>
                  {["Order ID", "Customer", "Class", "Items", "Time", "Total", "Status"].map(h => (
                    <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((o, i) => {
                  const sc = statusConfig[o.status];
                  return (
                    <tr key={o.id}
                      style={{ borderBottom: i < filteredOrders.length - 1 ? "1px solid #f8fafc" : "none", transition: "background 0.15s" }}
                      onMouseEnter={ev => (ev.currentTarget as HTMLTableRowElement).style.background = "#fafafa"}
                      onMouseLeave={ev => (ev.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                    >
                      <td style={{ padding: "14px 20px", fontSize: "12px", fontWeight: 700, color: "#6366f1" }}>{o.id}</td>
                      <td style={{ padding: "14px 20px", fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{o.customer}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px", background: "#f5f3ff", color: "#7c3aed" }}>{o.class}</span>
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: "12px", color: "#64748b", maxWidth: "220px" }}>{o.items}</td>
                      <td style={{ padding: "14px 20px", fontSize: "12px", color: "#64748b", whiteSpace: "nowrap" }}>{o.time}</td>
                      <td style={{ padding: "14px 20px", fontSize: "15px", fontWeight: 800, color: "#0f172a" }}>₹{o.total}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, padding: "5px 10px", borderRadius: "20px", background: sc.bg, color: sc.color }}>{sc.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: "14px 20px", borderTop: "1px solid #f8fafc", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: "12px", color: "#94a3b8" }}>
              Showing <strong style={{ color: "#334155" }}>{filteredOrders.length}</strong> of <strong style={{ color: "#334155" }}>{orders.length}</strong> orders
            </p>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>
              Total: <span style={{ color: "#10b981" }}>₹{filteredOrders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.total, 0).toLocaleString()}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";
import React, { useState } from "react";
import { Search, Plus, Download, Edit, Trash2, Eye, AlertTriangle, Package, CheckCircle, Clock } from "lucide-react";

const inventory = [
  { id: "INV001", name: "A4 Paper Reams",         category: "Stationery",  qty: 120, minQty: 50,  unit: "Reams",  unitPrice: 280,   supplier: "Paper World",      lastUpdated: "Jul 15, 2025", status: "in-stock"   },
  { id: "INV002", name: "Whiteboard Markers",      category: "Stationery",  qty: 45,  minQty: 30,  unit: "Boxes",  unitPrice: 150,   supplier: "Office Mart",      lastUpdated: "Jul 12, 2025", status: "in-stock"   },
  { id: "INV003", name: "Printer Ink Cartridges",  category: "Electronics", qty: 8,   minQty: 10,  unit: "Pcs",    unitPrice: 1200,  supplier: "Tech Supplies",    lastUpdated: "Jul 10, 2025", status: "low-stock"  },
  { id: "INV004", name: "Classroom Chairs",        category: "Furniture",   qty: 240, minQty: 200, unit: "Pcs",    unitPrice: 2500,  supplier: "Furniture Hub",    lastUpdated: "Jun 20, 2025", status: "in-stock"   },
  { id: "INV005", name: "Projector Bulbs",         category: "Electronics", qty: 3,   minQty: 5,   unit: "Pcs",    unitPrice: 3500,  supplier: "Tech Supplies",    lastUpdated: "Jul 08, 2025", status: "low-stock"  },
  { id: "INV006", name: "Cleaning Supplies Kit",   category: "Housekeeping",qty: 60,  minQty: 20,  unit: "Kits",   unitPrice: 450,   supplier: "Clean Pro",        lastUpdated: "Jul 14, 2025", status: "in-stock"   },
  { id: "INV007", name: "Sports Balls (Football)", category: "Sports",      qty: 0,   minQty: 5,   unit: "Pcs",    unitPrice: 800,   supplier: "Sports World",     lastUpdated: "Jun 28, 2025", status: "out-of-stock"},
  { id: "INV008", name: "Lab Chemicals Set",       category: "Lab",         qty: 15,  minQty: 10,  unit: "Sets",   unitPrice: 5500,  supplier: "Science Depot",    lastUpdated: "Jul 05, 2025", status: "in-stock"   },
  { id: "INV009", name: "Notebooks (200 pages)",   category: "Stationery",  qty: 500, minQty: 100, unit: "Pcs",    unitPrice: 60,    supplier: "Paper World",      lastUpdated: "Jul 16, 2025", status: "in-stock"   },
  { id: "INV010", name: "First Aid Kits",          category: "Medical",     qty: 4,   minQty: 5,   unit: "Kits",   unitPrice: 1800,  supplier: "MedSupply Co.",    lastUpdated: "Jul 01, 2025", status: "low-stock"  },
  { id: "INV011", name: "Desktops / PCs",          category: "Electronics", qty: 42,  minQty: 40,  unit: "Pcs",    unitPrice: 35000, supplier: "Tech Supplies",    lastUpdated: "Apr 10, 2025", status: "in-stock"   },
  { id: "INV012", name: "Badminton Rackets",       category: "Sports",      qty: 12,  minQty: 8,   unit: "Pcs",    unitPrice: 600,   supplier: "Sports World",     lastUpdated: "Jun 15, 2025", status: "in-stock"   },
];

const purchases = [
  { id: "PO001", item: "A4 Paper Reams",        qty: 100, amount: 28000,  date: "Jul 15, 2025", supplier: "Paper World",   status: "received" },
  { id: "PO002", item: "Printer Ink Cartridges",qty: 10,  amount: 12000,  date: "Jul 18, 2025", supplier: "Tech Supplies", status: "ordered"  },
  { id: "PO003", item: "Sports Balls",          qty: 10,  amount: 8000,   date: "Jul 20, 2025", supplier: "Sports World",  status: "ordered"  },
  { id: "PO004", item: "First Aid Kits",        qty: 5,   amount: 9000,   date: "Jul 17, 2025", supplier: "MedSupply Co.", status: "received" },
  { id: "PO005", item: "Whiteboard Markers",    qty: 20,  amount: 3000,   date: "Jul 12, 2025", supplier: "Office Mart",   status: "received" },
];

const categoryColors: Record<string, { bg: string; color: string; emoji: string }> = {
  Stationery:   { bg: "#eff6ff", color: "#2563eb", emoji: "✏️" },
  Electronics:  { bg: "#f5f3ff", color: "#7c3aed", emoji: "💻" },
  Furniture:    { bg: "#fffbeb", color: "#d97706", emoji: "🪑" },
  Housekeeping: { bg: "#f0fdf4", color: "#16a34a", emoji: "🧹" },
  Sports:       { bg: "#fff1f2", color: "#e11d48", emoji: "⚽" },
  Lab:          { bg: "#ecfeff", color: "#0891b2", emoji: "🧪" },
  Medical:      { bg: "#fdf4ff", color: "#9333ea", emoji: "🏥" },
};

const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
  "in-stock":    { bg: "#f0fdf4", color: "#16a34a", label: "In Stock"     },
  "low-stock":   { bg: "#fffbeb", color: "#d97706", label: "Low Stock"    },
  "out-of-stock":{ bg: "#fff1f2", color: "#e11d48", label: "Out of Stock" },
};

const poStatus: Record<string, { bg: string; color: string; icon: React.ElementType }> = {
  received: { bg: "#f0fdf4", color: "#16a34a", icon: CheckCircle },
  ordered:  { bg: "#fffbeb", color: "#d97706", icon: Clock       },
};

const tabs = ["All", "In Stock", "Low Stock", "Out of Stock"];
const sections = ["Inventory", "Purchase Orders"];

export default function InventoryPage() {
  const [activeSection, setActiveSection] = useState("Inventory");
  const [activeTab, setActiveTab]         = useState("All");
  const [catFilter, setCatFilter]         = useState("All");
  const [search, setSearch]               = useState("");

  const filtered = inventory.filter(item => {
    const tabMap: Record<string, string> = { "In Stock": "in-stock", "Low Stock": "low-stock", "Out of Stock": "out-of-stock" };
    const matchTab    = activeTab === "All" || item.status === tabMap[activeTab];
    const matchCat    = catFilter === "All" || item.category === catFilter;
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                        item.id.toLowerCase().includes(search.toLowerCase()) ||
                        item.supplier.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchCat && matchSearch;
  });

  const lowStockItems  = inventory.filter(i => i.status === "low-stock").length;
  const outOfStock     = inventory.filter(i => i.status === "out-of-stock").length;
  const totalValue     = inventory.reduce((s, i) => s + i.qty * i.unitPrice, 0);

  return (
    <div style={{ maxWidth: "1600px", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>Inventory</h1>
          <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>Track school assets, stock levels and purchase orders</p>
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
          { label: "Total Items",    value: inventory.length,                icon: "📦", color: "#6366f1", bg: "#eff6ff" },
          { label: "Low Stock",      value: lowStockItems,                   icon: "⚠️", color: "#d97706", bg: "#fffbeb" },
          { label: "Out of Stock",   value: outOfStock,                      icon: "❌", color: "#e11d48", bg: "#fff1f2" },
          { label: "Total Value",    value: `₹${(totalValue/100000).toFixed(1)}L`, icon: "💰", color: "#16a34a", bg: "#f0fdf4" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>{s.icon}</div>
            <div>
              <p style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>{s.label}</p>
              <p style={{ fontSize: "24px", fontWeight: 800, color: s.color, lineHeight: 1.1, letterSpacing: "-0.5px" }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Low Stock Alert Banner */}
      {(lowStockItems > 0 || outOfStock > 0) && (
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "14px", padding: "14px 20px", display: "flex", alignItems: "center", gap: "12px" }}>
          <AlertTriangle size={18} color="#d97706" />
          <p style={{ fontSize: "13px", color: "#92400e", fontWeight: 600 }}>
            {outOfStock > 0 && <span style={{ color: "#e11d48" }}>{outOfStock} item(s) out of stock</span>}
            {outOfStock > 0 && lowStockItems > 0 && <span style={{ color: "#94a3b8", margin: "0 8px" }}>·</span>}
            {lowStockItems > 0 && <span>{lowStockItems} item(s) running low</span>}
            <span style={{ color: "#94a3b8", fontWeight: 400, marginLeft: "8px" }}>— Consider placing purchase orders</span>
          </p>
        </div>
      )}

      {/* Section Toggle */}
      <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "14px", padding: "4px", gap: "4px", width: "fit-content" }}>
        {sections.map(sec => (
          <button key={sec} onClick={() => { setActiveSection(sec); setSearch(""); }} style={{
            padding: "9px 24px", borderRadius: "11px", border: "none", cursor: "pointer",
            fontSize: "13px", fontWeight: 700, transition: "all 0.15s",
            background: activeSection === sec ? "#fff" : "transparent",
            color: activeSection === sec ? "#0f172a" : "#64748b",
            boxShadow: activeSection === sec ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
          }}>
            {sec === "Inventory" ? "📦 Inventory" : "🛒 Purchase Orders"}
          </button>
        ))}
      </div>

      {/* Inventory Table */}
      {activeSection === "Inventory" && (
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f8fafc", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", background: "#f8fafc", borderRadius: "12px", padding: "4px", gap: "2px" }}>
              {tabs.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  padding: "7px 12px", borderRadius: "9px", border: "none", cursor: "pointer",
                  fontSize: "12px", fontWeight: 600, transition: "all 0.15s", whiteSpace: "nowrap",
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
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items, suppliers..."
                style={{ width: "100%", paddingLeft: "36px", paddingRight: "16px", paddingTop: "9px", paddingBottom: "9px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", fontFamily: "inherit" }}
                onFocus={e => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
                onBlur={e  => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
              />
            </div>
            <p style={{ marginLeft: "auto", fontSize: "12px", color: "#94a3b8" }}>{filtered.length} items</p>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#fafafa", borderBottom: "1px solid #f1f5f9" }}>
                  {["Item", "Category", "Qty", "Min Qty", "Unit", "Unit Price", "Total Value", "Supplier", "Last Updated", "Status", "Actions"].map(h => (
                    <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => {
                  const cc = categoryColors[item.category] ?? { bg: "#f8fafc", color: "#64748b", emoji: "📌" };
                  const sc = statusConfig[item.status];
                  const stockPct = Math.min(Math.round((item.qty / (item.minQty * 2)) * 100), 100);
                  const barColor = item.status === "out-of-stock" ? "#e11d48" : item.status === "low-stock" ? "#d97706" : "#16a34a";
                  return (
                    <tr key={item.id}
                      style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f8fafc" : "none", transition: "background 0.15s" }}
                      onMouseEnter={ev => (ev.currentTarget as HTMLTableRowElement).style.background = "#fafafa"}
                      onMouseLeave={ev => (ev.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                    >
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: cc.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "18px" }}>
                            {cc.emoji}
                          </div>
                          <div>
                            <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{item.name}</p>
                            <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "1px" }}>{item.id}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px", background: cc.bg, color: cc.color }}>{item.category}</span>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <span style={{ fontSize: "15px", fontWeight: 800, color: barColor }}>{item.qty}</span>
                          <div style={{ width: "60px", height: "4px", background: "#f1f5f9", borderRadius: "99px", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${stockPct}%`, background: barColor, borderRadius: "99px" }} />
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: "13px", color: "#64748b" }}>{item.minQty}</td>
                      <td style={{ padding: "14px 20px", fontSize: "12px", color: "#64748b" }}>{item.unit}</td>
                      <td style={{ padding: "14px 20px", fontSize: "13px", color: "#334155", fontWeight: 500 }}>₹{item.unitPrice.toLocaleString()}</td>
                      <td style={{ padding: "14px 20px", fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>₹{(item.qty * item.unitPrice).toLocaleString()}</td>
                      <td style={{ padding: "14px 20px", fontSize: "12px", color: "#64748b", whiteSpace: "nowrap" }}>{item.supplier}</td>
                      <td style={{ padding: "14px 20px", fontSize: "12px", color: "#94a3b8", whiteSpace: "nowrap" }}>{item.lastUpdated}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, padding: "5px 10px", borderRadius: "20px", background: sc.bg, color: sc.color, whiteSpace: "nowrap" }}>{sc.label}</span>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", gap: "4px" }}>
                          {[{ Icon: Edit, hoverBg: "#f0fdf4", color: "#16a34a" }, { Icon: Trash2, hoverBg: "#fff1f2", color: "#e11d48" }].map(({ Icon, hoverBg, color }, idx) => (
                            <button key={idx}
                              style={{ padding: "7px", borderRadius: "9px", border: "none", background: "transparent", cursor: "pointer", color: "#94a3b8", display: "flex", transition: "all 0.15s" }}
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

      {/* Purchase Orders */}
      {activeSection === "Purchase Orders" && (
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f8fafc", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>Recent Purchase Orders</p>
            <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", fontSize: "12px", fontWeight: 600, color: "#fff", cursor: "pointer" }}>
              <Plus size={13} /> New Order
            </button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#fafafa", borderBottom: "1px solid #f1f5f9" }}>
                  {["PO ID", "Item", "Quantity", "Amount", "Supplier", "Order Date", "Status"].map(h => (
                    <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {purchases.map((po, i) => {
                  const ps = poStatus[po.status];
                  const StatusIcon = ps.icon;
                  return (
                    <tr key={po.id}
                      style={{ borderBottom: i < purchases.length - 1 ? "1px solid #f8fafc" : "none", transition: "background 0.15s" }}
                      onMouseEnter={ev => (ev.currentTarget as HTMLTableRowElement).style.background = "#fafafa"}
                      onMouseLeave={ev => (ev.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                    >
                      <td style={{ padding: "14px 20px", fontSize: "12px", fontWeight: 700, color: "#6366f1" }}>{po.id}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Package size={14} color="#6366f1" />
                          </div>
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{po.item}</span>
                        </div>
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: "13px", fontWeight: 600, color: "#334155" }}>{po.qty} units</td>
                      <td style={{ padding: "14px 20px", fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>₹{po.amount.toLocaleString()}</td>
                      <td style={{ padding: "14px 20px", fontSize: "13px", color: "#64748b" }}>{po.supplier}</td>
                      <td style={{ padding: "14px 20px", fontSize: "12px", color: "#64748b" }}>{po.date}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "5px 10px", borderRadius: "20px", background: ps.bg }}>
                          <StatusIcon size={12} color={ps.color} />
                          <span style={{ fontSize: "11px", fontWeight: 700, color: ps.color, textTransform: "capitalize" }}>{po.status}</span>
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
    </div>
  );
}

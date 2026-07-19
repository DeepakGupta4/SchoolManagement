"use client";
import React from "react";
import Link from "next/link";
import {
  DollarSign, TrendingUp, TrendingDown, AlertTriangle,
  Users, CheckCircle, Clock, ArrowRight, CreditCard,
  Receipt, BookOpen, Award,
} from "lucide-react";

const stats = [
  { label: "Total Collected",   value: "₹24,85,000", sub: "+12% this month", icon: "💰", color: "#16a34a", bg: "#f0fdf4", trend: "up" },
  { label: "Pending Fees",      value: "₹3,42,500",  sub: "148 students",    icon: "⏳", color: "#d97706", bg: "#fffbeb", trend: "down" },
  { label: "Defaulters",        value: "42",          sub: "Need follow-up",  icon: "⚠️", color: "#e11d48", bg: "#fff1f2", trend: "down" },
  { label: "Scholarships",      value: "38",          sub: "Active awards",   icon: "🎓", color: "#7c3aed", bg: "#f5f3ff", trend: "up" },
];

const recentPayments = [
  { id: "RCP001", student: "Arjun Sharma",   class: "10-A", amount: "₹12,500", date: "Jul 18, 2025", method: "Online",  status: "paid" },
  { id: "RCP002", student: "Priya Patel",    class: "9-B",  amount: "₹11,000", date: "Jul 17, 2025", method: "Cash",    status: "paid" },
  { id: "RCP003", student: "Rahul Verma",    class: "11-A", amount: "₹13,500", date: "Jul 16, 2025", method: "Cheque",  status: "pending" },
  { id: "RCP004", student: "Sneha Gupta",    class: "8-B",  amount: "₹9,500",  date: "Jul 15, 2025", method: "Online",  status: "paid" },
  { id: "RCP005", student: "Karan Mehta",    class: "12-A", amount: "₹15,000", date: "Jul 14, 2025", method: "Online",  status: "paid" },
];

const quickLinks = [
  { title: "Fee Structure",  desc: "Define class-wise fee heads",    href: "/fees/structure",    icon: BookOpen,  color: "#6366f1", bg: "#eff6ff" },
  { title: "Collect Fee",    desc: "Record new fee payments",        href: "/fees/collect",      icon: CreditCard,color: "#16a34a", bg: "#f0fdf4" },
  { title: "Receipts",       desc: "View & print fee receipts",      href: "/fees/receipts",     icon: Receipt,   color: "#2563eb", bg: "#dbeafe" },
  { title: "Defaulters",     desc: "Students with pending dues",     href: "/fees/defaulters",   icon: AlertTriangle, color: "#e11d48", bg: "#fff1f2" },
  { title: "Scholarships",   desc: "Manage fee concessions",        href: "/fees/scholarships", icon: Award,     color: "#7c3aed", bg: "#f5f3ff" },
];

const monthlyData = [
  { month: "Feb", collected: 18, pending: 4 },
  { month: "Mar", collected: 22, pending: 3 },
  { month: "Apr", collected: 20, pending: 5 },
  { month: "May", collected: 25, pending: 2 },
  { month: "Jun", collected: 23, pending: 4 },
  { month: "Jul", collected: 24, pending: 3 },
];
const maxVal = 30;

export default function FeesPage() {
  return (
    <div style={{ maxWidth: "1600px", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>Fee Management</h1>
          <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>Track collections, dues, and scholarships</p>
        </div>
        <Link href="/fees/collect" style={{
          display: "flex", alignItems: "center", gap: "6px", padding: "9px 18px",
          borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
          fontSize: "13px", fontWeight: 600, color: "#fff", cursor: "pointer",
          boxShadow: "0 4px 12px rgba(99,102,241,0.35)", textDecoration: "none",
        }}>
          <DollarSign size={14} /> Collect Fee
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>
              {s.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>{s.label}</p>
              <p style={{ fontSize: "22px", fontWeight: 800, color: s.color, lineHeight: 1.1, letterSpacing: "-0.5px" }}>{s.value}</p>
              <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                {s.trend === "up" ? <TrendingUp size={11} color="#16a34a" /> : <TrendingDown size={11} color="#e11d48" />}
                <span style={{ fontSize: "11px", color: "#94a3b8" }}>{s.sub}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: "14px" }}>
        {quickLinks.map(q => {
          const Icon = q.icon;
          return (
            <Link key={q.href} href={q.href} style={{ textDecoration: "none" }}>
              <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", cursor: "pointer", transition: "all 0.15s", display: "flex", flexDirection: "column", gap: "12px" }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}
              >
                <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: q.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={20} color={q.color} />
                </div>
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{q.title}</p>
                  <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "3px" }}>{q.desc}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 600, color: q.color }}>
                  Open <ArrowRight size={11} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Bottom Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

        {/* Monthly Chart */}
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
          <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #f8fafc" }}>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>Monthly Collection</p>
            <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>Collected vs Pending (in Lakhs ₹)</p>
          </div>
          <div style={{ padding: "20px" }}>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "16px", height: "140px" }}>
              {monthlyData.map(d => (
                <div key={d.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", height: "100%" }}>
                  <div style={{ flex: 1, width: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: "3px" }}>
                    <div style={{ width: "100%", height: `${(d.pending / maxVal) * 100}%`, background: "#fee2e2", borderRadius: "4px 4px 0 0", minHeight: "4px" }} />
                    <div style={{ width: "100%", height: `${(d.collected / maxVal) * 100}%`, background: "linear-gradient(180deg,#6366f1,#8b5cf6)", borderRadius: "4px 4px 0 0", minHeight: "8px" }} />
                  </div>
                  <span style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 600 }}>{d.month}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "16px", marginTop: "14px" }}>
              {[{ color: "linear-gradient(135deg,#6366f1,#8b5cf6)", label: "Collected" }, { color: "#fee2e2", label: "Pending", border: "1px solid #fca5a5" }].map(l => (
                <div key={l.label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "3px", background: l.color, border: l.border, flexShrink: 0 }} />
                  <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 500 }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Payments */}
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
          <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #f8fafc", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>Recent Payments</p>
              <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>Latest fee transactions</p>
            </div>
            <Link href="/fees/receipts" style={{ fontSize: "12px", fontWeight: 600, color: "#6366f1", textDecoration: "none" }}>View all →</Link>
          </div>
          <div>
            {recentPayments.map((p, i) => (
              <div key={p.id} style={{ padding: "12px 20px", borderBottom: i < recentPayments.length - 1 ? "1px solid #f8fafc" : "none", display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: p.status === "paid" ? "#f0fdf4" : "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {p.status === "paid" ? <CheckCircle size={16} color="#16a34a" /> : <Clock size={16} color="#d97706" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.student}</p>
                  <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "1px" }}>Class {p.class} · {p.date} · {p.method}</p>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{p.amount}</p>
                  <span style={{ fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "20px", background: p.status === "paid" ? "#f0fdf4" : "#fffbeb", color: p.status === "paid" ? "#16a34a" : "#d97706" }}>
                    {p.status === "paid" ? "Paid" : "Pending"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

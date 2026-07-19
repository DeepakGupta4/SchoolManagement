"use client";
import React, { useState } from "react";
import { Search, Plus, Download, Eye, Check, X, CalendarDays, Clock, CheckCircle, XCircle, Users } from "lucide-react";

const leaveRequests = [
  { id: "LV001", name: "Mr. Suresh Kumar",   role: "History Teacher",    type: "Sick Leave",    from: "14 Jul 2025", to: "16 Jul 2025", days: 3, reason: "Fever and cold",          status: "Pending",  dept: "Teaching" },
  { id: "LV002", name: "Ms. Kavita Joshi",   role: "Librarian",          type: "Casual Leave",  from: "18 Jul 2025", to: "18 Jul 2025", days: 1, reason: "Personal work",           status: "Approved", dept: "Library" },
  { id: "LV003", name: "Mr. Anil Kumar",     role: "Accountant",         type: "Earned Leave",  from: "21 Jul 2025", to: "25 Jul 2025", days: 5, reason: "Family function",         status: "Approved", dept: "Finance" },
  { id: "LV004", name: "Ms. Rekha Iyer",     role: "Counselor",          type: "Sick Leave",    from: "10 Jul 2025", to: "11 Jul 2025", days: 2, reason: "Medical checkup",         status: "Rejected", dept: "HR" },
  { id: "LV005", name: "Mr. Deepak Singh",   role: "Security Head",      type: "Casual Leave",  from: "20 Jul 2025", to: "20 Jul 2025", days: 1, reason: "Personal",               status: "Pending",  dept: "Security" },
  { id: "LV006", name: "Dr. Priya Sharma",   role: "Math Teacher",       type: "Maternity Leave",from:"01 Aug 2025", to: "30 Oct 2025", days: 90, reason: "Maternity",             status: "Approved", dept: "Teaching" },
  { id: "LV007", name: "Mr. Rahul Verma",    role: "Physics Teacher",    type: "Earned Leave",  from: "28 Jul 2025", to: "30 Jul 2025", days: 3, reason: "Vacation",               status: "Pending",  dept: "Teaching" },
  { id: "LV008", name: "Ms. Anita Gupta",    role: "Receptionist",       type: "Sick Leave",    from: "15 Jul 2025", to: "15 Jul 2025", days: 1, reason: "Not feeling well",        status: "Approved", dept: "Administration" },
  { id: "LV009", name: "Mr. Vinod Tiwari",   role: "Canteen Manager",    type: "Casual Leave",  from: "22 Jul 2025", to: "22 Jul 2025", days: 1, reason: "Personal work",           status: "Pending",  dept: "Canteen" },
  { id: "LV010", name: "Ms. Pooja Mehta",    role: "HR Manager",         type: "Earned Leave",  from: "04 Aug 2025", to: "08 Aug 2025", days: 5, reason: "Annual vacation",         status: "Approved", dept: "HR" },
];

const leaveBalance = [
  { name: "Dr. Priya Sharma",  dept: "Teaching",      sick: 12, casual: 12, earned: 15, used: 90, remaining: 0 },
  { name: "Mr. Rahul Verma",   dept: "Teaching",      sick: 10, casual: 11, earned: 12, used: 3,  remaining: 30 },
  { name: "Mr. Anil Kumar",    dept: "Finance",       sick: 12, casual: 12, earned: 10, used: 5,  remaining: 29 },
  { name: "Ms. Pooja Mehta",   dept: "HR",            sick: 12, casual: 12, earned: 10, used: 5,  remaining: 29 },
  { name: "Mr. Deepak Singh",  dept: "Security",      sick: 12, casual: 11, earned: 15, used: 1,  remaining: 37 },
  { name: "Ms. Kavita Joshi",  dept: "Library",       sick: 12, casual: 11, earned: 15, used: 1,  remaining: 37 },
];

const statusStyle: Record<string, { bg: string; color: string }> = {
  Pending:  { bg: "#fffbeb", color: "#d97706" },
  Approved: { bg: "#f0fdf4", color: "#16a34a" },
  Rejected: { bg: "#fff1f2", color: "#e11d48" },
};

const leaveTypeColor: Record<string, { bg: string; color: string }> = {
  "Sick Leave":      { bg: "#fff1f2", color: "#e11d48" },
  "Casual Leave":    { bg: "#eff6ff", color: "#2563eb" },
  "Earned Leave":    { bg: "#f0fdf4", color: "#16a34a" },
  "Maternity Leave": { bg: "#fdf4ff", color: "#9333ea" },
};

const tabs = ["Requests", "Leave Balance"] as const;

export default function LeavePage() {
  const [tab, setTab]               = useState<typeof tabs[number]>("Requests");
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter]     = useState("All");

  const filtered = leaveRequests.filter(l => {
    const matchSearch = l.name.toLowerCase().includes(search.toLowerCase()) ||
                        l.id.toLowerCase().includes(search.toLowerCase()) ||
                        l.dept.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || l.status === statusFilter;
    const matchType   = typeFilter === "All" || l.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const pending  = leaveRequests.filter(l => l.status === "Pending").length;
  const approved = leaveRequests.filter(l => l.status === "Approved").length;
  const rejected = leaveRequests.filter(l => l.status === "Rejected").length;
  const onLeave  = leaveRequests.filter(l => l.status === "Approved").reduce((s, l) => s + (l.days <= 5 ? 1 : 0), 0);

  return (
    <div style={{ maxWidth: "1600px", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>Leave Management</h1>
          <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>Track and manage staff leave requests</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#fff", fontSize: "13px", fontWeight: 600, color: "#334155", cursor: "pointer" }}>
            <Download size={14} /> Export
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 18px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#10b981,#059669)", fontSize: "13px", fontWeight: 600, color: "#fff", cursor: "pointer", boxShadow: "0 4px 12px rgba(16,185,129,0.35)" }}>
            <Plus size={14} /> Apply Leave
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }}>
        {[
          { label: "Pending",  value: pending,  icon: <Clock size={22} />,        color: "#d97706", bg: "#fffbeb" },
          { label: "Approved", value: approved, icon: <CheckCircle size={22} />,  color: "#16a34a", bg: "#f0fdf4" },
          { label: "Rejected", value: rejected, icon: <XCircle size={22} />,      color: "#e11d48", bg: "#fff1f2" },
          { label: "On Leave Today", value: onLeave, icon: <Users size={22} />,   color: "#6366f1", bg: "#eff6ff" },
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

      {/* Table Card */}
      <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>

        {/* Toolbar */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f8fafc", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", background: "#f8fafc", borderRadius: "12px", padding: "4px", gap: "2px" }}>
            {tabs.map(t => (
              <button key={t} onClick={() => { setTab(t); setSearch(""); setStatusFilter("All"); setTypeFilter("All"); }} style={{
                padding: "7px 18px", borderRadius: "9px", border: "none", cursor: "pointer",
                fontSize: "12px", fontWeight: 600, transition: "all 0.15s",
                background: tab === t ? "#fff" : "transparent",
                color: tab === t ? "#0f172a" : "#64748b",
                boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}>{t}</button>
            ))}
          </div>

          {tab === "Requests" && (
            <>
              <div style={{ position: "relative", flex: 1, maxWidth: "280px" }}>
                <Search size={14} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or ID..."
                  style={{ width: "100%", paddingLeft: "36px", paddingRight: "16px", paddingTop: "9px", paddingBottom: "9px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", fontFamily: "inherit" }}
                  onFocus={e => { e.target.style.borderColor = "#10b981"; e.target.style.boxShadow = "0 0 0 3px rgba(16,185,129,0.1)"; }}
                  onBlur={e  => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
                />
              </div>
              <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                style={{ padding: "9px 14px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", cursor: "pointer" }}>
                <option value="All">All Types</option>
                {["Sick Leave", "Casual Leave", "Earned Leave", "Maternity Leave"].map(t => <option key={t}>{t}</option>)}
              </select>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                style={{ padding: "9px 14px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", cursor: "pointer" }}>
                <option value="All">All Status</option>
                {["Pending", "Approved", "Rejected"].map(s => <option key={s}>{s}</option>)}
              </select>
              <p style={{ marginLeft: "auto", fontSize: "12px", color: "#94a3b8" }}>{filtered.length} requests</p>
            </>
          )}
        </div>

        {/* Requests Table */}
        {tab === "Requests" && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#fafafa", borderBottom: "1px solid #f1f5f9" }}>
                  {["Staff Member", "Leave Type", "From", "To", "Days", "Reason", "Status", "Actions"].map(h => (
                    <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((l, i) => {
                  const ss = statusStyle[l.status];
                  const lt = leaveTypeColor[l.type] ?? { bg: "#f8fafc", color: "#64748b" };
                  return (
                    <tr key={l.id}
                      style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f8fafc" : "none", transition: "background 0.15s" }}
                      onMouseEnter={ev => (ev.currentTarget as HTMLTableRowElement).style.background = "#fafafa"}
                      onMouseLeave={ev => (ev.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                    >
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "38px", height: "38px", borderRadius: "12px", background: "linear-gradient(135deg,#10b981,#059669)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "14px", fontWeight: 700, flexShrink: 0 }}>
                            {l.name.charAt(0)}
                          </div>
                          <div>
                            <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{l.name}</p>
                            <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "1px" }}>{l.role}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px", background: lt.bg, color: lt.color }}>{l.type}</span>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "#64748b" }}>
                          <CalendarDays size={12} color="#94a3b8" />{l.from}
                        </div>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "#64748b" }}>
                          <CalendarDays size={12} color="#94a3b8" />{l.to}
                        </div>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "#6366f1", background: "#eff6ff", padding: "4px 10px", borderRadius: "8px" }}>{l.days}d</span>
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: "12px", color: "#64748b", maxWidth: "180px" }}>
                        <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.reason}</span>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, padding: "5px 10px", borderRadius: "20px", background: ss.bg, color: ss.color }}>{l.status}</span>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", gap: "4px" }}>
                          {l.status === "Pending" ? (
                            <>
                              {[{ Icon: Check, hoverBg: "#f0fdf4", color: "#16a34a" }, { Icon: X, hoverBg: "#fff1f2", color: "#e11d48" }].map(({ Icon, hoverBg, color }, idx) => (
                                <button key={idx}
                                  style={{ padding: "7px", borderRadius: "9px", border: "none", background: "transparent", cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center", transition: "all 0.15s" }}
                                  onMouseEnter={ev => { (ev.currentTarget as HTMLButtonElement).style.background = hoverBg; (ev.currentTarget as HTMLButtonElement).style.color = color; }}
                                  onMouseLeave={ev => { (ev.currentTarget as HTMLButtonElement).style.background = "transparent"; (ev.currentTarget as HTMLButtonElement).style.color = "#94a3b8"; }}
                                ><Icon size={14} /></button>
                              ))}
                            </>
                          ) : (
                            <button
                              style={{ padding: "7px", borderRadius: "9px", border: "none", background: "transparent", cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center", transition: "all 0.15s" }}
                              onMouseEnter={ev => { (ev.currentTarget as HTMLButtonElement).style.background = "#eff6ff"; (ev.currentTarget as HTMLButtonElement).style.color = "#2563eb"; }}
                              onMouseLeave={ev => { (ev.currentTarget as HTMLButtonElement).style.background = "transparent"; (ev.currentTarget as HTMLButtonElement).style.color = "#94a3b8"; }}
                            ><Eye size={14} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px", color: "#94a3b8" }}>
                <CalendarDays size={40} color="#e2e8f0" style={{ margin: "0 auto 12px" }} />
                <p style={{ fontSize: "14px", fontWeight: 600 }}>No leave requests found</p>
              </div>
            )}
          </div>
        )}

        {/* Leave Balance Table */}
        {tab === "Leave Balance" && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#fafafa", borderBottom: "1px solid #f1f5f9" }}>
                  {["Staff Member", "Department", "Sick Leave", "Casual Leave", "Earned Leave", "Used", "Remaining", "Usage"].map(h => (
                    <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {leaveBalance.map((b, i) => {
                  const total = b.sick + b.casual + b.earned;
                  const pct   = Math.min(Math.round((b.used / total) * 100), 100);
                  const barColor = pct >= 80 ? "#e11d48" : pct >= 50 ? "#d97706" : "#16a34a";
                  return (
                    <tr key={b.name}
                      style={{ borderBottom: i < leaveBalance.length - 1 ? "1px solid #f8fafc" : "none", transition: "background 0.15s" }}
                      onMouseEnter={ev => (ev.currentTarget as HTMLTableRowElement).style.background = "#fafafa"}
                      onMouseLeave={ev => (ev.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                    >
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "38px", height: "38px", borderRadius: "12px", background: "linear-gradient(135deg,#10b981,#059669)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "14px", fontWeight: 700, flexShrink: 0 }}>
                            {b.name.charAt(0)}
                          </div>
                          <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{b.name}</p>
                        </div>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px", background: "#eff6ff", color: "#2563eb" }}>{b.dept}</span>
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: "13px", fontWeight: 700, color: "#e11d48" }}>{b.sick}</td>
                      <td style={{ padding: "14px 20px", fontSize: "13px", fontWeight: 700, color: "#2563eb" }}>{b.casual}</td>
                      <td style={{ padding: "14px 20px", fontSize: "13px", fontWeight: 700, color: "#16a34a" }}>{b.earned}</td>
                      <td style={{ padding: "14px 20px", fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{b.used}</td>
                      <td style={{ padding: "14px 20px", fontSize: "13px", fontWeight: 700, color: "#6366f1" }}>{b.remaining}</td>
                      <td style={{ padding: "14px 20px", minWidth: "140px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ flex: 1, height: "6px", background: "#f1f5f9", borderRadius: "99px", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: "99px" }} />
                          </div>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: barColor, minWidth: "32px" }}>{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid #f8fafc", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: "12px", color: "#94a3b8" }}>
            {tab === "Requests"
              ? <><strong style={{ color: "#334155" }}>{filtered.length}</strong> of <strong style={{ color: "#334155" }}>{leaveRequests.length}</strong> requests</>
              : <><strong style={{ color: "#334155" }}>{leaveBalance.length}</strong> staff members</>
            }
          </p>
          {tab === "Requests" && (
            <div style={{ display: "flex", gap: "16px" }}>
              {["Pending", "Approved", "Rejected"].map(st => {
                const ss = statusStyle[st];
                const count = filtered.filter(l => l.status === st).length;
                return (
                  <div key={st} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: ss.color, display: "inline-block" }} />
                    <span style={{ fontSize: "12px", color: "#64748b" }}>{st}: <strong style={{ color: "#0f172a" }}>{count}</strong></span>
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

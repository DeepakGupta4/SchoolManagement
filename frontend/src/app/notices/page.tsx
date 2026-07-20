"use client";
import React, { useState } from "react";
import { Search, Plus, Download, Edit, Trash2, Eye, Pin, FileText, AlertCircle, Info, CheckCircle, Calendar } from "lucide-react";

const notices = [
  { id: "NC001", title: "Mid-Term Exam Schedule",          body: "Mid-term exams for classes 6–12 will be held from 28 July to 5 August 2025. Detailed timetable attached.",  category: "Exam",      audience: "Students", date: "10 Jul 2025", expiry: "28 Jul 2025", pinned: true,  priority: "High",   postedBy: "Exam Cell"  },
  { id: "NC002", title: "Fee Payment Last Date",           body: "Last date for Q2 fee payment is 20 July 2025. Students with pending fees will not be allowed in exams.",      category: "Finance",   audience: "Parents",  date: "11 Jul 2025", expiry: "20 Jul 2025", pinned: true,  priority: "High",   postedBy: "Accounts"   },
  { id: "NC003", title: "Annual Sports Day",               body: "Annual Sports Day will be held on 28 July 2025. Registration for events open till 22 July.",                  category: "Event",     audience: "All",      date: "12 Jul 2025", expiry: "28 Jul 2025", pinned: true,  priority: "Medium", postedBy: "Sports Dept"},
  { id: "NC004", title: "Library Book Return Notice",      body: "All students must return borrowed library books by 25 July 2025 to avoid fine.",                              category: "General",   audience: "Students", date: "13 Jul 2025", expiry: "25 Jul 2025", pinned: false, priority: "Low",    postedBy: "Librarian"  },
  { id: "NC005", title: "Holiday – Eid Celebration",       body: "School will remain closed on 17 July 2025 on account of Eid. Classes resume on 18 July.",                    category: "Holiday",   audience: "All",      date: "14 Jul 2025", expiry: "17 Jul 2025", pinned: false, priority: "Medium", postedBy: "Admin"      },
  { id: "NC006", title: "Parent-Teacher Meeting",          body: "PTM for classes 9–12 scheduled on 26 July 2025 from 9 AM to 1 PM. Attendance is mandatory for parents.",     category: "Meeting",   audience: "Parents",  date: "14 Jul 2025", expiry: "26 Jul 2025", pinned: false, priority: "High",   postedBy: "Principal"  },
  { id: "NC007", title: "New Canteen Menu",                body: "Updated canteen menu effective from 21 July 2025. Healthy meal options added for all students.",              category: "General",   audience: "All",      date: "15 Jul 2025", expiry: "31 Jul 2025", pinned: false, priority: "Low",    postedBy: "Canteen"    },
  { id: "NC008", title: "Staff Training Workshop",         body: "Mandatory training workshop for all teaching staff on 19 July 2025 from 10 AM to 3 PM in the auditorium.",   category: "Meeting",   audience: "Staff",    date: "15 Jul 2025", expiry: "19 Jul 2025", pinned: false, priority: "High",   postedBy: "HR Dept"    },
  { id: "NC009", title: "Science Exhibition Registration", body: "Students interested in the Science Exhibition (Aug 10) must register with their class teacher by 25 July.",  category: "Event",     audience: "Students", date: "16 Jul 2025", expiry: "25 Jul 2025", pinned: false, priority: "Medium", postedBy: "Science Dept"},
  { id: "NC010", title: "Bus Route Update",                body: "New bus stops added in Sector 14 and Sector 18 from 21 July 2025. Contact transport office for details.",     category: "Transport", audience: "Parents",  date: "16 Jul 2025", expiry: "21 Jul 2025", pinned: false, priority: "Low",    postedBy: "Transport"  },
];

const categoryConfig: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
  Exam:      { bg: "#fff7ed", color: "#ea580c", icon: <FileText size={13} />   },
  Finance:   { bg: "#f0fdf4", color: "#16a34a", icon: <AlertCircle size={13} />},
  Event:     { bg: "#eff6ff", color: "#2563eb", icon: <Calendar size={13} />   },
  General:   { bg: "#f8fafc", color: "#64748b", icon: <Info size={13} />       },
  Holiday:   { bg: "#fff1f2", color: "#e11d48", icon: <CheckCircle size={13} />},
  Meeting:   { bg: "#fdf4ff", color: "#9333ea", icon: <FileText size={13} />   },
  Transport: { bg: "#ecfeff", color: "#0891b2", icon: <Info size={13} />       },
};

const priorityConfig: Record<string, { bg: string; color: string }> = {
  High:   { bg: "#fff1f2", color: "#e11d48" },
  Medium: { bg: "#fffbeb", color: "#d97706" },
  Low:    { bg: "#f0fdf4", color: "#16a34a" },
};

const audienceColor: Record<string, { bg: string; color: string }> = {
  All:      { bg: "#f5f3ff", color: "#7c3aed" },
  Parents:  { bg: "#fffbeb", color: "#d97706" },
  Staff:    { bg: "#ecfeff", color: "#0891b2" },
  Students: { bg: "#f0fdf4", color: "#16a34a" },
};

export default function NoticesPage() {
  const [search, setSearch]             = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [audienceFilter, setAudienceFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  const filtered = notices.filter(n => {
    const matchSearch   = n.title.toLowerCase().includes(search.toLowerCase()) ||
                          n.body.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "All" || n.category === categoryFilter;
    const matchAudience = audienceFilter === "All" || n.audience === audienceFilter;
    const matchPriority = priorityFilter === "All" || n.priority === priorityFilter;
    return matchSearch && matchCategory && matchAudience && matchPriority;
  });

  const pinned = notices.filter(n => n.pinned);
  const high   = notices.filter(n => n.priority === "High").length;

  return (
    <div style={{ maxWidth: "1400px", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>Notice Board</h1>
          <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>Post and manage official school notices</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#fff", fontSize: "13px", fontWeight: 600, color: "#334155", cursor: "pointer" }}>
            <Download size={14} /> Export
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 18px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", fontSize: "13px", fontWeight: 600, color: "#fff", cursor: "pointer", boxShadow: "0 4px 12px rgba(99,102,241,0.35)" }}>
            <Plus size={14} /> Post Notice
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }}>
        {[
          { label: "Total Notices", value: notices.length,  icon: <FileText size={22} />,    color: "#6366f1", bg: "#eff6ff" },
          { label: "Pinned",        value: pinned.length,   icon: <Pin size={22} />,          color: "#d97706", bg: "#fffbeb" },
          { label: "High Priority", value: high,            icon: <AlertCircle size={22} />,  color: "#e11d48", bg: "#fff1f2" },
          { label: "Categories",    value: Object.keys(categoryConfig).length, icon: <Info size={22} />, color: "#0891b2", bg: "#ecfeff" },
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

      {/* Pinned Notices */}
      {pinned.length > 0 && (
        <div>
          <p style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "12px" }}>📌 Pinned</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "14px" }}>
            {pinned.map(n => {
              const cc = categoryConfig[n.category];
              const pc = priorityConfig[n.priority];
              const ac = audienceColor[n.audience];
              return (
                <div key={n.id} style={{ background: "#fff", borderRadius: "16px", border: "1.5px solid #fde68a", boxShadow: "0 2px 12px rgba(245,158,11,0.1)", padding: "18px 20px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "20px", background: "#fffbeb", color: "#d97706" }}>
                          <Pin size={9} /> Pinned
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "20px", background: cc.bg, color: cc.color }}>
                          {cc.icon} {n.category}
                        </span>
                        <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "20px", background: pc.bg, color: pc.color }}>{n.priority}</span>
                      </div>
                      <p style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>{n.title}</p>
                      <p style={{ fontSize: "12px", color: "#64748b", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{n.body}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "10px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "20px", background: ac.bg, color: ac.color }}>{n.audience}</span>
                        <span style={{ fontSize: "11px", color: "#94a3b8" }}>Expires: {n.expiry}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      {[{ Icon: Edit, hoverBg: "#f0fdf4", color: "#16a34a" }, { Icon: Trash2, hoverBg: "#fff1f2", color: "#e11d48" }].map(({ Icon, hoverBg, color }, idx) => (
                        <button key={idx}
                          style={{ padding: "7px", borderRadius: "9px", border: "none", background: "#f8fafc", cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center", transition: "all 0.15s" }}
                          onMouseEnter={ev => { (ev.currentTarget as HTMLButtonElement).style.background = hoverBg; (ev.currentTarget as HTMLButtonElement).style.color = color; }}
                          onMouseLeave={ev => { (ev.currentTarget as HTMLButtonElement).style.background = "#f8fafc"; (ev.currentTarget as HTMLButtonElement).style.color = "#94a3b8"; }}
                        ><Icon size={13} /></button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Notices Table */}
      <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>

        {/* Toolbar */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f8fafc", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, maxWidth: "280px" }}>
            <Search size={14} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notices..."
              style={{ width: "100%", paddingLeft: "36px", paddingRight: "16px", paddingTop: "9px", paddingBottom: "9px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", fontFamily: "inherit" }}
              onFocus={e => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
              onBlur={e  => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            style={{ padding: "9px 14px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", cursor: "pointer" }}>
            <option value="All">All Categories</option>
            {Object.keys(categoryConfig).map(c => <option key={c}>{c}</option>)}
          </select>

          <select value={audienceFilter} onChange={e => setAudienceFilter(e.target.value)}
            style={{ padding: "9px 14px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", cursor: "pointer" }}>
            <option value="All">All Audiences</option>
            {["All", "Students", "Parents", "Staff"].map(a => <option key={a}>{a}</option>)}
          </select>

          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
            style={{ padding: "9px 14px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", cursor: "pointer" }}>
            <option value="All">All Priorities</option>
            {["High", "Medium", "Low"].map(p => <option key={p}>{p}</option>)}
          </select>

          <p style={{ marginLeft: "auto", fontSize: "12px", color: "#94a3b8" }}>{filtered.length} notices</p>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#fafafa", borderBottom: "1px solid #f1f5f9" }}>
                {["Notice", "Category", "Audience", "Posted By", "Date", "Expiry", "Priority", "Actions"].map(h => (
                  <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((n, i) => {
                const cc = categoryConfig[n.category];
                const pc = priorityConfig[n.priority];
                const ac = audienceColor[n.audience];
                return (
                  <tr key={n.id}
                    style={{ borderBottom: i < filtered.length - 1 ? "1px solid #f8fafc" : "none", transition: "background 0.15s" }}
                    onMouseEnter={ev => (ev.currentTarget as HTMLTableRowElement).style.background = "#fafafa"}
                    onMouseLeave={ev => (ev.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                  >
                    <td style={{ padding: "14px 20px", maxWidth: "280px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {n.pinned && <Pin size={12} color="#d97706" style={{ flexShrink: 0 }} />}
                        <div>
                          <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{n.title}</p>
                          <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "240px" }}>{n.body}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px", background: cc.bg, color: cc.color, width: "fit-content" }}>
                        {cc.icon} {n.category}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px", background: ac.bg, color: ac.color }}>{n.audience}</span>
                    </td>
                    <td style={{ padding: "14px 20px", fontSize: "13px", color: "#64748b" }}>{n.postedBy}</td>
                    <td style={{ padding: "14px 20px", fontSize: "12px", color: "#64748b", whiteSpace: "nowrap" }}>{n.date}</td>
                    <td style={{ padding: "14px 20px", fontSize: "12px", color: "#64748b", whiteSpace: "nowrap" }}>{n.expiry}</td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px", background: pc.bg, color: pc.color }}>{n.priority}</span>
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
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "48px", color: "#94a3b8" }}>
              <FileText size={40} color="#e2e8f0" style={{ margin: "0 auto 12px" }} />
              <p style={{ fontSize: "14px", fontWeight: 600 }}>No notices found</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid #f8fafc", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: "12px", color: "#94a3b8" }}>
            Showing <strong style={{ color: "#334155" }}>{filtered.length}</strong> of <strong style={{ color: "#334155" }}>{notices.length}</strong> notices
          </p>
          <div style={{ display: "flex", gap: "16px" }}>
            {["High", "Medium", "Low"].map(p => {
              const pc = priorityConfig[p];
              const count = filtered.filter(n => n.priority === p).length;
              return (
                <div key={p} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: pc.color, display: "inline-block" }} />
                  <span style={{ fontSize: "12px", color: "#64748b" }}>{p}: <strong style={{ color: "#0f172a" }}>{count}</strong></span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

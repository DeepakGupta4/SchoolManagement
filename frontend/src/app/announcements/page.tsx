"use client";
import React, { useState } from "react";
import { Search, Plus, Download, Bell, Pin, Trash2, Edit, Eye, Megaphone, Users, BookOpen, Bus } from "lucide-react";

const announcements = [
  { id: "AN001", title: "Annual Sports Day 2025",           body: "Annual Sports Day will be held on 28th July 2025. All students must participate in at least one event.", author: "Principal", audience: "All",      category: "Event",    date: "10 Jul 2025", pinned: true,  views: 320 },
  { id: "AN002", title: "Fee Payment Deadline Reminder",    body: "Last date for fee payment for Q2 is 20th July 2025. Late fee will be charged after the deadline.",      author: "Accounts",  audience: "Parents",  category: "Finance",  date: "12 Jul 2025", pinned: true,  views: 210 },
  { id: "AN003", title: "Staff Meeting – 18 July",          body: "All teaching and non-teaching staff are required to attend the meeting on 18th July at 3:00 PM.",        author: "Principal", audience: "Staff",    category: "Meeting",  date: "13 Jul 2025", pinned: false, views: 85  },
  { id: "AN004", title: "Exam Schedule Released",           body: "The mid-term exam schedule for classes 6–12 has been released. Check the notice board for details.",     author: "Exam Cell", audience: "Students", category: "Exam",     date: "14 Jul 2025", pinned: false, views: 450 },
  { id: "AN005", title: "Library Closed on 19 July",        body: "The school library will remain closed on 19th July 2025 due to maintenance work.",                       author: "Librarian", audience: "All",      category: "Notice",   date: "15 Jul 2025", pinned: false, views: 130 },
  { id: "AN006", title: "New Bus Route Added",              body: "A new bus route covering Sector 14 and Sector 18 has been added from 21st July 2025.",                   author: "Transport", audience: "Parents",  category: "Transport",date: "15 Jul 2025", pinned: false, views: 95  },
  { id: "AN007", title: "Parent-Teacher Meeting",           body: "PTM for classes 9–12 is scheduled on 26th July 2025 from 9 AM to 1 PM. Attendance is mandatory.",       author: "Principal", audience: "Parents",  category: "Meeting",  date: "16 Jul 2025", pinned: true,  views: 280 },
  { id: "AN008", title: "Holiday Notice – Eid",             body: "School will remain closed on 17th July 2025 on account of Eid. Classes will resume on 18th July.",       author: "Admin",     audience: "All",      category: "Holiday",  date: "16 Jul 2025", pinned: false, views: 510 },
];

const categoryColor: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
  Event:     { bg: "#eff6ff", color: "#2563eb", icon: <Megaphone size={12} /> },
  Finance:   { bg: "#f0fdf4", color: "#16a34a", icon: <BookOpen size={12} /> },
  Meeting:   { bg: "#fdf4ff", color: "#9333ea", icon: <Users size={12} /> },
  Exam:      { bg: "#fff7ed", color: "#ea580c", icon: <BookOpen size={12} /> },
  Notice:    { bg: "#f8fafc", color: "#64748b", icon: <Bell size={12} /> },
  Transport: { bg: "#ecfeff", color: "#0891b2", icon: <Bus size={12} /> },
  Holiday:   { bg: "#fff1f2", color: "#e11d48", icon: <Bell size={12} /> },
};

const audienceColor: Record<string, { bg: string; color: string }> = {
  All:      { bg: "#f5f3ff", color: "#7c3aed" },
  Parents:  { bg: "#fffbeb", color: "#d97706" },
  Staff:    { bg: "#ecfeff", color: "#0891b2" },
  Students: { bg: "#f0fdf4", color: "#16a34a" },
};

const tabs = ["All", "Pinned"] as const;

export default function AnnouncementsPage() {
  const [tab, setTab]                   = useState<typeof tabs[number]>("All");
  const [search, setSearch]             = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [audienceFilter, setAudienceFilter] = useState("All");

  const filtered = announcements.filter(a => {
    const matchTab      = tab === "All" || a.pinned;
    const matchSearch   = a.title.toLowerCase().includes(search.toLowerCase()) ||
                          a.body.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "All" || a.category === categoryFilter;
    const matchAudience = audienceFilter === "All" || a.audience === audienceFilter;
    return matchTab && matchSearch && matchCategory && matchAudience;
  });

  const totalViews = announcements.reduce((s, a) => s + a.views, 0);
  const pinned     = announcements.filter(a => a.pinned).length;

  return (
    <div style={{ maxWidth: "1200px", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>Announcements</h1>
          <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>Broadcast notices to students, parents and staff</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#fff", fontSize: "13px", fontWeight: 600, color: "#334155", cursor: "pointer" }}>
            <Download size={14} /> Export
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 18px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#f59e0b,#d97706)", fontSize: "13px", fontWeight: 600, color: "#fff", cursor: "pointer", boxShadow: "0 4px 12px rgba(245,158,11,0.35)" }}>
            <Plus size={14} /> New Announcement
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }}>
        {[
          { label: "Total",       value: announcements.length, icon: <Megaphone size={22} />, color: "#f59e0b", bg: "#fffbeb" },
          { label: "Pinned",      value: pinned,               icon: <Pin size={22} />,       color: "#6366f1", bg: "#eff6ff" },
          { label: "Total Views", value: totalViews,           icon: <Eye size={22} />,       color: "#0891b2", bg: "#ecfeff" },
          { label: "Audiences",   value: 4,                    icon: <Users size={22} />,     color: "#16a34a", bg: "#f0fdf4" },
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

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", background: "#fff", borderRadius: "12px", padding: "4px", gap: "2px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "7px 18px", borderRadius: "9px", border: "none", cursor: "pointer",
              fontSize: "12px", fontWeight: 600, transition: "all 0.15s",
              background: tab === t ? "linear-gradient(135deg,#f59e0b,#d97706)" : "transparent",
              color: tab === t ? "#fff" : "#64748b",
              boxShadow: tab === t ? "0 2px 8px rgba(245,158,11,0.3)" : "none",
            }}>{t}</button>
          ))}
        </div>

        <div style={{ position: "relative", flex: 1, maxWidth: "280px" }}>
          <Search size={14} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search announcements..."
            style={{ width: "100%", paddingLeft: "36px", paddingRight: "16px", paddingTop: "9px", paddingBottom: "9px", fontSize: "13px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", fontFamily: "inherit", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
            onFocus={e => { e.target.style.borderColor = "#f59e0b"; e.target.style.boxShadow = "0 0 0 3px rgba(245,158,11,0.1)"; }}
            onBlur={e  => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; }}
          />
        </div>

        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          style={{ padding: "9px 14px", fontSize: "13px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <option value="All">All Categories</option>
          {Object.keys(categoryColor).map(c => <option key={c}>{c}</option>)}
        </select>

        <select value={audienceFilter} onChange={e => setAudienceFilter(e.target.value)}
          style={{ padding: "9px 14px", fontSize: "13px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <option value="All">All Audiences</option>
          {["All", "Parents", "Staff", "Students"].map(a => <option key={a}>{a}</option>)}
        </select>

        <p style={{ marginLeft: "auto", fontSize: "12px", color: "#94a3b8" }}>{filtered.length} announcements</p>
      </div>

      {/* Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {filtered.map(a => {
          const cc = categoryColor[a.category] ?? { bg: "#f8fafc", color: "#64748b", icon: <Bell size={12} /> };
          const ac = audienceColor[a.audience] ?? { bg: "#f8fafc", color: "#64748b" };
          return (
            <div key={a.id} style={{ background: "#fff", borderRadius: "16px", border: `1px solid ${a.pinned ? "#fde68a" : "#f1f5f9"}`, boxShadow: a.pinned ? "0 2px 12px rgba(245,158,11,0.1)" : "0 1px 4px rgba(0,0,0,0.04)", padding: "20px 24px", transition: "box-shadow 0.15s" }}
              onMouseEnter={ev => (ev.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)"}
              onMouseLeave={ev => (ev.currentTarget as HTMLDivElement).style.boxShadow = a.pinned ? "0 2px 12px rgba(245,158,11,0.1)" : "0 1px 4px rgba(0,0,0,0.04)"}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                <div style={{ flex: 1 }}>
                  {/* Top row */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", flexWrap: "wrap" }}>
                    {a.pinned && (
                      <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "20px", background: "#fffbeb", color: "#d97706" }}>
                        <Pin size={10} /> Pinned
                      </span>
                    )}
                    <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "20px", background: cc.bg, color: cc.color }}>
                      {cc.icon} {a.category}
                    </span>
                    <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "20px", background: ac.bg, color: ac.color }}>
                      {a.audience}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>{a.title}</h3>

                  {/* Body */}
                  <p style={{ fontSize: "13px", color: "#64748b", lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{a.body}</p>

                  {/* Footer */}
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "12px" }}>
                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>By <strong style={{ color: "#334155" }}>{a.author}</strong></span>
                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>{a.date}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#94a3b8" }}>
                      <Eye size={12} /> {a.views} views
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                  {[{ Icon: Edit, hoverBg: "#f0fdf4", color: "#16a34a" }, { Icon: Trash2, hoverBg: "#fff1f2", color: "#e11d48" }].map(({ Icon, hoverBg, color }, idx) => (
                    <button key={idx}
                      style={{ padding: "8px", borderRadius: "10px", border: "none", background: "#f8fafc", cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center", transition: "all 0.15s" }}
                      onMouseEnter={ev => { (ev.currentTarget as HTMLButtonElement).style.background = hoverBg; (ev.currentTarget as HTMLButtonElement).style.color = color; }}
                      onMouseLeave={ev => { (ev.currentTarget as HTMLButtonElement).style.background = "#f8fafc"; (ev.currentTarget as HTMLButtonElement).style.color = "#94a3b8"; }}
                    ><Icon size={14} /></button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "64px", color: "#94a3b8", background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9" }}>
            <Megaphone size={40} color="#e2e8f0" style={{ margin: "0 auto 12px" }} />
            <p style={{ fontSize: "14px", fontWeight: 600 }}>No announcements found</p>
          </div>
        )}
      </div>
    </div>
  );
}

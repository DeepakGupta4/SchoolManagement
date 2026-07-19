"use client";
import React, { useState } from "react";
import { Search, Plus, Download, Eye, Edit, Trash2, Briefcase, Users, CheckCircle, Clock, XCircle, MapPin, Calendar } from "lucide-react";

const jobs = [
  { id: "JB001", title: "Mathematics Teacher",    dept: "Teaching",       type: "Full-time", posted: "01 Jul 2025", deadline: "31 Jul 2025", applicants: 18, status: "Open" },
  { id: "JB002", title: "Physics Teacher",         dept: "Teaching",       type: "Full-time", posted: "05 Jul 2025", deadline: "05 Aug 2025", applicants: 12, status: "Open" },
  { id: "JB003", title: "IT Administrator",        dept: "IT",             type: "Full-time", posted: "20 Jun 2025", deadline: "20 Jul 2025", applicants: 25, status: "Closed" },
  { id: "JB004", title: "Accountant",              dept: "Finance",        type: "Full-time", posted: "10 Jul 2025", deadline: "10 Aug 2025", applicants: 9,  status: "Open" },
  { id: "JB005", title: "School Counselor",        dept: "HR",             type: "Part-time", posted: "12 Jul 2025", deadline: "12 Aug 2025", applicants: 7,  status: "Open" },
  { id: "JB006", title: "Security Guard",          dept: "Security",       type: "Full-time", posted: "15 Jun 2025", deadline: "15 Jul 2025", applicants: 30, status: "Closed" },
];

const applicants = [
  { id: "AP001", name: "Arjun Mehta",     job: "Mathematics Teacher",  dept: "Teaching",  exp: "5 yrs", applied: "03 Jul 2025", status: "Shortlisted", phone: "98765-11111", email: "arjun@email.com" },
  { id: "AP002", name: "Sneha Kapoor",    job: "Mathematics Teacher",  dept: "Teaching",  exp: "3 yrs", applied: "04 Jul 2025", status: "Under Review", phone: "98765-22222", email: "sneha@email.com" },
  { id: "AP003", name: "Rahul Desai",     job: "Physics Teacher",      dept: "Teaching",  exp: "7 yrs", applied: "06 Jul 2025", status: "Shortlisted", phone: "98765-33333", email: "rahul@email.com" },
  { id: "AP004", name: "Pooja Nair",      job: "IT Administrator",     dept: "IT",        exp: "4 yrs", applied: "22 Jun 2025", status: "Hired",       phone: "98765-44444", email: "pooja@email.com" },
  { id: "AP005", name: "Vikram Joshi",    job: "IT Administrator",     dept: "IT",        exp: "6 yrs", applied: "23 Jun 2025", status: "Rejected",    phone: "98765-55555", email: "vikram@email.com" },
  { id: "AP006", name: "Ananya Singh",    job: "Accountant",           dept: "Finance",   exp: "2 yrs", applied: "11 Jul 2025", status: "Under Review", phone: "98765-66666", email: "ananya@email.com" },
  { id: "AP007", name: "Karan Sharma",    job: "School Counselor",     dept: "HR",        exp: "3 yrs", applied: "13 Jul 2025", status: "Shortlisted", phone: "98765-77777", email: "karan@email.com" },
  { id: "AP008", name: "Meera Iyer",      job: "Security Guard",       dept: "Security",  exp: "8 yrs", applied: "16 Jun 2025", status: "Hired",       phone: "98765-88888", email: "meera@email.com" },
  { id: "AP009", name: "Rohit Verma",     job: "Physics Teacher",      dept: "Teaching",  exp: "2 yrs", applied: "07 Jul 2025", status: "Under Review", phone: "98765-99999", email: "rohit@email.com" },
  { id: "AP010", name: "Divya Patel",     job: "Accountant",           dept: "Finance",   exp: "5 yrs", applied: "12 Jul 2025", status: "Shortlisted", phone: "98765-10101", email: "divya@email.com" },
];

const statusStyle: Record<string, { bg: string; color: string }> = {
  "Shortlisted":  { bg: "#eff6ff", color: "#2563eb" },
  "Under Review": { bg: "#fffbeb", color: "#d97706" },
  "Hired":        { bg: "#f0fdf4", color: "#16a34a" },
  "Rejected":     { bg: "#fff1f2", color: "#e11d48" },
};

const jobStatusStyle: Record<string, { bg: string; color: string }> = {
  "Open":   { bg: "#f0fdf4", color: "#16a34a" },
  "Closed": { bg: "#fff1f2", color: "#e11d48" },
};

const deptColors: Record<string, { bg: string; color: string }> = {
  Teaching: { bg: "#eff6ff", color: "#2563eb" },
  IT:       { bg: "#ecfeff", color: "#0891b2" },
  Finance:  { bg: "#f0fdf4", color: "#16a34a" },
  HR:       { bg: "#fdf4ff", color: "#9333ea" },
  Security: { bg: "#fff1f2", color: "#e11d48" },
};

const tabs = ["Job Postings", "Applicants"] as const;

export default function RecruitmentPage() {
  const [tab, setTab]               = useState<typeof tabs[number]>("Job Postings");
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [deptFilter, setDeptFilter]     = useState("All");

  const filteredJobs = jobs.filter(j => {
    const matchSearch = j.title.toLowerCase().includes(search.toLowerCase()) || j.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || j.status === statusFilter;
    const matchDept   = deptFilter === "All" || j.dept === deptFilter;
    return matchSearch && matchStatus && matchDept;
  });

  const filteredApplicants = applicants.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) ||
                        a.job.toLowerCase().includes(search.toLowerCase()) ||
                        a.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || a.status === statusFilter;
    const matchDept   = deptFilter === "All" || a.dept === deptFilter;
    return matchSearch && matchStatus && matchDept;
  });

  const openJobs    = jobs.filter(j => j.status === "Open").length;
  const totalApps   = applicants.length;
  const shortlisted = applicants.filter(a => a.status === "Shortlisted").length;
  const hired       = applicants.filter(a => a.status === "Hired").length;

  return (
    <div style={{ maxWidth: "1600px", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>Recruitment</h1>
          <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>Manage job postings and track applicants</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#fff", fontSize: "13px", fontWeight: 600, color: "#334155", cursor: "pointer" }}>
            <Download size={14} /> Export
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 18px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", fontSize: "13px", fontWeight: 600, color: "#fff", cursor: "pointer", boxShadow: "0 4px 12px rgba(99,102,241,0.35)" }}>
            <Plus size={14} /> Post Job
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }}>
        {[
          { label: "Open Positions",  value: openJobs,    icon: <Briefcase size={22} />,   color: "#6366f1", bg: "#eff6ff" },
          { label: "Total Applicants",value: totalApps,   icon: <Users size={22} />,        color: "#0891b2", bg: "#ecfeff" },
          { label: "Shortlisted",     value: shortlisted, icon: <Clock size={22} />,        color: "#d97706", bg: "#fffbeb" },
          { label: "Hired",           value: hired,       icon: <CheckCircle size={22} />,  color: "#16a34a", bg: "#f0fdf4" },
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

          {/* Tabs */}
          <div style={{ display: "flex", background: "#f8fafc", borderRadius: "12px", padding: "4px", gap: "2px" }}>
            {tabs.map(t => (
              <button key={t} onClick={() => { setTab(t); setSearch(""); setStatusFilter("All"); setDeptFilter("All"); }} style={{
                padding: "7px 18px", borderRadius: "9px", border: "none", cursor: "pointer",
                fontSize: "12px", fontWeight: 600, transition: "all 0.15s",
                background: tab === t ? "#fff" : "transparent",
                color: tab === t ? "#0f172a" : "#64748b",
                boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}>{t}</button>
            ))}
          </div>

          {/* Search */}
          <div style={{ position: "relative", flex: 1, maxWidth: "280px" }}>
            <Search size={14} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={tab === "Job Postings" ? "Search jobs..." : "Search applicants..."}
              style={{ width: "100%", paddingLeft: "36px", paddingRight: "16px", paddingTop: "9px", paddingBottom: "9px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", fontFamily: "inherit" }}
              onFocus={e => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
              onBlur={e  => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
            />
          </div>

          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}
            style={{ padding: "9px 14px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", cursor: "pointer" }}>
            <option value="All">All Departments</option>
            {["Teaching", "IT", "Finance", "HR", "Security"].map(d => <option key={d}>{d}</option>)}
          </select>

          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: "9px 14px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", cursor: "pointer" }}>
            <option value="All">All Status</option>
            {tab === "Job Postings"
              ? ["Open", "Closed"].map(s => <option key={s}>{s}</option>)
              : ["Under Review", "Shortlisted", "Hired", "Rejected"].map(s => <option key={s}>{s}</option>)
            }
          </select>

          <p style={{ marginLeft: "auto", fontSize: "12px", color: "#94a3b8" }}>
            {tab === "Job Postings" ? `${filteredJobs.length} jobs` : `${filteredApplicants.length} applicants`}
          </p>
        </div>

        {/* Job Postings Table */}
        {tab === "Job Postings" && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#fafafa", borderBottom: "1px solid #f1f5f9" }}>
                  {["Job Title", "Department", "Type", "Posted", "Deadline", "Applicants", "Status", "Actions"].map(h => (
                    <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((j, i) => {
                  const dc = deptColors[j.dept] ?? { bg: "#f8fafc", color: "#64748b" };
                  const js = jobStatusStyle[j.status];
                  return (
                    <tr key={j.id}
                      style={{ borderBottom: i < filteredJobs.length - 1 ? "1px solid #f8fafc" : "none", transition: "background 0.15s" }}
                      onMouseEnter={ev => (ev.currentTarget as HTMLTableRowElement).style.background = "#fafafa"}
                      onMouseLeave={ev => (ev.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                    >
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "38px", height: "38px", borderRadius: "12px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Briefcase size={16} color="#fff" />
                          </div>
                          <div>
                            <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{j.title}</p>
                            <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "1px" }}>{j.id}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px", background: dc.bg, color: dc.color }}>{j.dept}</span>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px", background: j.type === "Full-time" ? "#f0fdf4" : "#fffbeb", color: j.type === "Full-time" ? "#16a34a" : "#d97706" }}>{j.type}</span>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "#64748b" }}>
                          <Calendar size={12} color="#94a3b8" />{j.posted}
                        </div>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "#64748b" }}>
                          <Clock size={12} color="#94a3b8" />{j.deadline}
                        </div>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <Users size={13} color="#6366f1" />
                          <span style={{ fontSize: "13px", fontWeight: 700, color: "#6366f1" }}>{j.applicants}</span>
                        </div>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, padding: "5px 10px", borderRadius: "20px", background: js.bg, color: js.color }}>{j.status}</span>
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
            {filteredJobs.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px", color: "#94a3b8" }}>
                <Briefcase size={40} color="#e2e8f0" style={{ margin: "0 auto 12px" }} />
                <p style={{ fontSize: "14px", fontWeight: 600 }}>No jobs found</p>
              </div>
            )}
          </div>
        )}

        {/* Applicants Table */}
        {tab === "Applicants" && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#fafafa", borderBottom: "1px solid #f1f5f9" }}>
                  {["Applicant", "Applied For", "Department", "Experience", "Applied On", "Contact", "Status", "Actions"].map(h => (
                    <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredApplicants.map((a, i) => {
                  const dc = deptColors[a.dept] ?? { bg: "#f8fafc", color: "#64748b" };
                  const as_ = statusStyle[a.status];
                  return (
                    <tr key={a.id}
                      style={{ borderBottom: i < filteredApplicants.length - 1 ? "1px solid #f8fafc" : "none", transition: "background 0.15s" }}
                      onMouseEnter={ev => (ev.currentTarget as HTMLTableRowElement).style.background = "#fafafa"}
                      onMouseLeave={ev => (ev.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                    >
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "38px", height: "38px", borderRadius: "12px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "14px", fontWeight: 700, flexShrink: 0 }}>
                            {a.name.charAt(0)}
                          </div>
                          <div>
                            <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{a.name}</p>
                            <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "1px" }}>{a.id}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: "13px", color: "#334155", fontWeight: 500 }}>{a.job}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 600, padding: "4px 10px", borderRadius: "20px", background: dc.bg, color: dc.color }}>{a.dept}</span>
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: "13px", color: "#64748b" }}>{a.exp}</td>
                      <td style={{ padding: "14px 20px", fontSize: "12px", color: "#64748b", whiteSpace: "nowrap" }}>{a.applied}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                          <span style={{ fontSize: "12px", color: "#64748b" }}>{a.phone}</span>
                          <span style={{ fontSize: "12px", color: "#64748b" }}>{a.email}</span>
                        </div>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, padding: "5px 10px", borderRadius: "20px", background: as_.bg, color: as_.color }}>{a.status}</span>
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
            {filteredApplicants.length === 0 && (
              <div style={{ textAlign: "center", padding: "48px", color: "#94a3b8" }}>
                <Users size={40} color="#e2e8f0" style={{ margin: "0 auto 12px" }} />
                <p style={{ fontSize: "14px", fontWeight: 600 }}>No applicants found</p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: "14px 20px", borderTop: "1px solid #f8fafc", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: "12px", color: "#94a3b8" }}>
            Showing <strong style={{ color: "#334155" }}>{tab === "Job Postings" ? filteredJobs.length : filteredApplicants.length}</strong> of{" "}
            <strong style={{ color: "#334155" }}>{tab === "Job Postings" ? jobs.length : applicants.length}</strong>{" "}
            {tab === "Job Postings" ? "jobs" : "applicants"}
          </p>
          {tab === "Applicants" && (
            <div style={{ display: "flex", gap: "16px" }}>
              {["Under Review", "Shortlisted", "Hired", "Rejected"].map(st => {
                const ss = statusStyle[st];
                const count = filteredApplicants.filter(a => a.status === st).length;
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

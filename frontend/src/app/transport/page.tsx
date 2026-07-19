"use client";
import React, { useState } from "react";
import { Search, Plus, Download, Edit, Trash2, Eye, MapPin, Users, Bus, Phone, CheckCircle, AlertCircle, Clock } from "lucide-react";

const routes = [
  { id: "RT001", name: "Route A — Dwarka",       stops: 8,  students: 42, driver: "Ramesh Kumar",   bus: "DL-01-AB-1234", capacity: 50, departure: "7:00 AM", arrival: "8:15 AM", status: "active",   distance: "18 km" },
  { id: "RT002", name: "Route B — Rohini",        stops: 6,  students: 38, driver: "Suresh Yadav",   bus: "DL-02-CD-5678", capacity: 45, departure: "7:10 AM", arrival: "8:20 AM", status: "active",   distance: "22 km" },
  { id: "RT003", name: "Route C — Janakpuri",     stops: 5,  students: 30, driver: "Mohan Singh",    bus: "DL-03-EF-9012", capacity: 40, departure: "7:05 AM", arrival: "8:10 AM", status: "active",   distance: "14 km" },
  { id: "RT004", name: "Route D — Pitampura",     stops: 7,  students: 44, driver: "Vijay Sharma",   bus: "DL-04-GH-3456", capacity: 50, departure: "7:15 AM", arrival: "8:30 AM", status: "active",   distance: "25 km" },
  { id: "RT005", name: "Route E — Laxmi Nagar",   stops: 9,  students: 35, driver: "Anil Gupta",     bus: "DL-05-IJ-7890", capacity: 45, departure: "7:00 AM", arrival: "8:25 AM", status: "delayed",  distance: "20 km" },
  { id: "RT006", name: "Route F — Noida Sec 62",  stops: 10, students: 48, driver: "Deepak Verma",   bus: "DL-06-KL-2345", capacity: 55, departure: "6:50 AM", arrival: "8:20 AM", status: "active",   distance: "30 km" },
  { id: "RT007", name: "Route G — Gurgaon",       stops: 12, students: 52, driver: "Rajesh Tiwari",  bus: "DL-07-MN-6789", capacity: 55, departure: "6:45 AM", arrival: "8:30 AM", status: "active",   distance: "35 km" },
  { id: "RT008", name: "Route H — Faridabad",     stops: 8,  students: 28, driver: "Sanjay Mishra",  bus: "DL-08-OP-0123", capacity: 40, departure: "6:40 AM", arrival: "8:15 AM", status: "inactive", distance: "28 km" },
];

const recentAlerts = [
  { route: "Route E — Laxmi Nagar", msg: "Bus delayed by 15 mins due to traffic", time: "8:05 AM", type: "warning" },
  { route: "Route A — Dwarka",      msg: "Bus arrived on time",                   time: "8:15 AM", type: "success" },
  { route: "Route G — Gurgaon",     msg: "Bus departed — 52 students on board",   time: "6:45 AM", type: "info"    },
  { route: "Route D — Pitampura",   msg: "Minor breakdown — backup arranged",     time: "7:30 AM", type: "error"   },
];

const statusConfig: Record<string, { bg: string; color: string; icon: React.ElementType; label: string }> = {
  active:   { bg: "#f0fdf4", color: "#16a34a", icon: CheckCircle, label: "Active"   },
  delayed:  { bg: "#fffbeb", color: "#d97706", icon: Clock,       label: "Delayed"  },
  inactive: { bg: "#f1f5f9", color: "#64748b", icon: AlertCircle, label: "Inactive" },
};

const alertColors: Record<string, { bg: string; color: string; dot: string }> = {
  success: { bg: "#f0fdf4", color: "#16a34a", dot: "#22c55e" },
  warning: { bg: "#fffbeb", color: "#d97706", dot: "#f59e0b" },
  info:    { bg: "#eff6ff", color: "#2563eb", dot: "#6366f1" },
  error:   { bg: "#fff1f2", color: "#e11d48", dot: "#ef4444" },
};

const routeColors = [
  "linear-gradient(135deg,#6366f1,#8b5cf6)",
  "linear-gradient(135deg,#10b981,#059669)",
  "linear-gradient(135deg,#f59e0b,#d97706)",
  "linear-gradient(135deg,#f43f5e,#e11d48)",
  "linear-gradient(135deg,#06b6d4,#0891b2)",
  "linear-gradient(135deg,#8b5cf6,#7c3aed)",
  "linear-gradient(135deg,#ec4899,#db2777)",
  "linear-gradient(135deg,#64748b,#475569)",
];

export default function TransportPage() {
  const [search, setSearch]         = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [view, setView]             = useState<"grid" | "table">("grid");

  const filtered = routes.filter(r => {
    const matchStatus = statusFilter === "All" || r.status === statusFilter.toLowerCase();
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
                        r.driver.toLowerCase().includes(search.toLowerCase()) ||
                        r.bus.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalStudents = routes.reduce((s, r) => s + r.students, 0);
  const activeRoutes  = routes.filter(r => r.status === "active").length;

  return (
    <div style={{ maxWidth: "1600px", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>Transport</h1>
          <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>Manage bus routes, drivers and student transport</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#fff", fontSize: "13px", fontWeight: 600, color: "#334155", cursor: "pointer" }}>
            <Download size={14} /> Export
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 18px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", fontSize: "13px", fontWeight: 600, color: "#fff", cursor: "pointer", boxShadow: "0 4px 12px rgba(99,102,241,0.35)" }}>
            <Plus size={14} /> Add Route
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }}>
        {[
          { label: "Total Routes",      value: routes.length,    icon: "🗺️", color: "#6366f1", bg: "#eff6ff" },
          { label: "Active Routes",     value: activeRoutes,     icon: "🚌", color: "#16a34a", bg: "#f0fdf4" },
          { label: "Students Using Bus",value: totalStudents,    icon: "👨‍🎓", color: "#f59e0b", bg: "#fffbeb" },
          { label: "Total Buses",       value: routes.length,    icon: "🚍", color: "#8b5cf6", bg: "#f5f3ff" },
        ].map(s => (
          <div key={s.label} style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", padding: "20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "14px", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>{s.icon}</div>
            <div>
              <p style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>{s.label}</p>
              <p style={{ fontSize: "28px", fontWeight: 800, color: s.color, lineHeight: 1.1, letterSpacing: "-0.5px" }}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "20px", alignItems: "start" }}>

        {/* Routes */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Toolbar */}
          <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", padding: "14px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, maxWidth: "300px" }}>
              <Search size={14} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search routes, drivers..."
                style={{ width: "100%", paddingLeft: "36px", paddingRight: "16px", paddingTop: "9px", paddingBottom: "9px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", fontFamily: "inherit" }}
                onFocus={e => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
                onBlur={e  => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
              />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              style={{ padding: "9px 14px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", cursor: "pointer" }}>
              <option value="All">All Status</option>
              <option value="active">Active</option>
              <option value="delayed">Delayed</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* View toggle */}
            <div style={{ display: "flex", background: "#f8fafc", borderRadius: "10px", padding: "3px", gap: "2px", marginLeft: "auto" }}>
              {(["grid", "table"] as const).map(v => (
                <button key={v} onClick={() => setView(v)} style={{
                  padding: "6px 14px", borderRadius: "8px", border: "none", cursor: "pointer",
                  fontSize: "12px", fontWeight: 600, transition: "all 0.15s",
                  background: view === v ? "#fff" : "transparent",
                  color: view === v ? "#0f172a" : "#64748b",
                  boxShadow: view === v ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                }}>{v === "grid" ? "⊞ Grid" : "☰ Table"}</button>
              ))}
            </div>
          </div>

          {/* Grid View */}
          {view === "grid" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: "14px" }}>
              {filtered.map((route, idx) => {
                const sc = statusConfig[route.status];
                const StatusIcon = sc.icon;
                const occupancy = Math.round((route.students / route.capacity) * 100);
                const occColor  = occupancy >= 90 ? "#e11d48" : occupancy >= 70 ? "#d97706" : "#16a34a";
                return (
                  <div key={route.id} style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden", transition: "all 0.2s" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}
                  >
                    {/* Card top bar */}
                    <div style={{ height: "5px", background: routeColors[idx % routeColors.length] }} />

                    <div style={{ padding: "18px 20px" }}>
                      {/* Route name + status */}
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: routeColors[idx % routeColors.length], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Bus size={18} color="#fff" />
                          </div>
                          <div>
                            <p style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{route.name}</p>
                            <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "1px" }}>{route.id} · {route.distance}</p>
                          </div>
                        </div>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 10px", borderRadius: "20px", background: sc.bg }}>
                          <StatusIcon size={11} color={sc.color} />
                          <span style={{ fontSize: "11px", fontWeight: 700, color: sc.color }}>{sc.label}</span>
                        </div>
                      </div>

                      {/* Info grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                        {[
                          { label: "Driver",     value: route.driver,    icon: "👤" },
                          { label: "Bus No.",    value: route.bus,       icon: "🚌" },
                          { label: "Departure",  value: route.departure, icon: "🕐" },
                          { label: "Arrival",    value: route.arrival,   icon: "🏫" },
                        ].map(info => (
                          <div key={info.label} style={{ background: "#f8fafc", borderRadius: "10px", padding: "10px 12px" }}>
                            <p style={{ fontSize: "10px", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{info.label}</p>
                            <p style={{ fontSize: "12px", fontWeight: 600, color: "#334155", marginTop: "3px" }}>{info.value}</p>
                          </div>
                        ))}
                      </div>

                      {/* Occupancy */}
                      <div style={{ marginBottom: "14px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                          <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>Occupancy</span>
                          <span style={{ fontSize: "12px", fontWeight: 700, color: occColor }}>{route.students}/{route.capacity} students ({occupancy}%)</span>
                        </div>
                        <div style={{ height: "6px", background: "#f1f5f9", borderRadius: "99px", overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${occupancy}%`, background: occColor, borderRadius: "99px", transition: "width 0.4s ease" }} />
                        </div>
                      </div>

                      {/* Stops + Actions */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <MapPin size={13} color="#94a3b8" />
                          <span style={{ fontSize: "12px", color: "#64748b" }}>{route.stops} stops</span>
                        </div>
                        <div style={{ display: "flex", gap: "4px" }}>
                          {[{ Icon: Eye, hoverBg: "#eff6ff", color: "#2563eb" }, { Icon: Edit, hoverBg: "#f0fdf4", color: "#16a34a" }, { Icon: Trash2, hoverBg: "#fff1f2", color: "#e11d48" }].map(({ Icon, hoverBg, color }, i) => (
                            <button key={i}
                              style={{ padding: "6px", borderRadius: "8px", border: "none", background: "transparent", cursor: "pointer", color: "#94a3b8", display: "flex", transition: "all 0.15s" }}
                              onMouseEnter={ev => { (ev.currentTarget as HTMLButtonElement).style.background = hoverBg; (ev.currentTarget as HTMLButtonElement).style.color = color; }}
                              onMouseLeave={ev => { (ev.currentTarget as HTMLButtonElement).style.background = "transparent"; (ev.currentTarget as HTMLButtonElement).style.color = "#94a3b8"; }}
                            >
                              <Icon size={13} />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "#fafafa", borderBottom: "1px solid #f1f5f9" }}>
                      {["Route", "Bus No.", "Driver", "Stops", "Departure", "Arrival", "Students", "Distance", "Status", "Actions"].map(h => (
                        <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((route, idx) => {
                      const sc = statusConfig[route.status];
                      const StatusIcon = sc.icon;
                      return (
                        <tr key={route.id}
                          style={{ borderBottom: idx < filtered.length - 1 ? "1px solid #f8fafc" : "none", transition: "background 0.15s" }}
                          onMouseEnter={ev => (ev.currentTarget as HTMLTableRowElement).style.background = "#fafafa"}
                          onMouseLeave={ev => (ev.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                        >
                          <td style={{ padding: "14px 20px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: routeColors[idx % routeColors.length], display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <Bus size={16} color="#fff" />
                              </div>
                              <div>
                                <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{route.name}</p>
                                <p style={{ fontSize: "11px", color: "#94a3b8" }}>{route.id}</p>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "14px 20px", fontSize: "12px", color: "#334155", fontFamily: "monospace" }}>{route.bus}</td>
                          <td style={{ padding: "14px 20px", fontSize: "13px", color: "#334155", whiteSpace: "nowrap" }}>{route.driver}</td>
                          <td style={{ padding: "14px 20px", fontSize: "13px", color: "#64748b" }}>{route.stops}</td>
                          <td style={{ padding: "14px 20px", fontSize: "12px", color: "#64748b" }}>{route.departure}</td>
                          <td style={{ padding: "14px 20px", fontSize: "12px", color: "#64748b" }}>{route.arrival}</td>
                          <td style={{ padding: "14px 20px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <Users size={12} color="#94a3b8" />
                              <span style={{ fontSize: "13px", fontWeight: 600, color: "#334155" }}>{route.students}/{route.capacity}</span>
                            </div>
                          </td>
                          <td style={{ padding: "14px 20px", fontSize: "12px", color: "#64748b" }}>{route.distance}</td>
                          <td style={{ padding: "14px 20px" }}>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "5px 10px", borderRadius: "20px", background: sc.bg }}>
                              <StatusIcon size={11} color={sc.color} />
                              <span style={{ fontSize: "11px", fontWeight: 700, color: sc.color }}>{sc.label}</span>
                            </div>
                          </td>
                          <td style={{ padding: "14px 20px" }}>
                            <div style={{ display: "flex", gap: "4px" }}>
                              {[{ Icon: Eye, hoverBg: "#eff6ff", color: "#2563eb" }, { Icon: Edit, hoverBg: "#f0fdf4", color: "#16a34a" }, { Icon: Trash2, hoverBg: "#fff1f2", color: "#e11d48" }].map(({ Icon, hoverBg, color }, i) => (
                                <button key={i}
                                  style={{ padding: "7px", borderRadius: "9px", border: "none", background: "transparent", cursor: "pointer", color: "#94a3b8", display: "flex", transition: "all 0.15s" }}
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
              </div>
            </div>
          )}
        </div>

        {/* Right Panel — Alerts */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Live Status */}
          <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f8fafc", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "8px", height: "8px", background: "#22c55e", borderRadius: "50%", display: "inline-block", animation: "pulse 2s infinite" }} />
              <p style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>Live Alerts</p>
            </div>
            <div style={{ padding: "8px 0" }}>
              {recentAlerts.map((alert, i) => {
                const ac = alertColors[alert.type];
                return (
                  <div key={i} style={{ padding: "12px 20px", borderBottom: i < recentAlerts.length - 1 ? "1px solid #f8fafc" : "none" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: ac.dot, flexShrink: 0, marginTop: "5px" }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a" }}>{alert.route}</p>
                        <p style={{ fontSize: "11px", color: "#64748b", marginTop: "2px", lineHeight: 1.4 }}>{alert.msg}</p>
                        <p style={{ fontSize: "10px", color: "#94a3b8", marginTop: "4px" }}>{alert.time}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Stats */}
          <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", padding: "20px" }}>
            <p style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", marginBottom: "14px" }}>Today&apos;s Summary</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { label: "Routes On Time",  value: "6/8",  color: "#16a34a", bg: "#f0fdf4" },
                { label: "Delayed",         value: "1",    color: "#d97706", bg: "#fffbeb" },
                { label: "Inactive",        value: "1",    color: "#64748b", bg: "#f1f5f9" },
                { label: "Total Students",  value: totalStudents, color: "#6366f1", bg: "#eff6ff" },
              ].map(s => (
                <div key={s.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderRadius: "12px", background: s.bg }}>
                  <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>{s.label}</span>
                  <span style={{ fontSize: "16px", fontWeight: 800, color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

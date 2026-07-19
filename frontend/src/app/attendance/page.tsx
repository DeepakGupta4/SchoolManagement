"use client";
import React, { useState } from "react";
import { Check, X, Clock, Download, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const classes = ["6-A", "6-B", "7-A", "7-B", "8-A", "9-A", "9-B", "10-A", "10-B", "11-A", "12-A", "12-B"];

const students = [
  { id: "S001", name: "Aarav Sharma",   roll: 1,  status: "present" },
  { id: "S002", name: "Priya Patel",    roll: 2,  status: "present" },
  { id: "S003", name: "Rohan Verma",    roll: 3,  status: "absent"  },
  { id: "S004", name: "Sneha Gupta",    roll: 4,  status: "present" },
  { id: "S005", name: "Karan Singh",    roll: 5,  status: "late"    },
  { id: "S006", name: "Ananya Joshi",   roll: 6,  status: "present" },
  { id: "S007", name: "Vikram Nair",    roll: 7,  status: "present" },
  { id: "S008", name: "Meera Iyer",     roll: 8,  status: "absent"  },
  { id: "S009", name: "Arjun Reddy",    roll: 9,  status: "present" },
  { id: "S010", name: "Pooja Mishra",   roll: 10, status: "present" },
  { id: "S011", name: "Rahul Das",      roll: 11, status: "present" },
  { id: "S012", name: "Divya Menon",    roll: 12, status: "late"    },
];

const weeklyData = [
  { day: "Mon", present: 1180, absent: 60 },
  { day: "Tue", present: 1200, absent: 40 },
  { day: "Wed", present: 1150, absent: 90 },
  { day: "Thu", present: 1210, absent: 30 },
  { day: "Fri", present: 1100, absent: 140 },
  { day: "Sat", present: 980,  absent: 60 },
];

type AttendanceStatus = "present" | "absent" | "late";

const statusConfig: Record<AttendanceStatus, { bg: string; color: string; label: string }> = {
  present: { bg: "#f0fdf4", color: "#16a34a", label: "Present" },
  absent:  { bg: "#fff1f2", color: "#e11d48", label: "Absent"  },
  late:    { bg: "#fffbeb", color: "#d97706", label: "Late"    },
};

export default function AttendancePage() {
  const [selectedClass, setSelectedClass] = useState("10-A");
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>(
    Object.fromEntries(students.map(s => [s.id, s.status as AttendanceStatus]))
  );
  const [saved, setSaved] = useState(false);

  const present = Object.values(attendance).filter(v => v === "present").length;
  const absent  = Object.values(attendance).filter(v => v === "absent").length;
  const late    = Object.values(attendance).filter(v => v === "late").length;
  const pct     = Math.round((present / students.length) * 100);

  const mark = (id: string, status: AttendanceStatus) => {
    setAttendance(prev => ({ ...prev, [id]: status }));
    setSaved(false);
  };

  const markAll = (status: AttendanceStatus) => {
    setAttendance(Object.fromEntries(students.map(s => [s.id, status])));
    setSaved(false);
  };

  return (
    <div style={{ maxWidth: "1600px", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>Attendance</h1>
          <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#fff", fontSize: "13px", fontWeight: 600, color: "#334155", cursor: "pointer" }}>
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* Top Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "16px" }}>

        {/* Stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[
            { label: "Present", value: present, total: students.length, color: "#10b981", bg: "#f0fdf4" },
            { label: "Absent",  value: absent,  total: students.length, color: "#ef4444", bg: "#fff1f2" },
            { label: "Late",    value: late,    total: students.length, color: "#f59e0b", bg: "#fffbeb" },
          ].map(s => (
            <div key={s.label} style={{ background: "#fff", borderRadius: "14px", border: "1px solid #f1f5f9", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Users size={18} color={s.color} />
                </div>
                <div>
                  <p style={{ fontSize: "12px", color: "#64748b", fontWeight: 500 }}>{s.label}</p>
                  <p style={{ fontSize: "22px", fontWeight: 800, color: s.color, lineHeight: 1.1 }}>{s.value}</p>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a" }}>{Math.round((s.value / s.total) * 100)}%</p>
                <div style={{ width: "60px", height: "5px", background: "#f1f5f9", borderRadius: "99px", marginTop: "6px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(s.value / s.total) * 100}%`, background: s.color, borderRadius: "99px" }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Weekly Chart */}
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
          <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>Weekly Overview</p>
              <p style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>School-wide attendance this week</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button style={{ padding: "6px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer" }}><ChevronLeft size={14} color="#64748b" /></button>
              <button style={{ padding: "6px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer" }}><ChevronRight size={14} color="#64748b" /></button>
            </div>
          </div>
          <div style={{ padding: "16px 20px 20px" }}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weeklyData} barSize={20} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #f1f5f9", boxShadow: "0 8px 24px rgba(0,0,0,0.08)", fontSize: "12px" }} cursor={{ fill: "#f8fafc" }} />
                <Bar dataKey="present" fill="#6366f1" radius={[6, 6, 0, 0]} name="Present" />
                <Bar dataKey="absent"  fill="#fca5a5" radius={[6, 6, 0, 0]} name="Absent" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Mark Attendance */}
      <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>

        {/* Toolbar */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f8fafc", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}
            style={{ padding: "9px 14px", fontSize: "13px", fontWeight: 600, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", cursor: "pointer" }}>
            {classes.map(c => <option key={c}>Class {c}</option>)}
          </select>

          <div style={{ display: "flex", gap: "6px", marginLeft: "auto" }}>
            <button onClick={() => markAll("present")} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "8px 14px", borderRadius: "10px", border: "none", background: "#f0fdf4", color: "#16a34a", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
              <Check size={13} /> Mark All Present
            </button>
            <button onClick={() => markAll("absent")} style={{ display: "flex", alignItems: "center", gap: "5px", padding: "8px 14px", borderRadius: "10px", border: "none", background: "#fff1f2", color: "#e11d48", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
              <X size={13} /> Mark All Absent
            </button>
          </div>

          {/* Attendance % pill */}
          <div style={{ padding: "8px 16px", borderRadius: "20px", background: pct >= 90 ? "#f0fdf4" : pct >= 75 ? "#fffbeb" : "#fff1f2", color: pct >= 90 ? "#16a34a" : pct >= 75 ? "#d97706" : "#e11d48", fontSize: "13px", fontWeight: 700 }}>
            {pct}% Present
          </div>
        </div>

        {/* Student List */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1px", background: "#f8fafc" }}>
          {students.map(s => {
            const st = attendance[s.id] as AttendanceStatus;
            const sc = statusConfig[st];
            return (
              <div key={s.id} style={{ background: "#fff", padding: "14px 20px", display: "flex", alignItems: "center", gap: "12px" }}>
                {/* Avatar */}
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "13px", fontWeight: 700, flexShrink: 0 }}>
                  {s.name.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</p>
                  <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "1px" }}>Roll #{s.roll}</p>
                </div>
                {/* Status buttons */}
                <div style={{ display: "flex", gap: "4px" }}>
                  {(["present", "absent", "late"] as AttendanceStatus[]).map(status => (
                    <button key={status} onClick={() => mark(s.id, status)} style={{
                      width: "28px", height: "28px", borderRadius: "8px", border: "none", cursor: "pointer",
                      background: st === status ? statusConfig[status].bg : "#f8fafc",
                      color: st === status ? statusConfig[status].color : "#94a3b8",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.15s",
                    }}>
                      {status === "present" ? <Check size={13} /> : status === "absent" ? <X size={13} /> : <Clock size={13} />}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Save */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid #f8fafc", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          {saved && <p style={{ fontSize: "13px", color: "#16a34a", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }}><Check size={14} /> Attendance saved!</p>}
          <button onClick={() => setSaved(true)} style={{ padding: "10px 24px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 12px rgba(99,102,241,0.3)" }}>
            Save Attendance
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";
import React, { useState } from "react";
import { Search, CreditCard, CheckCircle, User, DollarSign } from "lucide-react";

const students = [
  { id: "STU001", name: "Arjun Sharma",    class: "10-A", rollNo: "01", totalFee: 10900, paid: 5450,  due: 5450  },
  { id: "STU002", name: "Priya Patel",     class: "9-B",  rollNo: "12", totalFee: 10900, paid: 10900, due: 0     },
  { id: "STU003", name: "Rahul Verma",     class: "11-A", rollNo: "08", totalFee: 13800, paid: 6900,  due: 6900  },
  { id: "STU004", name: "Sneha Gupta",     class: "8-B",  rollNo: "22", totalFee: 8800,  paid: 8800,  due: 0     },
  { id: "STU005", name: "Karan Mehta",     class: "12-A", rollNo: "05", totalFee: 13800, paid: 0,     due: 13800 },
  { id: "STU006", name: "Ananya Singh",    class: "7-A",  rollNo: "17", totalFee: 8800,  paid: 4400,  due: 4400  },
];

const paymentMethods = ["Cash", "Online Transfer", "Cheque", "DD", "UPI"];
const feeTypes = ["Tuition Fee", "Transport Fee", "Lab Fee", "Library Fee", "Sports Fee", "Miscellaneous", "Full Fee"];

export default function CollectFeePage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<typeof students[0] | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Cash");
  const [feeType, setFeeType] = useState("Tuition Fee");
  const [success, setSuccess] = useState(false);

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.id.toLowerCase().includes(search.toLowerCase()) ||
    s.class.toLowerCase().includes(search.toLowerCase())
  );

  const handleCollect = () => {
    if (!selected || !amount) return;
    setSuccess(true);
    setTimeout(() => { setSuccess(false); setSelected(null); setAmount(""); }, 3000);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 14px", fontSize: "13px", background: "#f8fafc",
    border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none",
    color: "#334155", fontFamily: "inherit", boxSizing: "border-box",
  };

  return (
    <div style={{ maxWidth: "1600px", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>Collect Fee</h1>
        <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>Search student and record fee payment</p>
      </div>

      {success && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "14px", padding: "16px 20px", display: "flex", alignItems: "center", gap: "12px" }}>
          <CheckCircle size={20} color="#16a34a" />
          <div>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "#15803d" }}>Payment Recorded Successfully!</p>
            <p style={{ fontSize: "12px", color: "#16a34a", marginTop: "2px" }}>Receipt has been generated. Redirecting...</p>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "20px", alignItems: "start" }}>

        {/* Student Search */}
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f8fafc" }}>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>Select Student</p>
            <div style={{ position: "relative", marginTop: "12px" }}>
              <Search size={14} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, ID or class..."
                style={{ ...inputStyle, paddingLeft: "36px" }}
                onFocus={e => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
                onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
              />
            </div>
          </div>

          <div>
            {filtered.map((s, i) => (
              <div key={s.id}
                onClick={() => { setSelected(s); setAmount(String(s.due)); }}
                style={{
                  padding: "14px 20px", borderBottom: i < filtered.length - 1 ? "1px solid #f8fafc" : "none",
                  cursor: "pointer", transition: "background 0.15s",
                  background: selected?.id === s.id ? "#eff6ff" : "transparent",
                  borderLeft: selected?.id === s.id ? "3px solid #6366f1" : "3px solid transparent",
                }}
                onMouseEnter={e => { if (selected?.id !== s.id) (e.currentTarget as HTMLDivElement).style.background = "#fafafa"; }}
                onMouseLeave={e => { if (selected?.id !== s.id) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: s.due === 0 ? "#f0fdf4" : "#fff1f2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <User size={18} color={s.due === 0 ? "#16a34a" : "#e11d48"} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{s.name}</p>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: s.due === 0 ? "#16a34a" : "#e11d48" }}>
                        {s.due === 0 ? "✓ Cleared" : `₹${s.due.toLocaleString()} due`}
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                      <span style={{ fontSize: "11px", color: "#94a3b8" }}>{s.id}</span>
                      <span style={{ fontSize: "11px", color: "#94a3b8" }}>Class {s.class}</span>
                      <span style={{ fontSize: "11px", color: "#94a3b8" }}>Roll #{s.rollNo}</span>
                    </div>
                    {/* Progress bar */}
                    <div style={{ marginTop: "8px", height: "4px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(s.paid / s.totalFee) * 100}%`, background: s.due === 0 ? "#16a34a" : "linear-gradient(90deg,#6366f1,#8b5cf6)", borderRadius: "4px", transition: "width 0.3s" }} />
                    </div>
                    <p style={{ fontSize: "10px", color: "#94a3b8", marginTop: "3px" }}>₹{s.paid.toLocaleString()} paid of ₹{s.totalFee.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Form */}
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
          <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid #f8fafc" }}>
            <p style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>Payment Details</p>
          </div>
          <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>

            {selected ? (
              <div style={{ background: "#eff6ff", borderRadius: "12px", padding: "14px", display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#dbeafe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <User size={18} color="#2563eb" />
                </div>
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 700, color: "#1e40af" }}>{selected.name}</p>
                  <p style={{ fontSize: "11px", color: "#3b82f6" }}>Class {selected.class} · {selected.id}</p>
                </div>
              </div>
            ) : (
              <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "14px", textAlign: "center" }}>
                <p style={{ fontSize: "12px", color: "#94a3b8" }}>← Select a student first</p>
              </div>
            )}

            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Fee Type</label>
              <select value={feeType} onChange={e => setFeeType(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                {feeTypes.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Amount (₹)</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Enter amount"
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
                onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
              />
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Payment Method</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {paymentMethods.map(m => (
                  <button key={m} onClick={() => setMethod(m)} style={{
                    padding: "7px 14px", borderRadius: "10px", fontSize: "12px", fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                    border: method === m ? "none" : "1px solid #e2e8f0",
                    background: method === m ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "#f8fafc",
                    color: method === m ? "#fff" : "#64748b",
                    boxShadow: method === m ? "0 2px 8px rgba(99,102,241,0.3)" : "none",
                  }}>{m}</button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize: "12px", fontWeight: 600, color: "#374151", display: "block", marginBottom: "6px" }}>Remarks (optional)</label>
              <input placeholder="Add a note..." style={inputStyle}
                onFocus={e => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
                onBlur={e => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
              />
            </div>

            {selected && amount && (
              <div style={{ background: "#f8fafc", borderRadius: "12px", padding: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>Student</span>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a" }}>{selected.name}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>Fee Type</span>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a" }}>{feeType}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                  <span style={{ fontSize: "12px", color: "#64748b" }}>Method</span>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#0f172a" }}>{method}</span>
                </div>
                <div style={{ height: "1px", background: "#e2e8f0", margin: "10px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>Total</span>
                  <span style={{ fontSize: "16px", fontWeight: 800, color: "#6366f1" }}>₹{Number(amount).toLocaleString()}</span>
                </div>
              </div>
            )}

            <button onClick={handleCollect} disabled={!selected || !amount}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                padding: "12px", borderRadius: "12px", border: "none", cursor: selected && amount ? "pointer" : "not-allowed",
                background: selected && amount ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "#f1f5f9",
                color: selected && amount ? "#fff" : "#94a3b8",
                fontSize: "14px", fontWeight: 700,
                boxShadow: selected && amount ? "0 4px 12px rgba(99,102,241,0.35)" : "none",
                transition: "all 0.15s",
              }}
            >
              <DollarSign size={16} /> Collect & Generate Receipt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

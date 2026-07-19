"use client";
import React, { useState } from "react";
import { Search, Plus, Download, Edit, Trash2, Eye, BookOpen, CheckCircle, Clock, AlertCircle, RotateCcw } from "lucide-react";

const books = [
  { id: "BK001", title: "Mathematics NCERT Class 10",    author: "NCERT",              category: "Textbook",  total: 45, available: 12, isbn: "978-81-7450-001-1", publisher: "NCERT",        year: 2023 },
  { id: "BK002", title: "Physics Part I Class 11",       author: "NCERT",              category: "Textbook",  total: 40, available: 8,  isbn: "978-81-7450-002-2", publisher: "NCERT",        year: 2023 },
  { id: "BK003", title: "Wings of Fire",                 author: "A.P.J. Abdul Kalam", category: "Biography", total: 10, available: 3,  isbn: "978-81-7371-146-6", publisher: "Universities Press", year: 2020 },
  { id: "BK004", title: "The Alchemist",                 author: "Paulo Coelho",       category: "Fiction",   total: 8,  available: 5,  isbn: "978-0-06-231500-7", publisher: "HarperCollins", year: 2019 },
  { id: "BK005", title: "Chemistry NCERT Class 12",      author: "NCERT",              category: "Textbook",  total: 38, available: 15, isbn: "978-81-7450-003-3", publisher: "NCERT",        year: 2023 },
  { id: "BK006", title: "Rich Dad Poor Dad",             author: "Robert Kiyosaki",    category: "Finance",   total: 6,  available: 2,  isbn: "978-1-61268-116-2", publisher: "Plata Publishing", year: 2017 },
  { id: "BK007", title: "History of Modern India",       author: "Bipan Chandra",      category: "History",   total: 15, available: 9,  isbn: "978-81-250-3684-5", publisher: "Orient Blackswan", year: 2021 },
  { id: "BK008", title: "English Grammar in Use",        author: "Raymond Murphy",     category: "Reference", total: 20, available: 0,  isbn: "978-1-107-53933-6", publisher: "Cambridge",    year: 2019 },
  { id: "BK009", title: "Computer Science Class 12",     author: "Sumita Arora",       category: "Textbook",  total: 30, available: 18, isbn: "978-93-5134-234-5", publisher: "Dhanpat Rai",  year: 2023 },
  { id: "BK010", title: "Atomic Habits",                 author: "James Clear",        category: "Self-Help", total: 5,  available: 1,  isbn: "978-0-7352-1129-2", publisher: "Avery",        year: 2018 },
];

const issuedBooks = [
  { id: "ISS001", book: "Wings of Fire",            student: "Aarav Sharma",  class: "10-A", issueDate: "Jul 10, 2025", dueDate: "Jul 24, 2025", status: "issued"  },
  { id: "ISS002", book: "The Alchemist",            student: "Priya Patel",   class: "9-B",  issueDate: "Jul 08, 2025", dueDate: "Jul 22, 2025", status: "overdue" },
  { id: "ISS003", book: "Rich Dad Poor Dad",        student: "Rohan Verma",   class: "11-A", issueDate: "Jul 12, 2025", dueDate: "Jul 26, 2025", status: "issued"  },
  { id: "ISS004", book: "Atomic Habits",            student: "Sneha Gupta",   class: "10-B", issueDate: "Jul 05, 2025", dueDate: "Jul 19, 2025", status: "overdue" },
  { id: "ISS005", book: "English Grammar in Use",   student: "Karan Singh",   class: "8-A",  issueDate: "Jul 14, 2025", dueDate: "Jul 28, 2025", status: "issued"  },
  { id: "ISS006", book: "History of Modern India",  student: "Ananya Joshi",  class: "12-B", issueDate: "Jul 01, 2025", dueDate: "Jul 15, 2025", status: "returned"},
  { id: "ISS007", book: "Physics Part I Class 11",  student: "Vikram Nair",   class: "11-A", issueDate: "Jul 13, 2025", dueDate: "Jul 27, 2025", status: "issued"  },
  { id: "ISS008", book: "Mathematics NCERT Class 10",student: "Meera Iyer",   class: "10-A", issueDate: "Jun 28, 2025", dueDate: "Jul 12, 2025", status: "returned"},
];

const categoryColors: Record<string, { bg: string; color: string }> = {
  Textbook:  { bg: "#eff6ff", color: "#2563eb" },
  Biography: { bg: "#f0fdf4", color: "#16a34a" },
  Fiction:   { bg: "#fdf4ff", color: "#9333ea" },
  Finance:   { bg: "#fffbeb", color: "#d97706" },
  History:   { bg: "#fff7ed", color: "#c2410c" },
  Reference: { bg: "#ecfeff", color: "#0891b2" },
  "Self-Help":{ bg: "#f5f3ff", color: "#7c3aed" },
};

const statusConfig: Record<string, { bg: string; color: string; icon: React.ElementType; label: string }> = {
  issued:   { bg: "#eff6ff", color: "#2563eb", icon: Clock,         label: "Issued"   },
  overdue:  { bg: "#fff1f2", color: "#e11d48", icon: AlertCircle,   label: "Overdue"  },
  returned: { bg: "#f0fdf4", color: "#16a34a", icon: CheckCircle,   label: "Returned" },
};

const tabs = ["All", "Issued", "Overdue", "Returned"];
const catalogTabs = ["All Books", "Available", "Issued Out"];

export default function LibraryPage() {
  const [activeSection, setActiveSection] = useState<"catalog" | "issued">("catalog");
  const [catalogTab, setCatalogTab]       = useState("All Books");
  const [issueTab, setIssueTab]           = useState("All");
  const [search, setSearch]               = useState("");
  const [catFilter, setCatFilter]         = useState("All");

  const filteredBooks = books.filter(b => {
    const matchCat    = catFilter === "All" || b.category === catFilter;
    const matchSearch = b.title.toLowerCase().includes(search.toLowerCase()) ||
                        b.author.toLowerCase().includes(search.toLowerCase()) ||
                        b.id.toLowerCase().includes(search.toLowerCase());
    const matchTab    = catalogTab === "All Books" || (catalogTab === "Available" ? b.available > 0 : b.available === 0);
    return matchCat && matchSearch && matchTab;
  });

  const filteredIssued = issuedBooks.filter(i => {
    const matchTab    = issueTab === "All" || i.status === issueTab.toLowerCase();
    const matchSearch = i.book.toLowerCase().includes(search.toLowerCase()) ||
                        i.student.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const totalBooks    = books.reduce((s, b) => s + b.total, 0);
  const totalIssued   = books.reduce((s, b) => s + (b.total - b.available), 0);
  const overdueCount  = issuedBooks.filter(i => i.status === "overdue").length;

  return (
    <div style={{ maxWidth: "1600px", display: "flex", flexDirection: "column", gap: "24px" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>Library</h1>
          <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "4px" }}>Manage books, issue records and members</p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 16px", borderRadius: "12px", border: "1px solid #e2e8f0", background: "#fff", fontSize: "13px", fontWeight: 600, color: "#334155", cursor: "pointer" }}>
            <Download size={14} /> Export
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: "6px", padding: "9px 18px", borderRadius: "12px", border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", fontSize: "13px", fontWeight: 600, color: "#fff", cursor: "pointer", boxShadow: "0 4px 12px rgba(99,102,241,0.35)" }}>
            <Plus size={14} /> Add Book
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }}>
        {[
          { label: "Total Books",    value: totalBooks,              icon: "📚", color: "#6366f1", bg: "#eff6ff" },
          { label: "Available",      value: books.reduce((s,b) => s + b.available, 0), icon: "✅", color: "#16a34a", bg: "#f0fdf4" },
          { label: "Issued Out",     value: totalIssued,             icon: "📖", color: "#d97706", bg: "#fffbeb" },
          { label: "Overdue",        value: overdueCount,            icon: "⚠️", color: "#e11d48", bg: "#fff1f2" },
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

      {/* Section Toggle */}
      <div style={{ display: "flex", background: "#f1f5f9", borderRadius: "14px", padding: "4px", gap: "4px", width: "fit-content" }}>
        {(["catalog", "issued"] as const).map(sec => (
          <button key={sec} onClick={() => { setActiveSection(sec); setSearch(""); }} style={{
            padding: "9px 24px", borderRadius: "11px", border: "none", cursor: "pointer",
            fontSize: "13px", fontWeight: 700, transition: "all 0.15s",
            background: activeSection === sec ? "#fff" : "transparent",
            color: activeSection === sec ? "#0f172a" : "#64748b",
            boxShadow: activeSection === sec ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
          }}>
            {sec === "catalog" ? "📚 Book Catalog" : "📋 Issue Records"}
          </button>
        ))}
      </div>

      {/* Book Catalog */}
      {activeSection === "catalog" && (
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f8fafc", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", background: "#f8fafc", borderRadius: "12px", padding: "4px", gap: "2px" }}>
              {catalogTabs.map(tab => (
                <button key={tab} onClick={() => setCatalogTab(tab)} style={{
                  padding: "7px 14px", borderRadius: "9px", border: "none", cursor: "pointer",
                  fontSize: "12px", fontWeight: 600, transition: "all 0.15s",
                  background: catalogTab === tab ? "#fff" : "transparent",
                  color: catalogTab === tab ? "#0f172a" : "#64748b",
                  boxShadow: catalogTab === tab ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
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
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title, author..."
                style={{ width: "100%", paddingLeft: "36px", paddingRight: "16px", paddingTop: "9px", paddingBottom: "9px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", fontFamily: "inherit" }}
                onFocus={e => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
                onBlur={e  => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
              />
            </div>
            <p style={{ marginLeft: "auto", fontSize: "12px", color: "#94a3b8" }}>{filteredBooks.length} books</p>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#fafafa", borderBottom: "1px solid #f1f5f9" }}>
                  {["Book", "Author", "Category", "ISBN", "Publisher", "Year", "Total", "Available", "Actions"].map(h => (
                    <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredBooks.map((b, i) => {
                  const cc = categoryColors[b.category] ?? { bg: "#f8fafc", color: "#64748b" };
                  const availColor = b.available === 0 ? "#e11d48" : b.available <= 3 ? "#d97706" : "#16a34a";
                  return (
                    <tr key={b.id}
                      style={{ borderBottom: i < filteredBooks.length - 1 ? "1px solid #f8fafc" : "none", transition: "background 0.15s" }}
                      onMouseEnter={ev => (ev.currentTarget as HTMLTableRowElement).style.background = "#fafafa"}
                      onMouseLeave={ev => (ev.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                    >
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "38px", height: "38px", borderRadius: "10px", background: cc.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <BookOpen size={16} color={cc.color} />
                          </div>
                          <div>
                            <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{b.title}</p>
                            <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "1px" }}>{b.id}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: "13px", color: "#334155", whiteSpace: "nowrap" }}>{b.author}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px", background: cc.bg, color: cc.color }}>{b.category}</span>
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: "11px", color: "#94a3b8", fontFamily: "monospace" }}>{b.isbn}</td>
                      <td style={{ padding: "14px 20px", fontSize: "12px", color: "#64748b", whiteSpace: "nowrap" }}>{b.publisher}</td>
                      <td style={{ padding: "14px 20px", fontSize: "13px", color: "#64748b" }}>{b.year}</td>
                      <td style={{ padding: "14px 20px", fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>{b.total}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontSize: "14px", fontWeight: 800, color: availColor, background: availColor === "#e11d48" ? "#fff1f2" : availColor === "#d97706" ? "#fffbeb" : "#f0fdf4", padding: "4px 10px", borderRadius: "20px" }}>
                          {b.available === 0 ? "Out of Stock" : b.available}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", gap: "4px" }}>
                          {[{ Icon: Eye, hoverBg: "#eff6ff", color: "#2563eb" }, { Icon: Edit, hoverBg: "#f0fdf4", color: "#16a34a" }, { Icon: Trash2, hoverBg: "#fff1f2", color: "#e11d48" }].map(({ Icon, hoverBg, color }, idx) => (
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

      {/* Issue Records */}
      {activeSection === "issued" && (
        <div style={{ background: "#fff", borderRadius: "16px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f8fafc", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", background: "#f8fafc", borderRadius: "12px", padding: "4px", gap: "2px" }}>
              {tabs.map(tab => (
                <button key={tab} onClick={() => setIssueTab(tab)} style={{
                  padding: "7px 14px", borderRadius: "9px", border: "none", cursor: "pointer",
                  fontSize: "12px", fontWeight: 600, transition: "all 0.15s",
                  background: issueTab === tab ? "#fff" : "transparent",
                  color: issueTab === tab ? "#0f172a" : "#64748b",
                  boxShadow: issueTab === tab ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                }}>{tab}</button>
              ))}
            </div>
            <div style={{ position: "relative", flex: 1, maxWidth: "300px" }}>
              <Search size={14} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by book or student..."
                style={{ width: "100%", paddingLeft: "36px", paddingRight: "16px", paddingTop: "9px", paddingBottom: "9px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", outline: "none", color: "#334155", fontFamily: "inherit" }}
                onFocus={e => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
                onBlur={e  => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
              />
            </div>
            <p style={{ marginLeft: "auto", fontSize: "12px", color: "#94a3b8" }}>{filteredIssued.length} records</p>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#fafafa", borderBottom: "1px solid #f1f5f9" }}>
                  {["Issue ID", "Book", "Student", "Class", "Issue Date", "Due Date", "Status", "Actions"].map(h => (
                    <th key={h} style={{ padding: "12px 20px", textAlign: "left", fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredIssued.map((rec, i) => {
                  const sc = statusConfig[rec.status];
                  const StatusIcon = sc.icon;
                  return (
                    <tr key={rec.id}
                      style={{ borderBottom: i < filteredIssued.length - 1 ? "1px solid #f8fafc" : "none", transition: "background 0.15s" }}
                      onMouseEnter={ev => (ev.currentTarget as HTMLTableRowElement).style.background = "#fafafa"}
                      onMouseLeave={ev => (ev.currentTarget as HTMLTableRowElement).style.background = "transparent"}
                    >
                      <td style={{ padding: "14px 20px", fontSize: "12px", fontWeight: 700, color: "#6366f1" }}>{rec.id}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <BookOpen size={14} color="#6366f1" />
                          </div>
                          <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rec.book}</p>
                        </div>
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: "13px", fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap" }}>{rec.student}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px", background: "#eff6ff", color: "#2563eb" }}>{rec.class}</span>
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: "12px", color: "#64748b" }}>{rec.issueDate}</td>
                      <td style={{ padding: "14px 20px", fontSize: "12px", fontWeight: 600, color: rec.status === "overdue" ? "#e11d48" : "#334155" }}>{rec.dueDate}</td>
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "5px 10px", borderRadius: "20px", background: sc.bg }}>
                          <StatusIcon size={12} color={sc.color} />
                          <span style={{ fontSize: "11px", fontWeight: 700, color: sc.color }}>{sc.label}</span>
                        </div>
                      </td>
                      <td style={{ padding: "14px 20px" }}>
                        <div style={{ display: "flex", gap: "4px" }}>
                          <button
                            title="Return Book"
                            style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 10px", borderRadius: "9px", border: "none", background: "#f0fdf4", cursor: "pointer", color: "#16a34a", fontSize: "11px", fontWeight: 600, transition: "all 0.15s" }}
                            onMouseEnter={ev => (ev.currentTarget as HTMLButtonElement).style.background = "#dcfce7"}
                            onMouseLeave={ev => (ev.currentTarget as HTMLButtonElement).style.background = "#f0fdf4"}
                          >
                            <RotateCcw size={12} /> Return
                          </button>
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

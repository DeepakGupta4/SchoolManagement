"use client";
import React, { useState } from "react";
import { Search, Send, Plus, MoreVertical, Phone, Video, Paperclip, Smile } from "lucide-react";

const conversations = [
  { id: 1,  name: "Dr. Priya Sharma",   role: "Math Teacher",      avatar: "P", unread: 3, last: "Can you share the exam schedule?",          time: "10:42 AM", online: true  },
  { id: 2,  name: "Mr. Rajesh Sharma",  role: "Principal",         avatar: "R", unread: 1, last: "Meeting postponed to 4 PM today.",           time: "9:15 AM",  online: true  },
  { id: 3,  name: "Ms. Pooja Mehta",    role: "HR Manager",        avatar: "P", unread: 0, last: "Leave request has been approved.",           time: "Yesterday",online: false },
  { id: 4,  name: "Mr. Anil Kumar",     role: "Accountant",        avatar: "A", unread: 0, last: "Fee report sent to your email.",             time: "Yesterday",online: false },
  { id: 5,  name: "Ms. Kavita Joshi",   role: "Librarian",         avatar: "K", unread: 2, last: "New books have arrived in the library.",     time: "Mon",      online: true  },
  { id: 6,  name: "Mr. Suresh Nair",    role: "IT Admin",          avatar: "S", unread: 0, last: "Server maintenance done successfully.",      time: "Mon",      online: false },
  { id: 7,  name: "Parents Group",      role: "Group · 48 members",avatar: "G", unread: 5, last: "Ananya: Thanks for the update!",             time: "Sun",      online: false },
  { id: 8,  name: "Staff Announcements",role: "Group · 32 members",avatar: "S", unread: 0, last: "Holiday on 17th July confirmed.",            time: "Sun",      online: false },
];

const chatMessages: Record<number, { id: number; from: "me" | "them"; text: string; time: string }[]> = {
  1: [
    { id: 1, from: "them", text: "Good morning! Hope you're doing well.", time: "10:30 AM" },
    { id: 2, from: "me",   text: "Good morning Dr. Priya! Yes, all good. How can I help?", time: "10:32 AM" },
    { id: 3, from: "them", text: "Can you share the exam schedule for class 10 and 11?", time: "10:40 AM" },
    { id: 4, from: "them", text: "Students are asking about it.", time: "10:41 AM" },
    { id: 5, from: "me",   text: "Sure! I'll send it right away.", time: "10:42 AM" },
  ],
  2: [
    { id: 1, from: "them", text: "Hi, the staff meeting scheduled for 3 PM today has been postponed.", time: "9:10 AM" },
    { id: 2, from: "them", text: "Meeting postponed to 4 PM today.", time: "9:15 AM" },
    { id: 3, from: "me",   text: "Noted, sir. I'll inform the team.", time: "9:20 AM" },
  ],
  3: [
    { id: 1, from: "me",   text: "Hi Pooja, any update on my leave request?", time: "Yesterday 2:00 PM" },
    { id: 2, from: "them", text: "Leave request has been approved.", time: "Yesterday 3:30 PM" },
    { id: 3, from: "me",   text: "Thank you so much!", time: "Yesterday 3:32 PM" },
  ],
};

const avatarColors = ["#6366f1", "#0891b2", "#16a34a", "#d97706", "#e11d48", "#9333ea", "#ea580c", "#0f172a"];

export default function MessagesPage() {
  const [activeId, setActiveId]   = useState(1);
  const [search, setSearch]       = useState("");
  const [input, setInput]         = useState("");
  const [messages, setMessages]   = useState(chatMessages);

  const active = conversations.find(c => c.id === activeId)!;
  const chat   = messages[activeId] ?? [];

  const filtered = conversations.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.role.toLowerCase().includes(search.toLowerCase())
  );

  function sendMessage() {
    if (!input.trim()) return;
    const newMsg = { id: Date.now(), from: "me" as const, text: input.trim(), time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    setMessages(prev => ({ ...prev, [activeId]: [...(prev[activeId] ?? []), newMsg] }));
    setInput("");
  }

  return (
    <div style={{ maxWidth: "1400px" }}>
      <div style={{ display: "flex", height: "calc(100vh - 120px)", background: "#fff", borderRadius: "20px", border: "1px solid #f1f5f9", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", overflow: "hidden" }}>

        {/* Sidebar */}
        <div style={{ width: "320px", flexShrink: 0, borderRight: "1px solid #f1f5f9", display: "flex", flexDirection: "column" }}>

          {/* Sidebar Header */}
          <div style={{ padding: "20px 16px 12px", borderBottom: "1px solid #f8fafc" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>Messages</h2>
              <button style={{ width: "32px", height: "32px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 8px rgba(99,102,241,0.3)" }}>
                <Plus size={15} color="#fff" />
              </button>
            </div>
            <div style={{ position: "relative" }}>
              <Search size={13} color="#94a3b8" style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conversations..."
                style={{ width: "100%", paddingLeft: "34px", paddingRight: "12px", paddingTop: "8px", paddingBottom: "8px", fontSize: "13px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", outline: "none", color: "#334155", fontFamily: "inherit" }}
                onFocus={e => { e.target.style.borderColor = "#6366f1"; e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
                onBlur={e  => { e.target.style.borderColor = "#e2e8f0"; e.target.style.boxShadow = "none"; }}
              />
            </div>
          </div>

          {/* Conversation List */}
          <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
            {filtered.map((c, idx) => {
              const isActive = c.id === activeId;
              const color    = avatarColors[idx % avatarColors.length];
              return (
                <div key={c.id} onClick={() => setActiveId(c.id)}
                  style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "12px", cursor: "pointer", transition: "background 0.15s", background: isActive ? "#eff6ff" : "transparent", marginBottom: "2px" }}
                  onMouseEnter={ev => { if (!isActive) (ev.currentTarget as HTMLDivElement).style.background = "#f8fafc"; }}
                  onMouseLeave={ev => { if (!isActive) (ev.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                >
                  {/* Avatar */}
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <div style={{ width: "44px", height: "44px", borderRadius: "14px", background: color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "15px", fontWeight: 700 }}>
                      {c.avatar}
                    </div>
                    {c.online && (
                      <span style={{ position: "absolute", bottom: "2px", right: "2px", width: "10px", height: "10px", borderRadius: "50%", background: "#22c55e", border: "2px solid #fff" }} />
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <p style={{ fontSize: "13px", fontWeight: c.unread > 0 ? 700 : 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.name}</p>
                      <span style={{ fontSize: "11px", color: "#94a3b8", flexShrink: 0, marginLeft: "8px" }}>{c.time}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2px" }}>
                      <p style={{ fontSize: "12px", color: c.unread > 0 ? "#334155" : "#94a3b8", fontWeight: c.unread > 0 ? 500 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{c.last}</p>
                      {c.unread > 0 && (
                        <span style={{ flexShrink: 0, marginLeft: "8px", width: "18px", height: "18px", borderRadius: "50%", background: "#6366f1", color: "#fff", fontSize: "10px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{c.unread}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>

          {/* Chat Header */}
          <div style={{ padding: "16px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ position: "relative" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "14px", background: avatarColors[conversations.findIndex(c => c.id === activeId) % avatarColors.length], display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "15px", fontWeight: 700 }}>
                  {active.avatar}
                </div>
                {active.online && (
                  <span style={{ position: "absolute", bottom: "2px", right: "2px", width: "10px", height: "10px", borderRadius: "50%", background: "#22c55e", border: "2px solid #fff" }} />
                )}
              </div>
              <div>
                <p style={{ fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>{active.name}</p>
                <p style={{ fontSize: "12px", color: active.online ? "#16a34a" : "#94a3b8", marginTop: "1px" }}>
                  {active.online ? "Online" : active.role}
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "4px" }}>
              {[Phone, Video, MoreVertical].map((Icon, idx) => (
                <button key={idx}
                  style={{ padding: "8px", borderRadius: "10px", border: "none", background: "transparent", cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center", transition: "all 0.15s" }}
                  onMouseEnter={ev => { (ev.currentTarget as HTMLButtonElement).style.background = "#f8fafc"; (ev.currentTarget as HTMLButtonElement).style.color = "#334155"; }}
                  onMouseLeave={ev => { (ev.currentTarget as HTMLButtonElement).style.background = "transparent"; (ev.currentTarget as HTMLButtonElement).style.color = "#94a3b8"; }}
                ><Icon size={18} /></button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {chat.length === 0 && (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
                <p style={{ fontSize: "13px" }}>No messages yet. Say hi! 👋</p>
              </div>
            )}
            {chat.map(msg => (
              <div key={msg.id} style={{ display: "flex", justifyContent: msg.from === "me" ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth: "65%" }}>
                  <div style={{
                    padding: "10px 14px",
                    borderRadius: msg.from === "me" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    background: msg.from === "me" ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "#f1f5f9",
                    color: msg.from === "me" ? "#fff" : "#0f172a",
                    fontSize: "13px",
                    lineHeight: 1.5,
                    boxShadow: msg.from === "me" ? "0 2px 8px rgba(99,102,241,0.25)" : "none",
                  }}>
                    {msg.text}
                  </div>
                  <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "4px", textAlign: msg.from === "me" ? "right" : "left" }}>{msg.time}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div style={{ padding: "16px 24px", borderTop: "1px solid #f1f5f9" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#f8fafc", borderRadius: "16px", padding: "8px 8px 8px 16px", border: "1px solid #e2e8f0" }}>
              <button style={{ padding: "6px", borderRadius: "8px", border: "none", background: "transparent", cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center" }}>
                <Paperclip size={16} />
              </button>
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Type a message..."
                style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: "13px", color: "#334155", fontFamily: "inherit" }}
              />
              <button style={{ padding: "6px", borderRadius: "8px", border: "none", background: "transparent", cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center" }}>
                <Smile size={16} />
              </button>
              <button onClick={sendMessage}
                style={{ padding: "9px 16px", borderRadius: "12px", border: "none", background: input.trim() ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "#e2e8f0", cursor: input.trim() ? "pointer" : "default", color: input.trim() ? "#fff" : "#94a3b8", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, transition: "all 0.15s", boxShadow: input.trim() ? "0 2px 8px rgba(99,102,241,0.3)" : "none" }}>
                <Send size={14} /> Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

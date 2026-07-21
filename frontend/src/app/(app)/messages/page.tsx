"use client";

import React, { useState } from "react";
import {
  Search,
  Send,
  Plus,
  MoreVertical,
  Phone,
  Video,
  Paperclip,
  Smile,
  MessagesSquare,
} from "lucide-react";
import { Avatar, Button, EmptyState, Input } from "@/components/ui";
import { cn } from "@/lib/utils";

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

const iconButtonClasses =
  "focus-ring rounded-md p-2 text-subtle transition-colors hover:bg-surface-hover hover:text-text";

export default function MessagesPage() {
  const [activeId, setActiveId] = useState(1);
  const [search, setSearch] = useState("");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(chatMessages);

  // May be undefined: the list can be filtered down to nothing, and nothing
  // guarantees `activeId` still points at a conversation that exists.
  const active = conversations.find((c) => c.id === activeId) ?? null;
  const chat = active ? messages[active.id] ?? [] : [];

  const filtered = conversations.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.role.toLowerCase().includes(search.toLowerCase())
  );

  function sendMessage() {
    if (!active || !input.trim()) return;
    const newMsg = {
      id: Date.now(),
      from: "me" as const,
      text: input.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages((prev) => ({ ...prev, [activeId]: [...(prev[activeId] ?? []), newMsg] }));
    setInput("");
  }

  return (
    // The shell is a fixed-height flex column; every scrolling descendant gets
    // min-h-0 so it scrolls instead of stretching the shell.
    <div className="flex h-[calc(100vh-140px)] min-h-0 overflow-hidden rounded-lg border border-border bg-surface-raised shadow-sm">
      {/* Conversation sidebar */}
      <div className="flex w-80 min-h-0 shrink-0 flex-col border-r border-border">
        <div className="border-b border-border px-4 pb-3 pt-5">
          <div className="mb-3.5 flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-text">Messages</h2>
            <Button size="sm" aria-label="New conversation" className="px-2 py-2">
              <Plus className="size-4" />
            </Button>
          </div>
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations…"
            icon={<Search className="size-4" />}
            aria-label="Search conversations"
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2">
          {filtered.length === 0 && (
            <EmptyState
              icon={<Search className="size-5" />}
              title="No conversations found"
              description={
                search
                  ? `Nothing matches “${search}”. Try a different name or role.`
                  : "You have no conversations yet."
              }
              action={
                search ? (
                  <Button variant="outline" size="sm" onClick={() => setSearch("")}>
                    Clear search
                  </Button>
                ) : undefined
              }
            />
          )}
          {filtered.map((c) => {
            const isActive = c.id === activeId;
            return (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                aria-current={isActive}
                className={cn(
                  "focus-ring mb-0.5 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors",
                  isActive ? "bg-primary-soft" : "hover:bg-surface-hover"
                )}
              >
                <div className="relative shrink-0">
                  <Avatar name={c.name} size="md" />
                  {c.online && (
                    <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-surface-raised bg-success" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={cn(
                        "truncate text-sm text-text",
                        c.unread > 0 ? "font-semibold" : "font-medium"
                      )}
                    >
                      {c.name}
                    </p>
                    <span className="shrink-0 text-xs text-subtle">{c.time}</span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <p
                      className={cn(
                        "flex-1 truncate text-xs",
                        c.unread > 0 ? "font-medium text-text" : "text-subtle"
                      )}
                    >
                      {c.last}
                    </p>
                    {c.unread > 0 && (
                      <span className="flex size-4.5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-white">
                        {c.unread}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {!active ? (
          <div className="flex min-h-0 flex-1 items-center justify-center p-6">
            <EmptyState
              icon={<MessagesSquare className="size-5" />}
              title="Select a conversation"
              description="Choose someone from the list on the left to read and reply to their messages."
            />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="relative shrink-0">
                  <Avatar name={active.name} size="md" />
                  {active.online && (
                    <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-surface-raised bg-success" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-text">{active.name}</p>
                  <p className={cn("mt-0.5 truncate text-xs", active.online ? "text-success" : "text-subtle")}>
                    {active.online ? "Online" : active.role}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button aria-label="Voice call" className={iconButtonClasses}>
                  <Phone className="size-4.5" />
                </button>
                <button aria-label="Video call" className={iconButtonClasses}>
                  <Video className="size-4.5" />
                </button>
                <button aria-label="More options" className={iconButtonClasses}>
                  <MoreVertical className="size-4.5" />
                </button>
              </div>
            </div>
    
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-6">
              {chat.length === 0 && (
                <div className="flex flex-1 items-center justify-center">
                  <p className="text-sm text-subtle">No messages yet. Say hi! 👋</p>
                </div>
              )}
              {chat.map((msg) => {
                const mine = msg.from === "me";
                return (
                  <div key={msg.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                    <div className="max-w-[65%]">
                      <div
                        className={cn(
                          "px-3.5 py-2.5 text-sm leading-relaxed",
                          mine
                            ? "rounded-lg rounded-br-sm bg-primary text-white shadow-sm"
                            : "rounded-lg rounded-bl-sm bg-surface-hover text-text"
                        )}
                      >
                        {msg.text}
                      </div>
                      <p
                        className={cn("mt-1 text-xs text-subtle", mine ? "text-right" : "text-left")}
                      >
                        {msg.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
    
            <div className="border-t border-border px-6 py-4">
              <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-2 py-2 pl-3">
                <button aria-label="Attach file" className={cn(iconButtonClasses, "p-1.5")}>
                  <Paperclip className="size-4" />
                </button>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Type a message…"
                  aria-label="Message"
                  className="min-w-0 flex-1 border-none bg-transparent text-sm text-text outline-none placeholder:text-subtle"
                />
                <button aria-label="Insert emoji" className={cn(iconButtonClasses, "p-1.5")}>
                  <Smile className="size-4" />
                </button>
                <Button onClick={sendMessage} disabled={!input.trim()} size="sm">
                  <Send className="size-4" />
                  Send
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

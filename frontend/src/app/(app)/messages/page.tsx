"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, Send, Plus, MessagesSquare, RefreshCw } from "lucide-react";
import { Avatar, Button, EmptyState, Input, Modal } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  messagesApi,
  type Conversation,
  type MessageContact,
  type ThreadMessage,
} from "@/lib/api/messages";

/** A short, friendly timestamp for the sidebar + message rows. */
function when(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { day: "2-digit", month: "short" });
}

const roleLabel = (r: string) =>
  r ? r.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "";

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contacts, setContacts] = useState<MessageContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [activeEmail, setActiveEmail] = useState<string | null>(null);
  const [thread, setThread] = useState<ThreadMessage[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const [composeOpen, setComposeOpen] = useState(false);
  const [contactSearch, setContactSearch] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    try {
      const [convos, people] = await Promise.all([
        messagesApi.conversations(),
        messagesApi.contacts(),
      ]);
      setConversations(convos);
      setContacts(people);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load messages.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      if (!cancelled) void loadConversations();
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [loadConversations]);

  // Load the selected conversation's thread (and mark it read server-side).
  const loadThread = useCallback(async (email: string) => {
    setThreadLoading(true);
    try {
      const msgs = await messagesApi.thread(email);
      setThread(msgs);
    } catch {
      setThread([]);
    } finally {
      setThreadLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      if (cancelled) return;
      if (!activeEmail) {
        setThread([]);
        return;
      }
      void loadThread(activeEmail);
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [activeEmail, loadThread]);

  // Keep the chat scrolled to the newest message.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [thread]);

  // The active party — from an existing conversation, or a contact for a brand-new one.
  const activeParty = useMemo(() => {
    if (!activeEmail) return null;
    const c = conversations.find((x) => x.email === activeEmail);
    if (c) return { email: c.email, name: c.name, role: c.role };
    const p = contacts.find((x) => x.email === activeEmail);
    return p ? { email: p.email, name: p.name, role: p.role } : { email: activeEmail, name: activeEmail, role: "" };
  }, [activeEmail, conversations, contacts]);

  const visibleConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    );
  }, [conversations, search]);

  const visibleContacts = useMemo(() => {
    const q = contactSearch.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) => c.name.toLowerCase().includes(q) || c.role.toLowerCase().includes(q)
    );
  }, [contacts, contactSearch]);

  async function handleSend() {
    const body = input.trim();
    if (!activeEmail || !body || sending) return;
    setSending(true);
    try {
      const created = await messagesApi.send(activeEmail, body);
      setThread((prev) => [...prev, created]);
      setInput("");
      void loadConversations(); // refresh the sidebar preview + ordering
    } catch {
      // keep the typed text so the user can retry
    } finally {
      setSending(false);
    }
  }

  // Opening a conversation marks it read server-side (in loadThread); clear the
  // sidebar badge optimistically so it doesn't linger until the next refresh.
  const openConversation = (email: string) => {
    setActiveEmail(email);
    setConversations((prev) => prev.map((c) => (c.email === email ? { ...c, unread: 0 } : c)));
  };

  const startConversation = (email: string) => {
    setActiveEmail(email);
    setComposeOpen(false);
    setContactSearch("");
  };

  return (
    <div className="flex h-[calc(100vh-140px)] min-h-0 overflow-hidden rounded-lg border border-border bg-surface-raised shadow-sm">
      {/* Conversation sidebar */}
      <div className="flex w-80 min-h-0 shrink-0 flex-col border-r border-border">
        <div className="border-b border-border px-4 pb-3 pt-5">
          <div className="mb-3.5 flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-text">Messages</h2>
            <div className="flex items-center gap-1">
              <button
                aria-label="Refresh"
                className="focus-ring rounded-md p-2 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
                onClick={() => void loadConversations()}
              >
                <RefreshCw className="size-4" />
              </button>
              <Button size="sm" aria-label="New message" className="px-2 py-2" onClick={() => setComposeOpen(true)}>
                <Plus className="size-4" />
              </Button>
            </div>
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
          {error ? (
            <EmptyState
              icon={<Search className="size-5" />}
              title="Could not load messages"
              description={error}
              action={
                <Button variant="outline" size="sm" onClick={() => void loadConversations()}>
                  Try again
                </Button>
              }
            />
          ) : loading ? (
            <p className="px-3 py-4 text-sm text-subtle">Loading conversations…</p>
          ) : visibleConversations.length === 0 ? (
            <EmptyState
              icon={<MessagesSquare className="size-5" />}
              title={search ? "No matches" : "No conversations yet"}
              description={
                search
                  ? `Nothing matches “${search}”.`
                  : "Start a conversation with someone at your school."
              }
              action={
                <Button variant="outline" size="sm" onClick={() => setComposeOpen(true)}>
                  New message
                </Button>
              }
            />
          ) : (
            visibleConversations.map((c) => {
              const isActive = c.email === activeEmail;
              return (
                <button
                  key={c.email}
                  onClick={() => openConversation(c.email)}
                  aria-current={isActive}
                  className={cn(
                    "focus-ring mb-0.5 flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors",
                    isActive ? "bg-primary-soft" : "hover:bg-surface-hover"
                  )}
                >
                  <Avatar name={c.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("truncate text-sm text-text", c.unread > 0 ? "font-semibold" : "font-medium")}>
                        {c.name}
                      </p>
                      <span className="shrink-0 text-xs text-subtle">{when(c.lastAt)}</span>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <p className={cn("flex-1 truncate text-xs", c.unread > 0 ? "font-medium text-text" : "text-subtle")}>
                        {c.lastBody}
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
            })
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {!activeParty ? (
          <div className="flex min-h-0 flex-1 items-center justify-center p-6">
            <EmptyState
              icon={<MessagesSquare className="size-5" />}
              title="Select a conversation"
              description="Choose someone from the list, or start a new message, to read and reply."
            />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-border px-6 py-4">
              <Avatar name={activeParty.name} size="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-text">{activeParty.name}</p>
                <p className="mt-0.5 truncate text-xs text-subtle">
                  {roleLabel(activeParty.role) || activeParty.email}
                </p>
              </div>
            </div>

            <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-6">
              {threadLoading ? (
                <p className="text-center text-sm text-subtle">Loading…</p>
              ) : thread.length === 0 ? (
                <div className="flex flex-1 items-center justify-center">
                  <p className="text-sm text-subtle">No messages yet. Say hi! 👋</p>
                </div>
              ) : (
                thread.map((msg) => (
                  <div key={msg.id} className={cn("flex", msg.mine ? "justify-end" : "justify-start")}>
                    <div className="max-w-[65%]">
                      <div
                        className={cn(
                          "px-3.5 py-2.5 text-sm leading-relaxed",
                          msg.mine
                            ? "rounded-lg rounded-br-sm bg-primary text-white shadow-sm"
                            : "rounded-lg rounded-bl-sm bg-surface-hover text-text"
                        )}
                      >
                        {msg.body}
                      </div>
                      <p className={cn("mt-1 text-xs text-subtle", msg.mine ? "text-right" : "text-left")}>
                        {when(msg.at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-border px-6 py-4">
              <div className="flex items-center gap-2 rounded-md border border-border bg-surface px-2 py-2 pl-3">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void handleSend();
                    }
                  }}
                  placeholder="Type a message…"
                  aria-label="Message"
                  className="min-w-0 flex-1 border-none bg-transparent text-sm text-text outline-none placeholder:text-subtle"
                />
                <Button onClick={() => void handleSend()} disabled={!input.trim() || sending} size="sm">
                  <Send className="size-4" />
                  {sending ? "Sending…" : "Send"}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* New-message: pick a recipient from the school */}
      <Modal
        open={composeOpen}
        onOpenChange={setComposeOpen}
        title="New message"
        description="Choose someone at your school to start a conversation with."
      >
        <div className="flex flex-col gap-3">
          <Input
            type="search"
            autoFocus
            value={contactSearch}
            onChange={(e) => setContactSearch(e.target.value)}
            placeholder="Search by name or role…"
            icon={<Search className="size-4" />}
            aria-label="Search people"
          />
          <div className="max-h-80 overflow-y-auto rounded-md border border-border">
            {visibleContacts.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-subtle">
                {contacts.length === 0 ? "No other users in your school yet." : "No one matches that search."}
              </p>
            ) : (
              visibleContacts.map((p) => (
                <button
                  key={p.email}
                  onClick={() => startConversation(p.email)}
                  className="focus-ring flex w-full items-center gap-3 border-b border-border px-4 py-2.5 text-left transition-colors last:border-0 hover:bg-surface-hover"
                >
                  <Avatar name={p.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text">{p.name}</p>
                    <p className="truncate text-xs text-subtle">{roleLabel(p.role) || p.email}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

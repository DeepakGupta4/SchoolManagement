"use client";

import React, { useMemo, useState } from "react";
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
import {
  Avatar,
  Button,
  ConfirmDialog,
  EmptyState,
  Input,
  Modal,
  Select,
  Textarea,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { useResource } from "@/hooks/useResource";
import {
  messagesApi,
  MESSAGE_CATEGORY_OPTIONS,
  type Message,
} from "@/lib/api/messages";

const iconButtonClasses =
  "focus-ring rounded-md p-2 text-subtle transition-colors hover:bg-surface-hover hover:text-text";

type LocalReply = { id: number; from: "me" | "them"; text: string; time: string };

const emptyCompose = { name: "", role: "", subject: "", body: "", category: "Direct", time: "" };

export default function MessagesPage() {
  const [search, setSearch] = useState("");
  const filters = useMemo(() => ({ search }), [search]);

  const { items, loading, error, refetch, save, remove, saving, deleting } = useResource(
    messagesApi,
    filters,
    { label: "message", describe: (m) => m.name }
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  // Replies typed in this session, keyed by message id. Persisted messaging
  // would need its own thread model; this keeps the chat panel interactive.
  const [localReplies, setLocalReplies] = useState<Record<string, LocalReply[]>>({});

  const [composeOpen, setComposeOpen] = useState(false);
  const [compose, setCompose] = useState(emptyCompose);
  const [pendingDelete, setPendingDelete] = useState<Message | null>(null);

  // The list can be filtered down to nothing, and nothing guarantees `activeId`
  // still points at a message that exists.
  const active = items.find((m) => m.id === activeId) ?? null;

  const chat = useMemo<LocalReply[]>(() => {
    if (!active) return [];
    const base: LocalReply[] = active.body
      ? [{ id: 0, from: "them", text: active.body, time: active.time }]
      : [];
    return [...base, ...(localReplies[active.id] ?? [])];
  }, [active, localReplies]);

  function sendMessage() {
    if (!active || !input.trim()) return;
    const newMsg: LocalReply = {
      id: Date.now(),
      from: "me",
      text: input.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setLocalReplies((prev) => ({ ...prev, [active.id]: [...(prev[active.id] ?? []), newMsg] }));
    setInput("");
  }

  const openCompose = () => {
    setCompose(emptyCompose);
    setComposeOpen(true);
  };

  const handleCompose = async () => {
    if (!compose.name.trim()) return;
    const ok = await save(
      {
        name: compose.name.trim(),
        role: compose.role.trim(),
        subject: compose.subject.trim(),
        body: compose.body.trim(),
        category: compose.category,
        time:
          compose.time.trim() ||
          new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        unread: 0,
        online: false,
        read: true,
      },
      null
    );
    if (ok) setComposeOpen(false);
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    const ok = await remove(pendingDelete);
    if (ok) {
      if (activeId === pendingDelete.id) setActiveId(null);
      setPendingDelete(null);
    }
  };

  return (
    // The shell is a fixed-height flex column; every scrolling descendant gets
    // min-h-0 so it scrolls instead of stretching the shell.
    <div className="flex h-[calc(100vh-140px)] min-h-0 overflow-hidden rounded-lg border border-border bg-surface-raised shadow-sm">
      {/* Conversation sidebar */}
      <div className="flex w-80 min-h-0 shrink-0 flex-col border-r border-border">
        <div className="border-b border-border px-4 pb-3 pt-5">
          <div className="mb-3.5 flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-text">Messages</h2>
            <Button size="sm" aria-label="New conversation" className="px-2 py-2" onClick={openCompose}>
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
          {error ? (
            <EmptyState
              icon={<Search className="size-5" />}
              title="Could not load messages"
              description={error}
              action={
                <Button variant="outline" size="sm" onClick={refetch}>
                  Try again
                </Button>
              }
            />
          ) : loading ? (
            <p className="px-3 py-4 text-sm text-subtle">Loading conversations…</p>
          ) : items.length === 0 ? (
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
                ) : (
                  <Button variant="outline" size="sm" onClick={openCompose}>
                    New conversation
                  </Button>
                )
              }
            />
          ) : (
            items.map((c) => {
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
                        {c.body}
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
                <button
                  aria-label="Delete conversation"
                  className={iconButtonClasses}
                  onClick={() => setPendingDelete(active)}
                >
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

      <Modal
        open={composeOpen}
        onOpenChange={setComposeOpen}
        title="New conversation"
        description="Start a conversation. It is saved and appears in the list."
        footer={
          <>
            <Button variant="outline" onClick={() => setComposeOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleCompose} disabled={saving || !compose.name.trim()}>
              {saving ? "Saving…" : "Create"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Name"
              required
              placeholder="Dr. Priya Sharma"
              value={compose.name}
              onChange={(e) => setCompose((c) => ({ ...c, name: e.target.value }))}
            />
            <Input
              label="Role"
              placeholder="Math Teacher"
              value={compose.role}
              onChange={(e) => setCompose((c) => ({ ...c, role: e.target.value }))}
            />
            <Select
              label="Category"
              options={MESSAGE_CATEGORY_OPTIONS.map((o) => ({ label: o, value: o }))}
              value={compose.category}
              onChange={(e) => setCompose((c) => ({ ...c, category: e.target.value }))}
            />
            <Input
              label="Subject"
              placeholder="Exam schedule"
              value={compose.subject}
              onChange={(e) => setCompose((c) => ({ ...c, subject: e.target.value }))}
            />
          </div>
          <Textarea
            label="Message"
            rows={3}
            placeholder="Type the first message…"
            value={compose.body}
            onChange={(e) => setCompose((c) => ({ ...c, body: e.target.value }))}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete conversation?"
        description={
          pendingDelete
            ? `The conversation with ${pendingDelete.name} will be permanently removed. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  );
}

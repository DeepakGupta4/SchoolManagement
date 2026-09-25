"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, X } from "lucide-react";
import { chatWithAssistant, type ChatTurn } from "@/lib/api/ai";
import { cn } from "@/lib/utils";

interface Msg {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// Monotonic id source — avoids Date.now()/Math.random() in component scope,
// which the React Compiler purity lint rejects.
let msgSeq = 0;
const nextId = (prefix: string) => `${prefix}-${(msgSeq += 1)}`;

const GREETING: Msg = {
  id: "greet",
  role: "assistant",
  content:
    "Hi! I'm the SchoolDeck assistant. Ask me how to do anything in the app — attendance, fees, exams, adding students — or about your school's numbers.",
};

const SUGGESTIONS = [
  "How do I mark attendance?",
  "How many students are active?",
  "How do I collect a fee?",
];

export function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the newest message in view.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const history: ChatTurn[] = messages
      .filter((m) => m.id !== "greet")
      .map((m) => ({ role: m.role, content: m.content }));

    const userMsg: Msg = { id: nextId("u"), role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const { reply } = await chatWithAssistant(trimmed, history);
      setMessages((prev) => [...prev, { id: nextId("a"), role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: nextId("e"),
          role: "assistant",
          content: "Sorry, I couldn't reach the assistant just now. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Launcher */}
      <div className="fixed bottom-4 right-4 z-40 lg:bottom-6 lg:right-6">
        {/* Radar pulse — draws the eye while the chat is closed. Uses a custom
            keyframe kept alive under reduced-motion (see globals.css). */}
        {!open && <span aria-hidden className="chat-ring absolute inset-0 rounded-full bg-primary/40" />}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Close assistant" : "Open assistant"}
          className={cn(
            "focus-ring group relative flex size-14 items-center justify-center rounded-full text-white shadow-lg shadow-primary/40 transition-all duration-300 hover:scale-110 active:scale-95",
            "bg-linear-to-br from-primary to-violet"
          )}
        >
          {open ? (
            <X className="size-5 transition-transform duration-300" />
          ) : (
            <Bot className="size-6 transition-transform duration-300 group-hover:rotate-12" />
          )}

          {!open && (
            <>
              {/* Sparkle accent (animate-pulse stays alive under reduced motion). */}
              <Sparkles className="absolute -right-0.5 -top-0.5 size-4 animate-pulse text-amber-300" />
              {/* Online dot */}
              <span className="absolute bottom-0.5 right-0.5 size-3 rounded-full border-2 border-white bg-success" />
            </>
          )}
        </button>
      </div>

      {/* Panel */}
      {open && (
        <div
          className="fixed bottom-20 right-4 z-40 flex max-h-[70vh] w-[calc(100vw-2rem)] max-w-96 flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl lg:bottom-24 lg:right-6"
          role="dialog"
          aria-label="SchoolDeck assistant"
          style={{ animation: "overlay-in var(--duration-base) var(--ease-out)" }}
        >
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-border bg-linear-to-r from-primary-soft to-violet-soft/40 px-4 py-3">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-white">
              <Sparkles className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text">SchoolDeck Assistant</p>
              <p className="text-[11px] text-muted">Ask about the app or your school</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="focus-ring ml-auto rounded-md p-1 text-subtle transition-colors hover:bg-surface-hover hover:text-text"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((m) => (
              <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm",
                    m.role === "user"
                      ? "rounded-br-sm bg-primary text-white"
                      : "rounded-bl-sm bg-surface-hover text-text"
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-surface-hover px-3 py-2.5">
                  <span className="size-1.5 animate-bounce rounded-full bg-subtle [animation-delay:-0.3s]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-subtle [animation-delay:-0.15s]" />
                  <span className="size-1.5 animate-bounce rounded-full bg-subtle" />
                </div>
              </div>
            )}

            {/* Suggestions — only before the first question */}
            {messages.length === 1 && !loading && (
              <div className="flex flex-col gap-1.5 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="focus-ring w-fit rounded-full border border-border bg-surface px-3 py-1.5 text-left text-xs text-muted transition-colors hover:border-border-strong hover:text-text"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-border p-2.5"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask something…"
              className="focus-ring min-w-0 flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-subtle"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              aria-label="Send"
              className="focus-ring flex size-9 shrink-0 items-center justify-center rounded-md bg-primary text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
            >
              <Send className="size-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { CornerDownLeft, Search } from "lucide-react";
import { flatNav, type FlatNavItem } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/** Subsequence match, so "merl" finds "Merit List". */
function fuzzyScore(text: string, query: string): number | null {
  const t = text.toLowerCase();
  const q = query.toLowerCase();
  if (!q) return 0;

  const direct = t.indexOf(q);
  if (direct !== -1) return direct; // exact substring ranks best

  let ti = 0;
  let gaps = 0;
  for (const char of q) {
    const found = t.indexOf(char, ti);
    if (found === -1) return null;
    gaps += found - ti;
    ti = found + 1;
  }
  return 100 + gaps;
}

const NAVIGABLE = flatNav.filter((item) => !item.soon);

/**
 * Palette body. Mounted only while open, so its state starts fresh on every
 * open — no effect needed to reset the query or the highlight.
 */
function PaletteContent({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [rawIndex, setRawIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return NAVIGABLE.slice(0, 8);

    return NAVIGABLE.map((item) => {
      const haystack = item.parent ? `${item.parent} ${item.title}` : item.title;
      const score = fuzzyScore(haystack, query.trim());
      return score === null ? null : { item, score };
    })
      .filter((r): r is { item: FlatNavItem; score: number } => r !== null)
      .sort((a, b) => a.score - b.score)
      .slice(0, 10)
      .map((r) => r.item);
  }, [query]);

  // Clamped during render rather than corrected in an effect — a shrinking
  // result list must never leave the highlight past the end.
  const activeIndex = Math.min(rawIndex, Math.max(0, results.length - 1));

  const go = (item: FlatNavItem) => {
    onClose();
    router.push(item.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setRawIndex((activeIndex + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setRawIndex((activeIndex - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(results[activeIndex]);
    }
  };

  // Keep the highlighted row inside the scroll viewport.
  useEffect(() => {
    listRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  return (
    <div onKeyDown={onKeyDown}>
      <div className="flex items-center gap-2.5 border-b border-border px-4">
        <Search className="size-4 shrink-0 text-subtle" />
        <input
          autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setRawIndex(0);
          }}
          placeholder="Search pages…"
          aria-label="Search pages"
          className="w-full bg-transparent py-3.5 text-sm text-text outline-none placeholder:text-subtle"
        />
        <kbd className="shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] font-medium text-subtle">
          ESC
        </kbd>
      </div>

      <div ref={listRef} className="max-h-80 overflow-y-auto p-1.5">
        {results.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-muted">
            No pages match &ldquo;{query}&rdquo;
          </p>
        ) : (
          results.map((item, i) => {
            const Icon = item.icon;
            const active = i === activeIndex;
            return (
              <button
                key={`${item.href}-${item.title}`}
                data-active={active}
                onClick={() => go(item)}
                onMouseMove={() => setRawIndex(i)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors",
                  active ? "bg-primary-soft" : "hover:bg-surface-hover"
                )}
              >
                <Icon
                  className={cn("size-4 shrink-0", active ? "text-primary-text" : "text-subtle")}
                />
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block truncate text-sm font-medium",
                      active ? "text-primary-text" : "text-text"
                    )}
                  >
                    {item.parent ? `${item.parent} › ${item.title}` : item.title}
                  </span>
                  <span className="block truncate text-[11px] text-subtle">{item.group}</span>
                </span>
                {active && <CornerDownLeft className="size-3.5 shrink-0 text-primary-text" />}
              </button>
            );
          })
        )}
      </div>

      <div className="flex items-center gap-3 border-t border-border px-4 py-2 text-[11px] text-subtle">
        <span className="flex items-center gap-1">
          <kbd className="rounded border border-border px-1 py-0.5">↑</kbd>
          <kbd className="rounded border border-border px-1 py-0.5">↓</kbd>
          navigate
        </span>
        <span className="flex items-center gap-1">
          <kbd className="rounded border border-border px-1 py-0.5">↵</kbd>
          open
        </span>
      </div>
    </div>
  );
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-70 bg-slate-900/50 backdrop-blur-[2px]"
          style={{ animation: "overlay-in var(--duration-base) var(--ease-out)" }}
        />
        <Dialog.Content
          className="fixed left-1/2 top-[18%] z-70 w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-surface-raised shadow-overlay"
          style={{ animation: "modal-in var(--duration-base) var(--ease-out)" }}
        >
          <Dialog.Title className="sr-only">Search navigation</Dialog.Title>
          <Dialog.Description className="sr-only">
            Type to filter pages, then press Enter to open one.
          </Dialog.Description>

          <PaletteContent onClose={() => onOpenChange(false)} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

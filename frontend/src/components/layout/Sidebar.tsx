"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  School,
  Search,
  X,
} from "lucide-react";
import { useSidebarStore } from "@/store";
import { navGroups, type NavEntry } from "@/lib/navigation";
import { Tooltip, TooltipProvider } from "@/components/ui/Tooltip";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Nav item                                                            */
/* ------------------------------------------------------------------ */

const itemBase =
  "group relative flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors";

function NavLeaf({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavEntry;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const Icon = item.icon;
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

  if (item.soon) {
    const content = (
      <div
        className={cn(itemBase, "cursor-not-allowed text-subtle/70", collapsed && "justify-center px-0")}
      >
        <Icon className="size-4 shrink-0 opacity-60" />
        {!collapsed && (
          <>
            <span className="flex-1 truncate">{item.title}</span>
            <span className="shrink-0 rounded-full bg-surface-hover px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-subtle">
              Soon
            </span>
          </>
        )}
      </div>
    );

    return collapsed ? <Tooltip content={`${item.title} — coming soon`}>{content}</Tooltip> : content;
  }

  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        itemBase,
        "focus-ring",
        collapsed && "justify-center px-0",
        isActive
          ? "bg-primary-soft text-primary-text"
          : "text-muted hover:bg-surface-hover hover:text-text"
      )}
    >
      {/* Active rail marker */}
      {isActive && !collapsed && (
        <span className="absolute -left-2.5 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
      )}
      <Icon className="size-4 shrink-0" />
      {!collapsed && <span className="flex-1 truncate">{item.title}</span>}
    </Link>
  );

  return collapsed ? <Tooltip content={item.title}>{link}</Tooltip> : link;
}

function NavBranch({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavEntry;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  const pathname = usePathname();
  const Icon = item.icon;
  const childActive = item.children!.some((c) => pathname === c.href);
  const isActive = pathname === item.href || childActive;

  // Open state is derived from the route, with a manual toggle layered on
  // top. Tying the override to the pathname means navigating to a child
  // re-derives (revealing it) without needing an effect to sync.
  const [override, setOverride] = useState<{ path: string; open: boolean } | null>(null);
  const open = override?.path === pathname ? override.open : childActive;

  // Collapsed rail has no room for a submenu — behave like a plain link.
  if (collapsed) {
    return <NavLeaf item={{ ...item, children: undefined }} collapsed onNavigate={onNavigate} />;
  }

  return (
    <div>
      <button
        onClick={() => setOverride({ path: pathname, open: !open })}
        aria-expanded={open}
        className={cn(
          itemBase,
          "focus-ring w-full",
          isActive ? "text-text" : "text-muted hover:bg-surface-hover hover:text-text"
        )}
      >
        <Icon className="size-4 shrink-0" />
        <span className="flex-1 truncate text-left">{item.title}</span>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-subtle transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="ml-4 mt-0.5 flex flex-col border-l border-border pl-3">
          {item.children!.map((child) => {
            const active = pathname === child.href;
            return (
              <Link
                key={child.href}
                href={child.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "focus-ring rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                  active
                    ? "bg-primary-soft text-primary-text"
                    : "text-subtle hover:bg-surface-hover hover:text-text"
                )}
              >
                {child.title}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sidebar                                                             */
/* ------------------------------------------------------------------ */

export function Sidebar() {
  const { isCollapsed, toggle, isMobileOpen, closeMobile } = useSidebarStore();
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);
  const savedScroll = useRef(0);

  const [filter, setFilter] = useState("");

  // Preserve nav scroll across route changes — the sidebar remounts on
  // navigation, so the position has to be restored by hand.
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    el.scrollTop = savedScroll.current;
  }, [pathname]);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  const query = filter.trim().toLowerCase();

  const visibleGroups = useMemo(() => {
    if (!query) return navGroups;
    return navGroups
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            item.title.toLowerCase().includes(query) ||
            item.children?.some((c) => c.title.toLowerCase().includes(query))
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [query]);

  const width = isCollapsed ? "72px" : "260px";

  return (
    <TooltipProvider>
      {/* Mobile scrim */}
      {isMobileOpen && (
        <div
          onClick={closeMobile}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-[2px] lg:hidden"
          style={{ animation: "overlay-in var(--duration-base) var(--ease-out)" }}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-border bg-surface",
          // Off-canvas on small screens until opened.
          "max-lg:transition-transform max-lg:duration-300",
          isMobileOpen ? "max-lg:translate-x-0" : "max-lg:-translate-x-full"
        )}
        style={{
          width: isMobileOpen ? "260px" : width,
          transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {/* Brand */}
        <div
          className={cn(
            "flex h-16 shrink-0 items-center gap-2.5 border-b border-border",
            isCollapsed && !isMobileOpen ? "justify-center px-0" : "px-4"
          )}
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md gradient-indigo shadow-sm">
            <School className="size-4 text-white" />
          </div>
          {(!isCollapsed || isMobileOpen) && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text">EduManage</p>
              <p className="truncate text-[11px] text-subtle">Springdale School</p>
            </div>
          )}
          <button
            onClick={closeMobile}
            aria-label="Close navigation"
            className="focus-ring -mr-1 rounded-md p-1.5 text-subtle transition-colors hover:bg-surface-hover hover:text-text lg:hidden"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Nav filter — 35+ destinations is too many to scan by eye */}
        {(!isCollapsed || isMobileOpen) && (
          <div className="shrink-0 px-3 pt-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-subtle" />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter menu…"
                aria-label="Filter navigation"
                className="focus-ring w-full rounded-md border border-border bg-surface-sunken py-1.5 pl-8 pr-7 text-xs text-text transition-colors placeholder:text-subtle hover:border-border-strong"
              />
              {filter && (
                <button
                  onClick={() => setFilter("")}
                  aria-label="Clear filter"
                  className="focus-ring absolute right-1.5 top-1/2 -translate-y-1/2 rounded-sm p-0.5 text-subtle transition-colors hover:text-text"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Nav */}
        <div
          ref={navRef}
          onScroll={(e) => {
            savedScroll.current = e.currentTarget.scrollTop;
          }}
          // `min-h-0` is required: without it a flex-1 child grows to its
          // content height instead of scrolling, pushing the collapse
          // button off the bottom of the rail.
          className="sidebar-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-3 py-3"
        >
          {visibleGroups.length === 0 && (
            <p className="px-2 py-6 text-center text-xs text-subtle">
              No menu items match &ldquo;{filter}&rdquo;
            </p>
          )}

          {visibleGroups.map((group, gi) => {
            const showLabel = !isCollapsed || isMobileOpen;
            return (
              <div key={group.label} className={cn(gi > 0 && "mt-5")}>
                {showLabel ? (
                  <p className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-subtle">
                    {group.label}
                  </p>
                ) : (
                  gi > 0 && <div className="mx-1 mb-2 h-px bg-border" />
                )}

                <div className="flex flex-col gap-0.5">
                  {group.items.map((item) =>
                    item.children?.length ? (
                      <NavBranch
                        key={item.href}
                        item={item}
                        collapsed={isCollapsed && !isMobileOpen}
                        onNavigate={closeMobile}
                      />
                    ) : (
                      <NavLeaf
                        key={item.href}
                        item={item}
                        collapsed={isCollapsed && !isMobileOpen}
                        onNavigate={closeMobile}
                      />
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Collapse toggle — desktop only */}
        <div className="shrink-0 border-t border-border p-2.5 max-lg:hidden">
          <button
            onClick={toggle}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "focus-ring flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium text-muted transition-colors hover:bg-surface-hover hover:text-text",
              isCollapsed && "justify-center px-0"
            )}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <>
                <PanelLeftClose className="size-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}

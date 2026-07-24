"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Bell, ChevronDown, LogOut, Menu, Search, Settings } from "lucide-react";
import { useAuthStore, useSidebarStore } from "@/store";
import { logout as apiLogout } from "@/lib/api/auth";
import { Avatar } from "@/components/ui";
import { breadcrumbFor } from "@/lib/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { CommandPalette } from "./CommandPalette";
import { cn } from "@/lib/utils";

const menuItemClasses =
  "flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-[13px] outline-none transition-colors";

interface Notification {
  id: number;
  title: string;
  detail: string;
  unread: boolean;
  /** Where clicking the notification takes you. */
  href: string;
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: 1, title: "14 students marked absent", detail: "Attendance · today", unread: true, href: "/attendance" },
  { id: 2, title: "₹1,24,000 fees pending", detail: "Finance · 9 defaulters", unread: true, href: "/fees/defaulters" },
  { id: 3, title: "Exam schedule published", detail: "Examinations · 2 days ago", unread: false, href: "/exams/schedule" },
];

export function Topbar() {
  const { user, signOut } = useAuthStore();
  const { isCollapsed, openMobile } = useSidebarStore();
  const pathname = usePathname();
  const router = useRouter();

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const handleLogout = () => {
    // Clears the stored token as well as the in-memory session, so a refresh
    // can't silently restore the account that just signed out.
    apiLogout();
    signOut();
    router.replace("/login");
  };

  const openNotification = (n: Notification) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === n.id ? { ...item, unread: false } : item))
    );
    router.push(n.href);
  };

  const markAllRead = () =>
    setNotifications((prev) => prev.map((item) => ({ ...item, unread: false })));
  const trail = breadcrumbFor(pathname);
  // Derived from state, not the seed const — otherwise the badge never clears.
  const unreadCount = notifications.filter((n) => n.unread).length;

  // ⌘K / Ctrl+K opens the palette from anywhere.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <header
        // `left` must stay a class, not an inline style — an inline value would
        // beat the `lg:` variant and leave the header offset on mobile too.
        className="fixed left-0 right-0 top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/85 px-4 backdrop-blur-md sm:px-6 lg:left-[var(--rail)]"
        style={{
          ["--rail" as string]: isCollapsed ? "72px" : "260px",
          transition: "left 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        <button
          onClick={openMobile}
          aria-label="Open navigation"
          className="focus-ring -ml-1 rounded-md p-2 text-muted transition-colors hover:bg-surface-hover hover:text-text lg:hidden"
        >
          <Menu size={18} />
        </button>

        {/* Breadcrumb — tells you where you are without reading the sidebar */}
        <nav aria-label="Breadcrumb" className="min-w-0 flex-1 max-sm:hidden">
          <ol className="flex items-center gap-1.5 text-[13px]">
            {trail.map((crumb, i) => (
              <li key={`${crumb}-${i}`} className="flex min-w-0 items-center gap-1.5">
                {i > 0 && <span className="text-subtle">/</span>}
                <span
                  className={cn(
                    "truncate",
                    i === trail.length - 1 ? "font-medium text-text" : "text-subtle"
                  )}
                >
                  {crumb}
                </span>
              </li>
            ))}
          </ol>
        </nav>

        {/* Search trigger — opens the command palette */}
        <button
          onClick={() => setPaletteOpen(true)}
          className="focus-ring group flex items-center gap-2 rounded-md border border-border bg-surface-sunken py-2 pl-2.5 pr-2 text-[13px] text-subtle transition-colors hover:border-border-strong hover:text-muted max-sm:ml-auto sm:w-64"
        >
          <Search className="size-4 shrink-0" />
          <span className="flex-1 text-left max-sm:hidden">Search…</span>
          <kbd className="hidden shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] font-medium sm:block">
            ⌘K
          </kbd>
        </button>

        <div className="flex items-center gap-1">
          <ThemeToggle />

          {/* Notifications */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ""}`}
                className="focus-ring relative rounded-md p-2 text-muted transition-colors hover:bg-surface-hover hover:text-text"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 size-2 rounded-full border-2 border-surface bg-danger" />
                )}
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={8}
                className="z-50 w-[300px] overflow-hidden rounded-lg border border-border bg-surface-raised shadow-lg"
              >
                <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
                  <p className="text-[13px] font-semibold text-text">Notifications</p>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="focus-ring rounded-sm text-[11px] font-medium text-primary transition-colors hover:text-primary-hover"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto p-1.5">
                  {notifications.length === 0 && (
                    <p className="px-3 py-8 text-center text-sm text-muted">You&apos;re all caught up.</p>
                  )}
                  {notifications.map((n) => (
                    <DropdownMenu.Item
                      key={n.id}
                      onSelect={() => openNotification(n)}
                      className="flex cursor-pointer items-start gap-2.5 rounded-md px-3 py-2.5 outline-none transition-colors data-[highlighted]:bg-surface-hover"
                    >
                      <span
                        className={cn(
                          "mt-1.5 size-1.5 shrink-0 rounded-full",
                          n.unread ? "bg-primary" : "bg-transparent"
                        )}
                      />
                      <span className="min-w-0">
                        <span className="block text-[13px] font-medium text-text">{n.title}</span>
                        <span className="mt-0.5 block text-[11px] text-subtle">{n.detail}</span>
                      </span>
                    </DropdownMenu.Item>
                  ))}
                </div>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          <div className="mx-1 h-6 w-px bg-border max-sm:hidden" />

          {/* User menu */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                // Below `lg` the name and role are hidden, so without this the
                // trigger announces as an unlabelled image + chevron.
                aria-label={`Account menu for ${user?.name ?? "current user"}`}
                className="focus-ring flex items-center gap-2.5 rounded-md p-1.5 transition-colors hover:bg-surface-hover sm:pr-2.5"
              >
                <Avatar name={user?.name ?? "Admin"} size="sm" className="rounded-md" />
                <div className="text-left max-lg:hidden">
                  <p className="text-[13px] font-semibold leading-tight text-text">{user?.name}</p>
                  <p className="mt-px text-[11px] capitalize text-subtle">
                    {user?.role?.replace("_", " ")}
                  </p>
                </div>
                <ChevronDown size={14} className="text-subtle max-lg:hidden" />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={8}
                className="z-50 min-w-[210px] rounded-lg border border-border bg-surface-raised p-1.5 shadow-lg"
              >
                <div className="mb-1 border-b border-border px-3 py-2.5">
                  <p className="text-[13px] font-semibold text-text">{user?.name}</p>
                  <p className="mt-0.5 text-[11px] text-subtle">{user?.email}</p>
                </div>

                <DropdownMenu.Item
                  onSelect={() => router.push("/settings")}
                  className={`${menuItemClasses} text-text data-[highlighted]:bg-surface-hover`}
                >
                  <Settings size={15} className="text-subtle" />
                  Settings
                </DropdownMenu.Item>

                <div className="my-1 h-px bg-border" />

                <DropdownMenu.Item
                  onSelect={handleLogout}
                  className={`${menuItemClasses} text-danger data-[highlighted]:bg-danger-soft`}
                >
                  <LogOut size={15} />
                  Logout
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </header>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </>
  );
}

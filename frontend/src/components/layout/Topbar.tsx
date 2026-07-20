"use client";
import React from "react";
import { Bell, Search, LogOut, User, Settings, ChevronDown } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useAuthStore, useSidebarStore } from "@/store";
import { Avatar } from "@/components/ui";
import { ThemeToggle } from "./ThemeToggle";

const menuItemClasses =
  "flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-[13px] outline-none transition-colors";

export function Topbar() {
  const { user } = useAuthStore();
  const { isCollapsed } = useSidebarStore();

  return (
    <header
      className="fixed right-0 top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-surface px-6 shadow-sm"
      style={{
        left: isCollapsed ? "64px" : "260px",
        transition: "left 0.3s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      {/* Search */}
      <div className="relative w-full max-w-[380px]">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle"
        />
        <input
          type="search"
          placeholder="Search students, fees, reports…"
          className="focus-ring w-full rounded-md border border-border bg-surface-sunken py-2.5 pl-9 pr-4 text-[13px] text-text transition-colors placeholder:text-subtle hover:border-border-strong"
        />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <ThemeToggle />

        <button
          aria-label="Notifications"
          className="focus-ring relative rounded-md p-2 text-muted transition-colors hover:bg-surface-hover hover:text-text"
        >
          <Bell size={18} />
          <span className="absolute right-2 top-2 size-[7px] rounded-full border-2 border-surface bg-danger" />
        </button>

        <div className="mx-1 h-6 w-px bg-border" />

        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="focus-ring flex items-center gap-2.5 rounded-md p-1.5 pr-2.5 transition-colors hover:bg-surface-hover">
              <Avatar name={user?.name ?? "Admin"} size="sm" className="rounded-md" />
              <div className="text-left">
                <p className="text-[13px] font-semibold leading-tight text-text">{user?.name}</p>
                <p className="mt-px text-[11px] capitalize text-subtle">
                  {user?.role?.replace("_", " ")}
                </p>
              </div>
              <ChevronDown size={14} className="text-subtle" />
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

              {[
                { icon: User, label: "My Profile" },
                { icon: Settings, label: "Settings" },
              ].map(({ icon: Icon, label }) => (
                <DropdownMenu.Item
                  key={label}
                  className={`${menuItemClasses} text-text data-[highlighted]:bg-surface-hover`}
                >
                  <Icon size={15} className="text-subtle" />
                  {label}
                </DropdownMenu.Item>
              ))}

              <div className="my-1 h-px bg-border" />

              <DropdownMenu.Item
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
  );
}

"use client";
import React from "react";
import { Bell, Search, LogOut, User, Settings, ChevronDown } from "lucide-react";
import { useAuthStore, useSidebarStore } from "@/store";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

export function Topbar() {
  const { user } = useAuthStore();
  const { isCollapsed } = useSidebarStore();

  return (
    <header style={{
      position: "fixed",
      top: 0,
      left: isCollapsed ? "64px" : "260px",
      right: 0,
      height: "64px",
      background: "#fff",
      borderBottom: "1px solid #f1f5f9",
      display: "flex",
      alignItems: "center",
      padding: "0 24px",
      gap: "16px",
      zIndex: 30,
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      transition: "left 0.3s cubic-bezier(0.4,0,0.2,1)",
    }}>
      {/* Search */}
      <div style={{ flex: 1, maxWidth: "380px" }}>
        <div style={{ position: "relative" }}>
          <Search size={15} color="#94a3b8" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            placeholder="Search students, fees, reports..."
            style={{
              width: "100%",
              paddingLeft: "36px",
              paddingRight: "16px",
              paddingTop: "9px",
              paddingBottom: "9px",
              fontSize: "13px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              outline: "none",
              color: "#334155",
              fontFamily: "inherit",
            }}
            onFocus={e => {
              e.target.style.borderColor = "#6366f1";
              e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)";
            }}
            onBlur={e => {
              e.target.style.borderColor = "#e2e8f0";
              e.target.style.boxShadow = "none";
            }}
          />
        </div>
      </div>

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "auto" }}>

        {/* Notification */}
        <button
          style={{ position: "relative", padding: "8px", borderRadius: "10px", border: "none", background: "transparent", cursor: "pointer", color: "#64748b", transition: "background 0.15s" }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "#f8fafc"}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "transparent"}
        >
          <Bell size={18} />
          <span style={{ position: "absolute", top: "8px", right: "8px", width: "7px", height: "7px", background: "#ef4444", borderRadius: "50%", border: "2px solid #fff" }} />
        </button>

        {/* Divider */}
        <div style={{ width: "1px", height: "24px", background: "#e2e8f0", margin: "0 4px" }} />

        {/* User dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button style={{
              display: "flex", alignItems: "center", gap: "10px",
              padding: "6px 10px 6px 6px",
              borderRadius: "12px", border: "none", background: "transparent",
              cursor: "pointer", transition: "background 0.15s",
            }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = "#f8fafc"}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = "transparent"}
            >
              <div style={{
                width: "34px", height: "34px", borderRadius: "10px",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: "14px", fontWeight: 700,
                boxShadow: "0 2px 8px rgba(99,102,241,0.35)",
                flexShrink: 0,
              }}>
                {user?.name?.charAt(0) ?? "A"}
              </div>
              <div style={{ textAlign: "left" }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a", lineHeight: 1.2 }}>{user?.name}</p>
                <p style={{ fontSize: "11px", color: "#94a3b8", textTransform: "capitalize", marginTop: "1px" }}>
                  {user?.role?.replace("_", " ")}
                </p>
              </div>
              <ChevronDown size={14} color="#94a3b8" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              style={{
                minWidth: "210px", background: "#fff",
                border: "1px solid #f1f5f9", borderRadius: "16px",
                boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
                padding: "6px", zIndex: 50,
              }}
              align="end"
              sideOffset={8}
            >
              {/* User info */}
              <div style={{ padding: "10px 12px 10px", borderBottom: "1px solid #f1f5f9", marginBottom: "4px" }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#0f172a" }}>{user?.name}</p>
                <p style={{ fontSize: "11px", color: "#94a3b8", marginTop: "2px" }}>{user?.email}</p>
              </div>

              {[{ icon: User, label: "My Profile" }, { icon: Settings, label: "Settings" }].map(({ icon: Icon, label }) => (
                <DropdownMenu.Item key={label} style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  padding: "9px 12px", borderRadius: "10px",
                  fontSize: "13px", color: "#334155", cursor: "pointer", outline: "none",
                }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "#f8fafc"}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
                >
                  <Icon size={15} color="#94a3b8" />
                  {label}
                </DropdownMenu.Item>
              ))}

              <div style={{ height: "1px", background: "#f1f5f9", margin: "4px 0" }} />

              <DropdownMenu.Item style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "9px 12px", borderRadius: "10px",
                fontSize: "13px", color: "#ef4444", cursor: "pointer", outline: "none",
              }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "#fff1f2"}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
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

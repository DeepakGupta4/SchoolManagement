"use client";
import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebarStore } from "@/store";
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, ClipboardList,
  DollarSign, Bus, FlaskConical, Library, Home, Calendar,
  Bell, Settings, ChevronDown, School, UserCheck, Award,
  FileText, BarChart3, MessageSquare, ShieldCheck, Cpu, Globe,
  Smartphone, Package, Utensils, HeartPulse, Trophy, Workflow,
  PanelLeftClose, PanelLeftOpen,
} from "lucide-react";

const navGroups = [
  {
    label: "Main",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "Analytics", href: "/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Academic",
    items: [
      { title: "Students", href: "/students", icon: GraduationCap, badge: 1240 },
      { title: "Teachers", href: "/teachers", icon: Users },
      { title: "Classes & Sections", href: "/classes", icon: School },
      { title: "Timetable", href: "/timetable", icon: Calendar },
      { title: "Attendance", href: "/attendance", icon: UserCheck },
      {
        title: "Examinations", href: "/exams", icon: ClipboardList,
        children: [
          { title: "Exam Schedule", href: "/exams/schedule" },
          { title: "Mark Entry", href: "/exams/marks" },
          { title: "Report Cards", href: "/exams/report-cards" },
          { title: "Merit List", href: "/exams/merit-list" },
        ],
      },
      { title: "Assignments", href: "/assignments", icon: BookOpen },
      { title: "Syllabus", href: "/syllabus", icon: FileText },
    ],
  },
  {
    label: "Finance",
    items: [
      {
        title: "Fee Management", href: "/fees", icon: DollarSign,
        children: [
          { title: "Fee Structure", href: "/fees/structure" },
          { title: "Collect Fee", href: "/fees/collect" },
          { title: "Receipts", href: "/fees/receipts" },
          { title: "Defaulters", href: "/fees/defaulters" },
          { title: "Scholarships", href: "/fees/scholarships" },
        ],
      },
      { title: "Expenses", href: "/expenses", icon: Package },
      { title: "Payroll", href: "/payroll", icon: Award },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Transport", href: "/transport", icon: Bus },
      { title: "Hostel", href: "/hostel", icon: Home },
      { title: "Library", href: "/library", icon: Library },
      { title: "Inventory", href: "/inventory", icon: Package },
      { title: "Canteen", href: "/canteen", icon: Utensils },
      { title: "Health", href: "/health", icon: HeartPulse },
    ],
  },
  {
    label: "HR & Staff",
    items: [
      { title: "Staff Management", href: "/staff", icon: Users },
      { title: "Recruitment", href: "/recruitment", icon: UserCheck },
      { title: "Leave Management", href: "/leave", icon: Calendar },
      { title: "Performance", href: "/performance", icon: Trophy },
    ],
  },
  {
    label: "Communication",
    items: [
      { title: "Announcements", href: "/announcements", icon: Bell },
      { title: "Messages", href: "/messages", icon: MessageSquare, badge: 5 },
      { title: "Notice Board", href: "/notices", icon: FileText },
    ],
  },
  {
    label: "Platform",
    items: [
      { title: "LMS", href: "/lms", icon: Globe, soon: true },
      { title: "AI Suite", href: "/ai", icon: Cpu, soon: true },
      { title: "Workflow Builder", href: "/workflows", icon: Workflow, soon: true },
      { title: "Events", href: "/events", icon: Trophy, soon: true },
      { title: "Visitor Management", href: "/visitors", icon: ShieldCheck, soon: true },
      { title: "Mobile Apps", href: "/mobile", icon: Smartphone, soon: true },
      { title: "Labs", href: "/labs", icon: FlaskConical, soon: true },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Settings", href: "/settings", icon: Settings, soon: true },
      { title: "Security", href: "/security", icon: ShieldCheck, soon: true },
    ],
  },
];

type NavItem = {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  /** Roadmap item with no page yet — rendered inert so it can't 404. */
  soon?: boolean;
  children?: { title: string; href: string }[];
};

function NavItemComponent({ item, isCollapsed }: { item: NavItem; isCollapsed: boolean }) {
  const pathname = usePathname();
  const hasChildren = !!item.children?.length;
  const isActive = pathname === item.href || item.children?.some((c) => pathname === c.href);
  const [open, setOpen] = useState(() => !!item.children?.some(c => pathname === c.href));
  const Icon = item.icon;

  if (item.soon) {
    return (
      <div
        title={isCollapsed ? `${item.title} — coming soon` : undefined}
        style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: isCollapsed ? "10px 0" : "9px 12px", borderRadius: "10px",
          fontSize: "13px", fontWeight: 500, cursor: "not-allowed",
          color: "rgba(255,255,255,0.3)",
          justifyContent: isCollapsed ? "center" : "flex-start",
        }}
      >
        <Icon size={16} style={{ flexShrink: 0, opacity: 0.5 }} />
        {!isCollapsed && (
          <>
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {item.title}
            </span>
            <span style={{
              background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)",
              fontSize: "9px", fontWeight: 700, padding: "2px 6px", borderRadius: "20px",
              lineHeight: 1, flexShrink: 0, textTransform: "uppercase", letterSpacing: "0.05em",
            }}>
              Soon
            </span>
          </>
        )}
      </div>
    );
  }

  if (hasChildren && !isCollapsed) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: "10px",
            padding: "9px 12px", borderRadius: "10px", fontSize: "13px", fontWeight: 500,
            border: "none", cursor: "pointer", transition: "all 0.15s ease",
            background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
            color: isActive ? "#fff" : "rgba(255,255,255,0.6)",
          }}
          onMouseEnter={e => {
            if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)";
            (e.currentTarget as HTMLButtonElement).style.color = "#fff";
          }}
          onMouseLeave={e => {
            if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = isActive ? "#fff" : "rgba(255,255,255,0.6)";
          }}
        >
          <Icon size={16} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.75 }} />
          <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {item.title}
          </span>
          <ChevronDown size={13} style={{ opacity: 0.5, transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease", flexShrink: 0 }} />
        </button>

        {open && (
          <div style={{ marginLeft: "16px", marginTop: "2px", marginBottom: "4px", paddingLeft: "12px", borderLeft: "1px solid rgba(255,255,255,0.1)" }}>
            {item.children!.map((child) => (
              <Link key={child.href} href={child.href} style={{
                display: "block", padding: "7px 10px", borderRadius: "8px", fontSize: "12px",
                fontWeight: 500, textDecoration: "none", marginBottom: "1px", transition: "all 0.15s ease",
                background: pathname === child.href ? "rgba(255,255,255,0.12)" : "transparent",
                color: pathname === child.href ? "#fff" : "rgba(255,255,255,0.5)",
              }}>
                {child.title}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ position: "relative" }}>
      {isActive && (
        <span style={{
          position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)",
          width: "3px", height: "20px", background: "linear-gradient(180deg, #818cf8, #6366f1)",
          borderRadius: "0 4px 4px 0",
        }} />
      )}
      <Link href={item.href} title={isCollapsed ? item.title : undefined}
        className="sidebar-nav-link"
        style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: isCollapsed ? "10px 0" : "9px 12px", borderRadius: "10px",
          fontSize: "13px", fontWeight: isActive ? 600 : 500, textDecoration: "none",
          transition: "all 0.15s ease",
          background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
          color: isActive ? "#fff" : "rgba(255,255,255,0.6)",
          justifyContent: isCollapsed ? "center" : "flex-start",
          position: "relative",
        }}
      >
        <Icon size={16} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.75 }} />

        {!isCollapsed && (
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {item.title}
          </span>
        )}

        {!isCollapsed && item.badge && (
          <span style={{
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff",
            fontSize: "10px", fontWeight: 700, padding: "2px 6px", borderRadius: "20px",
            lineHeight: 1, flexShrink: 0,
          }}>
            {item.badge > 999 ? "999+" : item.badge}
          </span>
        )}

        {isCollapsed && (
          <span className="sidebar-tooltip" style={{
            position: "absolute", left: "calc(100% + 12px)", top: "50%", transform: "translateY(-50%)",
            background: "#1e293b", color: "#f1f5f9", fontSize: "12px", fontWeight: 500,
            padding: "6px 10px", borderRadius: "8px", whiteSpace: "nowrap",
            pointerEvents: "none", opacity: 0, transition: "opacity 0.15s ease",
            zIndex: 100, boxShadow: "0 4px 12px rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)",
          }}>
            {item.title}
          </span>
        )}
      </Link>
    </div>
  );
}

export function Sidebar() {
  const { isCollapsed, toggle } = useSidebarStore();
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);
  const savedScroll = useRef<number>(0);

  // Save scroll on every scroll event
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const onScroll = () => { savedScroll.current = el.scrollTop; };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Restore scroll after route change
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    // Small timeout to let DOM settle after navigation
    const t = setTimeout(() => { el.scrollTop = savedScroll.current; }, 10);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <>
      <style>{`
        .sidebar-nav-link:hover .sidebar-tooltip { opacity: 1 !important; }
        .sidebar-nav-link:hover { background: rgba(255,255,255,0.08) !important; color: #fff !important; }
        .sidebar-nav::-webkit-scrollbar { display: none; }
      `}</style>

      <aside style={{
        width: isCollapsed ? "64px" : "260px",
        position: "fixed", left: 0, top: 0, height: "100vh",
        display: "flex", flexDirection: "column", zIndex: 40,
        transition: "width 0.3s cubic-bezier(0.4,0,0.2,1)",
        background: "linear-gradient(180deg, #1e1b4b 0%, #1a1a2e 55%, #0f172a 100%)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "4px 0 24px rgba(0,0,0,0.25)",
      }}>

        {/* Logo */}
        <div style={{
          height: "64px", display: "flex", alignItems: "center",
          justifyContent: isCollapsed ? "center" : "flex-start",
          padding: isCollapsed ? "0" : "0 16px", gap: isCollapsed ? 0 : "12px",
          borderBottom: "1px solid rgba(255,255,255,0.07)", flexShrink: 0,
        }}>
          <div style={{
            width: "36px", height: "36px", borderRadius: "10px",
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, boxShadow: "0 4px 12px rgba(99,102,241,0.4)",
          }}>
            <School size={18} color="#fff" />
          </div>
          {!isCollapsed && (
            <div style={{ overflow: "hidden" }}>
              <p style={{ fontSize: "14px", fontWeight: 700, color: "#fff", lineHeight: 1.2, letterSpacing: "0.01em" }}>EduManage</p>
              <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Springdale School</p>
            </div>
          )}
        </div>

        {/* Nav — div instead of nav so ref works cleanly */}
        <div
          ref={navRef}
          className="sidebar-nav"
          style={{
            flex: 1, overflowY: "auto", overflowX: "hidden",
            padding: isCollapsed ? "12px 6px" : "12px 10px",
            scrollbarWidth: "none", msOverflowStyle: "none",
          }}
        >
          {navGroups.map((group, gi) => (
            <div key={group.label} style={{ marginBottom: "20px" }}>
              {!isCollapsed ? (
                <p style={{
                  fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.25)",
                  textTransform: "uppercase", letterSpacing: "0.1em",
                  padding: "0 12px", marginBottom: "6px",
                }}>
                  {group.label}
                </p>
              ) : gi > 0 ? (
                <div style={{ height: "1px", background: "rgba(255,255,255,0.06)", margin: "8px 4px" }} />
              ) : null}

              <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                {group.items.map((item) => (
                  <NavItemComponent key={item.href} item={item as NavItem} isCollapsed={isCollapsed} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Collapse Button */}
        <div style={{ padding: "10px", borderTop: "1px solid rgba(255,255,255,0.07)", flexShrink: 0 }}>
          <button onClick={toggle} style={{
            width: "100%", display: "flex", alignItems: "center",
            justifyContent: isCollapsed ? "center" : "flex-start",
            gap: "8px", padding: "9px 12px", borderRadius: "10px", border: "none",
            cursor: "pointer", background: "transparent", color: "rgba(255,255,255,0.4)",
            fontSize: "13px", fontWeight: 500, transition: "all 0.15s ease",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.4)"; }}
          >
            {isCollapsed ? <PanelLeftOpen size={17} /> : <><PanelLeftClose size={17} /><span>Collapse</span></>}
          </button>
        </div>
      </aside>
    </>
  );
}

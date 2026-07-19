"use client";
import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import * as LucideIcons from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change: number;
  iconName: string;
  color: "indigo" | "emerald" | "amber" | "rose" | "violet" | "cyan";
  suffix?: string;
}

const gradients: Record<string, string> = {
  indigo:  "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
  emerald: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
  amber:   "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
  rose:    "linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)",
  violet:  "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
  cyan:    "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
};

const shadowColors: Record<string, string> = {
  indigo:  "rgba(99,102,241,0.3)",
  emerald: "rgba(16,185,129,0.3)",
  amber:   "rgba(245,158,11,0.3)",
  rose:    "rgba(244,63,94,0.3)",
  violet:  "rgba(139,92,246,0.3)",
  cyan:    "rgba(6,182,212,0.3)",
};

export function StatsCard({ title, value, change, iconName, color, suffix }: StatsCardProps) {
  const isPositive = change >= 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Icon = (LucideIcons as any)[iconName] ?? LucideIcons.BarChart3;

  return (
    <div style={{
      background: "#fff",
      borderRadius: "16px",
      border: "1px solid #f1f5f9",
      padding: "20px",
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      transition: "transform 0.2s ease, box-shadow 0.2s ease",
      cursor: "default",
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
      }}
    >
      {/* Top row: icon + badge */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
        <div style={{
          width: "44px", height: "44px", borderRadius: "12px",
          background: gradients[color],
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 4px 12px ${shadowColors[color]}`,
          flexShrink: 0,
        }}>
          <Icon size={20} color="#fff" />
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: "3px",
          fontSize: "11px", fontWeight: 600,
          padding: "3px 8px", borderRadius: "20px",
          background: isPositive ? "#f0fdf4" : "#fff1f2",
          color: isPositive ? "#16a34a" : "#e11d48",
        }}>
          {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {Math.abs(change)}%
        </div>
      </div>

      {/* Value */}
      <p style={{ fontSize: "24px", fontWeight: 800, color: "#0f172a", lineHeight: 1, letterSpacing: "-0.5px" }}>
        {value}
        {suffix && <span style={{ fontSize: "14px", fontWeight: 500, color: "#94a3b8", marginLeft: "2px" }}>{suffix}</span>}
      </p>

      {/* Title */}
      <p style={{ fontSize: "12px", color: "#64748b", marginTop: "6px", fontWeight: 500 }}>{title}</p>
    </div>
  );
}

"use client";

import { useTheme } from "next-themes";

/**
 * Recharts needs concrete colour strings — it can't consume CSS variables —
 * so chart chrome is resolved here from the active theme instead of the
 * token stylesheet. Keep these values in sync with globals.css.
 */
export function useChartTheme() {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  return {
    dark,
    grid: dark ? "#1e293b" : "#f1f5f9",
    axis: dark ? "#64748b" : "#94a3b8",
    cursor: dark ? "#1e293b" : "#f8fafc",
    tooltip: {
      borderRadius: "10px",
      border: `1px solid ${dark ? "#1e293b" : "#e2e8f0"}`,
      boxShadow: dark ? "0 8px 24px rgb(0 0 0 / 0.5)" : "0 8px 24px rgb(15 23 42 / 0.08)",
      fontSize: "12px",
      background: dark ? "#172033" : "#ffffff",
      color: dark ? "#f1f5f9" : "#0f172a",
    } satisfies React.CSSProperties,
    /** Categorical series colours — readable on both surfaces. */
    series: {
      primary: dark ? "#818cf8" : "#6366f1",
      success: dark ? "#34d399" : "#10b981",
      warning: dark ? "#fbbf24" : "#f59e0b",
      danger: dark ? "#fb7185" : "#f43f5e",
      info: dark ? "#38bdf8" : "#0ea5e9",
      violet: dark ? "#a78bfa" : "#8b5cf6",
    },
  };
}

/**
 * SINGLE source of truth for colours. Never hardcode a hex anywhere else —
 * import from here so the whole app re-themes from one file.
 */
export const colors = {
  primary: "#4f46e5",
  primaryDark: "#4338ca",
  primarySoft: "#eef2ff",
  primaryText: "#4338ca",

  // Surfaces
  bg: "#f8fafc",
  surface: "#ffffff",
  surfaceAlt: "#f1f5f9",
  surfaceHover: "#f1f5f9",

  // Text
  text: "#0f172a",
  muted: "#64748b",
  subtle: "#94a3b8",
  onPrimary: "#ffffff",
  onPrimaryGlass: "rgba(15,23,42,0.22)",
  scrim: "rgba(15,23,42,0.5)",

  border: "#e2e8f0",
  borderStrong: "#cbd5e1",

  // Status
  success: "#16a34a",
  successSoft: "#dcfce7",
  successText: "#15803d",
  warning: "#d97706",
  warningSoft: "#fef3c7",
  warningText: "#b45309",
  danger: "#dc2626",
  dangerSoft: "#fee2e2",
  dangerText: "#b91c1c",
  info: "#2563eb",
  infoSoft: "#dbeafe",
  infoText: "#1d4ed8",

  white: "#ffffff",
  black: "#000000",
} as const;

export type ColorKey = keyof typeof colors;

"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Theme is unknown during SSR — render a placeholder of the same size
  // until mount so the markup can't mismatch and the layout can't shift.
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="size-[34px]" />;

  const isDark = resolvedTheme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Light mode" : "Dark mode"}
      className="focus-ring rounded-md p-2 text-muted transition-colors hover:bg-surface-hover hover:text-text"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}

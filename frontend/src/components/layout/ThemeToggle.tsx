"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <button
      // The resolved theme is unknown during SSR, so instead of gating on a
      // mounted flag we render both icons and let CSS pick — no hydration
      // mismatch, no layout shift, no effect.
      onClick={() =>
        setTheme(document.documentElement.classList.contains("dark") ? "light" : "dark")
      }
      aria-label="Toggle colour theme"
      title="Toggle theme"
      className="focus-ring rounded-md p-2 text-muted transition-colors hover:bg-surface-hover hover:text-text"
    >
      <Moon size={18} className="dark:hidden" />
      <Sun size={18} className="hidden dark:block" />
    </button>
  );
}

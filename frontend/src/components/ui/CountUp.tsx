"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  value: number;
  durationMs?: number;
  /** Wraps the animated number, e.g. (n) => `₹${n.toLocaleString("en-IN")}`. */
  format?: (n: number) => string;
}

/**
 * Animates a number from 0 to `value` on mount. Respects reduced-motion by
 * snapping straight to the final value.
 */
const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function CountUp({ value, durationMs = 900, format }: CountUpProps) {
  // Reduced-motion users start (and stay) at the final value — no animation,
  // and crucially no synchronous setState inside the effect.
  const [display, setDisplay] = useState(() => (prefersReducedMotion() ? value : 0));
  const frame = useRef<number>(0);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    let startTime: number | null = null;

    // rAF timestamps come from the callback, so this doesn't rely on the
    // Date.now/performance.now that are unavailable at module scope.
    const step = (now: number) => {
      if (startTime === null) startTime = now;
      const progress = Math.min(1, (now - startTime) / durationMs);
      // easeOutCubic for a natural settle.
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));
      if (progress < 1) frame.current = requestAnimationFrame(step);
    };

    frame.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame.current);
  }, [value, durationMs]);

  return <>{format ? format(display) : display.toLocaleString("en-IN")}</>;
}

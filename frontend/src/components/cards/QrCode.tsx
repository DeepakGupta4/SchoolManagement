"use client";

import { useMemo } from "react";

/**
 * Deterministic QR-style matrix rendered as SVG.
 *
 * This is a visual placeholder, NOT a scannable QR code — it encodes nothing.
 * It exists so card layouts, print sheets and spacing can be designed now;
 * swap in a real encoder (e.g. `qrcode`) before anything is actually scanned.
 */
function hash(seed: string, salt: number) {
  let h = salt;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const GRID = 21;

export function QrCode({ value, className }: { value: string; className?: string }) {
  const cells = useMemo(() => {
    const out: boolean[] = [];
    for (let i = 0; i < GRID * GRID; i++) out.push(hash(value, i * 7 + 13) % 100 < 46);
    return out;
  }, [value]);

  const isFinder = (r: number, c: number) => {
    const inBox = (r0: number, c0: number) =>
      r >= r0 && r < r0 + 7 && c >= c0 && c < c0 + 7;
    return inBox(0, 0) || inBox(0, GRID - 7) || inBox(GRID - 7, 0);
  };

  const finderOn = (r: number, c: number) => {
    const local = (r0: number, c0: number) => {
      const dr = r - r0;
      const dc = c - c0;
      const ring = Math.max(Math.abs(dr - 3), Math.abs(dc - 3));
      return ring !== 2; // solid border, gap ring, solid centre
    };
    if (r < 7 && c < 7) return local(0, 0);
    if (r < 7 && c >= GRID - 7) return local(0, GRID - 7);
    return local(GRID - 7, 0);
  };

  return (
    <svg
      viewBox={`0 0 ${GRID} ${GRID}`}
      className={className}
      role="img"
      aria-label={`QR placeholder for ${value}`}
      shapeRendering="crispEdges"
    >
      <rect width={GRID} height={GRID} fill="#fff" />
      {Array.from({ length: GRID }).map((_, r) =>
        Array.from({ length: GRID }).map((_, c) => {
          const on = isFinder(r, c) ? finderOn(r, c) : cells[r * GRID + c];
          return on ? <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="#0f172a" /> : null;
        })
      )}
    </svg>
  );
}

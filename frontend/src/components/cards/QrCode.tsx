"use client";

import { QRCodeSVG } from "qrcode.react";

/**
 * A real, scannable QR code (vector SVG). Encodes `value` — a gate-pass code,
 * verification URL, ID number, etc. Size comes from `className` (e.g. h-40 w-40);
 * the SVG scales crisply because it's vector.
 */
export function QrCode({ value, className }: { value: string; className?: string }) {
  return (
    <QRCodeSVG
      value={value || "—"}
      size={256}
      level="M"
      marginSize={2}
      bgColor="#ffffff"
      fgColor="#0f172a"
      className={className}
    />
  );
}

/**
 * CSV export helper shared by every admin table.
 *
 * Client-side only: this touches `Blob`, `URL.createObjectURL` and the DOM, so
 * it must never be called from a server component or during SSR. Import it from
 * a `"use client"` module and call it from an event handler.
 */

/** One output column: a human-readable header plus how to read it off a row. */
export interface CsvColumn<T> {
  header: string;
  value: (row: T) => string | number;
}

/** Excel only detects UTF-8 in .csv files when a BOM leads the payload. */
const BOM = "﻿";

/**
 * RFC 4180: fields containing a comma, double-quote, CR or LF are wrapped in
 * double quotes, and embedded double-quotes are escaped by doubling them.
 */
function escapeField(value: string | number): string {
  const text = value == null ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** `students` -> `students-2026-07-21.csv` */
function stampFilename(filename: string): string {
  const base = filename.replace(/\.csv$/i, "");
  const today = new Date();
  const iso = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
  return `${base}-${iso}.csv`;
}

/**
 * Serialise `rows` to CSV and hand the browser a download. No-op when there is
 * nothing to export, so callers can branch on `rows.length` for their own
 * messaging without risking an empty file.
 */
export function exportToCsv<T>(filename: string, columns: CsvColumn<T>[], rows: T[]): void {
  if (rows.length === 0) return;

  const lines = [
    columns.map((c) => escapeField(c.header)).join(","),
    ...rows.map((row) => columns.map((c) => escapeField(c.value(row))).join(",")),
  ];

  const blob = new Blob([BOM + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = stampFilename(filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

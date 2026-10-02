"use client";

/**
 * Tiny CSV / TSV helpers for bulk import & export. Handles quoted fields,
 * embedded commas/newlines, and auto-detects comma vs tab (so pasting straight
 * from Excel/Sheets works too). No external dependency.
 */

/** Comma vs tab, decided by whichever the first non-empty line has more of. */
function detectDelimiter(text: string): "," | "\t" {
  const firstLine = text.split(/\r?\n/).find((l) => l.trim() !== "") ?? "";
  const tabs = (firstLine.match(/\t/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  return tabs > commas ? "\t" : ",";
}

/** Parses delimited text into a grid of trimmed cells; blank rows dropped. */
export function parseTable(text: string): string[][] {
  const delim = detectDelimiter(text);
  const s = text.replace(/\r\n?/g, "\n");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQ = false;

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQ) {
      if (c === '"') {
        if (s[i + 1] === '"') { field += '"'; i++; }
        else inQ = false;
      } else field += c;
    } else if (c === '"') {
      inQ = true;
    } else if (c === delim) {
      row.push(field); field = "";
    } else if (c === "\n") {
      row.push(field); rows.push(row); row = []; field = "";
    } else field += c;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }

  return rows
    .map((r) => r.map((c) => c.trim()))
    .filter((r) => r.some((c) => c !== ""));
}

/** Serialises a grid to a CSV string, quoting cells that need it. */
export function toCsv(rows: (string | number)[][]): string {
  const cell = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return rows.map((r) => r.map(cell).join(",")).join("\r\n");
}

/** Triggers a browser download of text as a file. */
export function downloadTextFile(filename: string, content: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob(["﻿" + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Normalises a date cell to yyyy-mm-dd. Accepts yyyy-mm-dd, dd/mm/yyyy,
 * dd-mm-yyyy and dd.mm.yyyy (Indian day-first). Returns "" when unparseable.
 */
export function normalizeDate(input: string): string {
  const s = input.trim();
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/.exec(s);
  if (m) {
    const d = m[1].padStart(2, "0");
    const mo = m[2].padStart(2, "0");
    return `${m[3]}-${mo}-${d}`;
  }
  return "";
}

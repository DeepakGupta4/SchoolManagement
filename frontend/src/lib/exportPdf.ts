"use client";

/**
 * Reusable "Export to PDF" helper shared by the People list pages.
 *
 * Opens a clean, print-ready window (A4 landscape) that renders the given
 * columns and rows as a simple table with a header (title + subtitle + date),
 * then triggers the browser's print dialog so the user can "Save as PDF". The
 * approach mirrors `printPaper.ts`.
 *
 * Client-side only: it touches `window`, so import it from a `"use client"`
 * module and call it from an event handler. Returns false when the popup was
 * blocked, so the caller can surface a toast.
 */

export interface ExportTablePdfOptions {
  /** Bold heading at the top of the sheet, e.g. "Students". */
  title: string;
  /** Optional line under the title — a count, the active filters, etc. */
  subtitle?: string;
  /** Column headers, in order. */
  columns: string[];
  /** Row cells, each aligned to `columns`. Missing cells render blank. */
  rows: (string | number)[][];
}

/** Escapes the characters that are unsafe in HTML text and attributes. */
const esc = (value: string | number): string =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c
  );

/** Today, formatted for the sheet header (e.g. "28 September 2026"). */
function stampDate(): string {
  return new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function exportTablePdf({ title, subtitle, columns, rows }: ExportTablePdfOptions): boolean {
  const w = window.open("", "_blank", "width=1120,height=800");
  if (!w) return false;

  const head = `<tr>${columns.map((c) => `<th>${esc(c)}</th>`).join("")}</tr>`;
  const body =
    rows.length > 0
      ? rows
          .map(
            (row) =>
              `<tr>${columns.map((_, i) => `<td>${esc(row[i] ?? "")}</td>`).join("")}</tr>`
          )
          .join("")
      : `<tr><td class="empty" colspan="${columns.length}">No records to display.</td></tr>`;

  const count = `<strong>${rows.length}</strong> record${rows.length === 1 ? "" : "s"}`;

  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  @page { size: A4 landscape; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #111827; margin: 0; padding: 28px; }
  .head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; border-bottom: 2px solid #111827; padding-bottom: 10px; margin-bottom: 16px; }
  .title { font-size: 22px; font-weight: 700; letter-spacing: -0.01em; }
  .subtitle { margin-top: 3px; font-size: 12px; color: #6b7280; }
  .meta { text-align: right; font-size: 12px; color: #6b7280; white-space: nowrap; }
  .meta strong { color: #111827; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  thead th { background: #f3f4f6; text-align: left; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; font-size: 10px; color: #374151; padding: 7px 9px; border: 1px solid #d1d5db; }
  tbody td { padding: 6px 9px; border: 1px solid #e5e7eb; vertical-align: top; color: #1f2937; }
  tbody tr:nth-child(even) td { background: #fafafa; }
  td.empty { text-align: center; color: #9ca3af; padding: 24px; }
  .noprint { text-align: center; margin: 24px 0 8px; }
  button { padding: 9px 18px; font-size: 13px; font-weight: 600; border: 1px solid #111827; border-radius: 6px; background: #111827; color: #fff; cursor: pointer; }
  @media print {
    .noprint { display: none; }
    body { padding: 0; }
    thead { display: table-header-group; }
    tbody tr { break-inside: avoid; }
  }
</style></head><body>
  <div class="head">
    <div>
      <div class="title">${esc(title)}</div>
      ${subtitle ? `<div class="subtitle">${esc(subtitle)}</div>` : ""}
    </div>
    <div class="meta"><div>${esc(stampDate())}</div><div>${count}</div></div>
  </div>
  <table><thead>${head}</thead><tbody>${body}</tbody></table>
  <div class="noprint"><button onclick="window.print()">Print / Save as PDF</button></div>
</body></html>`);
  w.document.close();
  w.focus();
  // Let the new document render before invoking the print dialog.
  setTimeout(() => {
    try {
      w.print();
    } catch {
      /* user can still click the button */
    }
  }, 400);
  return true;
}

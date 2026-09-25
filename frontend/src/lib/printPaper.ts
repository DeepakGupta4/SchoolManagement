"use client";

export interface PaperMeta {
  schoolName?: string;
  className?: string;
  subject?: string;
  totalMarks?: number | string;
}

const esc = (s: string) =>
  s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] ?? c));

/**
 * Opens a clean, print-ready window with the question paper laid out like a real
 * school exam sheet (A4, serif, school header, name/roll/date line). The teacher
 * uses the browser's "Save as PDF" to download it. Returns false if the popup
 * was blocked.
 */
export function printQuestionPaper(paper: string, meta: PaperMeta): boolean {
  const w = window.open("", "_blank", "width=820,height=1000");
  if (!w) return false;

  const header = meta.schoolName ? `<div class="school">${esc(meta.schoolName)}</div>` : "";
  const metaLine = [
    meta.className ? `Class: ${meta.className}` : "",
    meta.subject ? `Subject: ${meta.subject}` : "",
    meta.totalMarks ? `Max Marks: ${meta.totalMarks}` : "",
  ]
    .filter(Boolean)
    .map(esc)
    .join(" &nbsp;•&nbsp; ");

  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Question Paper</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Times New Roman', Georgia, serif; color: #000; margin: 0; padding: 24px; }
  .school { text-align: center; font-size: 22px; font-weight: 700; letter-spacing: .5px; }
  .meta { text-align: center; margin: 4px 0 8px; font-size: 13px; }
  .rule { border-top: 2px solid #000; margin: 8px 0; }
  .fields { display: flex; justify-content: space-between; gap: 12px; font-size: 13px; margin: 10px 0 16px; }
  .paper { white-space: pre-wrap; font-size: 14px; line-height: 1.55; }
  .noprint { text-align: center; margin: 20px 0; }
  button { padding: 9px 18px; font-size: 14px; border: 1px solid #333; border-radius: 6px; background: #f3f3f3; cursor: pointer; }
  @media print { .noprint { display: none; } body { padding: 0; } }
</style></head><body>
  ${header}
  ${metaLine ? `<div class="meta">${metaLine}</div>` : ""}
  <div class="rule"></div>
  <div class="fields"><span>Name: ____________________</span><span>Roll No: __________</span><span>Date: __________</span></div>
  <div class="paper">${esc(paper)}</div>
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

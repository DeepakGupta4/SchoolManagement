"use client";

export interface PdfExtract {
  text: string;
  pages: number;
  /** True when the book was longer than maxChars and got cut off. */
  truncated: boolean;
}

/**
 * Extracts plain text from a PDF in the browser using pdf.js. The worker is
 * loaded from a CDN pinned to the installed version, so it always matches.
 * Capped at `maxChars` to keep the AI prompt within token/cost limits.
 */
export async function extractPdfText(file: File, maxChars = 30000): Promise<PdfExtract> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const buffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buffer }).promise;

  let text = "";
  let truncated = false;
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const pageText = content.items.map((it) => ("str" in it ? it.str : "")).join(" ");
    text += pageText + "\n";
    if (text.length >= maxChars) {
      truncated = true;
      text = text.slice(0, maxChars);
      break;
    }
  }

  return { text: text.trim(), pages: doc.numPages, truncated };
}

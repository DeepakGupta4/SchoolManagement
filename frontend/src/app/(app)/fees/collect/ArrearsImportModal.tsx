"use client";

import { useMemo, useRef, useState } from "react";
import { Upload, CheckCircle2, AlertTriangle } from "lucide-react";
import { Modal, Button, Textarea, useToast } from "@/components/ui";
import { importArrears, type ArrearsImportRow, type ArrearsImportResult } from "@/lib/api/feeLedger";

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

/** Server accepts at most this many rows per import. */
const MAX_ROWS = 5000;

/**
 * Parses pasted / uploaded CSV text into arrears rows. Each line is
 * "admission-no, amount". The amount is read STRICTLY so junk can never be
 * mistaken for a number: a cell that doesn't parse (header "Amount", "N/A", a
 * blank, a negative, letters) is SKIPPED, never silently read as 0 (which would
 * wrongly clear a student's existing dues). Thousands separators are supported —
 * both inside one cell ("₹12,000") and when a comma delimiter splits a grouped
 * number apart ("12,000" → "12","000") — while a genuine extra column
 * ("12000, 3") is ignored rather than concatenated into the amount.
 */
function parseArrears(text: string): { rows: ArrearsImportRow[]; skipped: number } {
  const rows: ArrearsImportRow[] = [];
  let skipped = 0;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;

    // Delimiter precedence: tab / semicolon are unambiguous with thousands commas;
    // fall back to comma, then whitespace.
    const parts = (
      line.includes("\t")
        ? line.split("\t")
        : line.includes(";")
          ? line.split(";")
          : line.includes(",")
            ? line.split(",")
            : line.split(/\s+/)
    ).map((p) => p.trim());

    const admissionNo = parts[0];
    // Strip currency symbols / spaces per field up front, so "₹" on a leading
    // thousands group doesn't defeat the grouping test below.
    const amtParts = parts
      .slice(1)
      .map((p) => p.replace(/[₹$\s]/g, ""))
      .filter((p) => p !== "");
    if (!admissionNo || amtParts.length === 0) {
      skipped++;
      continue;
    }

    // Rejoin a thousands-grouped number the comma delimiter split apart (first
    // group 1–3 digits, the rest exactly 2–3); otherwise the amount is just the
    // SECOND field, so a trailing name/phone/year column can't inflate it.
    const looksGrouped =
      amtParts.length > 1 &&
      /^\d{1,3}$/.test(amtParts[0]) &&
      amtParts.every((p, i) => i === 0 || /^\d{2,3}$/.test(p));
    const amountStr = (looksGrouped ? amtParts.join("") : amtParts[0]).replace(/,/g, "");

    // Digits (optional decimals) only — no sign, no letters. Rejects "-5000",
    // "N/A", "Amount", "" — all counted as skipped.
    if (!/^\d+(\.\d+)?$/.test(amountStr)) {
      skipped++;
      continue;
    }
    rows.push({ admissionNo, amount: Math.round(Number(amountStr)) });
  }
  return { rows, skipped };
}

interface ArrearsImportModalProps {
  open: boolean;
  onClose: () => void;
  /** Called after a successful import, so the caller can refetch the list. */
  onImported: () => void;
}

/**
 * Bulk-imports carried-forward arrears when onboarding an existing school: paste
 * or upload a CSV of admission numbers and amounts, and each student's one-time
 * "Previous Dues" head is set in one shot. Surgical on the server — nothing else
 * on an account (current fees, collection history) is touched.
 */
export function ArrearsImportModal({ open, onClose, onImported }: ArrearsImportModalProps) {
  const { toast } = useToast();
  const [text, setText] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ArrearsImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { rows, skipped } = useMemo(() => parseArrears(text), [text]);
  const total = useMemo(() => rows.reduce((s, r) => s + r.amount, 0), [rows]);
  const tooMany = rows.length > MAX_ROWS;

  const readFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const content = await file.text();
      setText(content);
      setResult(null);
    } catch {
      toast({ title: "Couldn't read that file", variant: "error" });
    }
  };

  const runImport = async () => {
    if (rows.length === 0 || tooMany) return;
    setImporting(true);
    try {
      const res = await importArrears(rows);
      setResult(res);
      onImported();
      toast({
        title: "Arrears imported",
        description: `${res.updated} student${res.updated === 1 ? "" : "s"} updated.`,
      });
    } catch (e) {
      toast({
        title: "Import failed",
        description: e instanceof Error ? e.message : "Something went wrong.",
        variant: "error",
      });
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setText("");
    setResult(null);
  };

  return (
    <Modal
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title="Import previous dues"
      description="Set carried-forward arrears for many students at once — for onboarding an existing school."
      size="lg"
      footer={
        result ? (
          <>
            <Button variant="outline" onClick={reset}>
              Import more
            </Button>
            <Button onClick={onClose}>Done</Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={onClose} disabled={importing}>
              Cancel
            </Button>
            <Button onClick={runImport} disabled={importing || rows.length === 0 || tooMany}>
              {importing ? "Importing…" : rows.length ? `Import ${rows.length}` : "Import"}
            </Button>
          </>
        )
      }
    >
      {result ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-md bg-success-soft px-4 py-3">
            <CheckCircle2 className="size-5 shrink-0 text-success" />
            <div className="text-sm">
              <p className="font-semibold text-success-text">Import complete</p>
              <p className="mt-0.5 text-success-text/80">
                {result.updated} updated · {result.cleared} cleared · {result.skipped} skipped
              </p>
            </div>
          </div>
          {result.notFound.length > 0 && (
            <div className="rounded-md border border-warning/40 bg-warning-soft/50 px-4 py-3">
              <p className="inline-flex items-center gap-1.5 text-sm font-medium text-warning-text">
                <AlertTriangle className="size-4" />
                {result.notFound.length} admission number
                {result.notFound.length === 1 ? "" : "s"} matched no student
              </p>
              <p className="mt-1.5 max-h-28 overflow-y-auto break-words font-mono text-xs text-warning-text/80">
                {result.notFound.join(", ")}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="rounded-md bg-surface-sunken px-4 py-3 text-xs text-muted">
            <p className="font-medium text-text">One student per line: admission number, amount.</p>
            <p className="mt-1 font-mono text-subtle">
              ADM-2026-0007, 12000
              <br />
              ADM-2026-0012, 7500
            </p>
            <p className="mt-2">
              A header row and blank lines are ignored. An amount of <span className="font-medium">0</span>{" "}
              clears a student&apos;s existing arrears. Current fees are never changed.
            </p>
          </div>

          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={(e) => {
                void readFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload className="size-4" />
              Upload a CSV file
            </Button>
          </div>

          <Textarea
            label="Rows"
            placeholder="ADM-2026-0007, 12000"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            className="font-mono text-sm"
          />

          {text.trim() && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-4 py-2.5 text-sm">
              <span className="text-muted">
                <span className="font-semibold text-text">{rows.length}</span> student
                {rows.length === 1 ? "" : "s"}
                {rows.length > 0 && (
                  <>
                    {" · total "}
                    <span className="font-semibold text-text">{inr(total)}</span>
                  </>
                )}
                {skipped > 0 && <span className="text-subtle"> · {skipped} line(s) skipped</span>}
              </span>
              {tooMany && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-danger">
                  <AlertTriangle className="size-3.5" />
                  Too many — import at most {MAX_ROWS.toLocaleString("en-IN")} at a time
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

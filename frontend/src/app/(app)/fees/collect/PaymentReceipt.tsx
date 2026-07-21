"use client";

import { School } from "lucide-react";
import type { Payment } from "@/lib/api/feeLedger";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

/** 12345 -> "Twelve Thousand Three Hundred Forty Five" — receipts print words. */
function amountInWords(value: number): string {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const under100 = (n: number): string =>
    n < 20 ? ones[n] : `${tens[Math.floor(n / 10)]}${n % 10 ? ` ${ones[n % 10]}` : ""}`;

  const under1000 = (n: number): string =>
    n < 100
      ? under100(n)
      : `${ones[Math.floor(n / 100)]} Hundred${n % 100 ? ` ${under100(n % 100)}` : ""}`;

  if (value === 0) return "Zero";

  // Indian grouping: crore, lakh, thousand, then the last three digits.
  const parts: string[] = [];
  const units: [number, string][] = [
    [10000000, "Crore"],
    [100000, "Lakh"],
    [1000, "Thousand"],
  ];

  let rest = Math.floor(value);
  for (const [divisor, label] of units) {
    const count = Math.floor(rest / divisor);
    if (count > 0) {
      parts.push(`${under1000(count)} ${label}`);
      rest %= divisor;
    }
  }
  if (rest > 0) parts.push(under1000(rest));

  return parts.join(" ");
}

/**
 * Printable fee receipt at A5 landscape proportions.
 *
 * Colours are fixed rather than themed — the printed artefact must not change
 * with the clerk's light/dark preference. Same reasoning as the ID cards.
 */
export function PaymentReceipt({ payment }: { payment: Payment }) {
  const unconfirmed = payment.status === "pending-clearance";

  return (
    <div
      className="receipt w-full overflow-hidden rounded-lg bg-white text-slate-900 shadow-md ring-1 ring-slate-200"
      style={{ aspectRatio: "1.414 / 1" }}
    >
      <div className="flex h-full flex-col p-5">
        {/* Masthead */}
        <div className="flex items-center gap-3 border-b-2 border-indigo-600 pb-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-indigo-600 text-white">
            <School className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold uppercase tracking-wide">Springdale School</p>
            <p className="truncate text-[9px] text-slate-500">
              Mayur Vihar, New Delhi 110091 · CBSE Affiliation No. 2730123
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[9px] uppercase tracking-wide text-slate-500">Fee Receipt</p>
            <p className="font-mono text-sm font-bold text-indigo-700">{payment.receiptNo}</p>
          </div>
        </div>

        {unconfirmed && (
          <p className="mt-2 rounded bg-amber-50 px-2.5 py-1.5 text-[9px] font-semibold text-amber-800">
            Subject to realisation — this receipt is provisional until the {payment.method.toLowerCase()} clears.
          </p>
        )}

        {/* Payer */}
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-[10px]">
          {[
            ["Student", payment.studentName],
            ["Receipt date", formatDate(payment.date)],
            ["Admission no.", payment.admissionNo],
            ["Class", payment.className],
            ["Payment mode", payment.method],
            ["Reference", payment.reference || "—"],
          ].map(([label, value]) => (
            <div key={label} className="flex gap-2">
              <dt className="w-28 shrink-0 font-semibold text-slate-500">{label}</dt>
              <dd className="truncate font-medium">{value}</dd>
            </div>
          ))}
        </dl>

        {/* Allocation */}
        <div className="mt-3 min-h-0 flex-1 overflow-hidden rounded ring-1 ring-slate-200">
          <table className="w-full border-collapse text-[10px]">
            <thead>
              <tr className="bg-slate-100">
                <th className="px-3 py-1.5 text-left font-semibold">Particulars</th>
                <th className="px-3 py-1.5 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {payment.allocations.map((a, i) => (
                <tr key={a.head} className={i % 2 ? "bg-slate-50" : "bg-white"}>
                  <td className="px-3 py-1.5">{a.head}</td>
                  <td className="px-3 py-1.5 text-right font-mono">{inr(a.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-300 bg-indigo-50">
                <td className="px-3 py-2 font-bold">Total received</td>
                <td className="px-3 py-2 text-right font-mono text-sm font-bold text-indigo-700">
                  {inr(payment.amount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        <p className="mt-2 text-[9px] italic text-slate-600">
          Rupees {amountInWords(payment.amount)} only
        </p>

        {payment.remarks && (
          <p className="mt-1 text-[9px] text-slate-600">
            <span className="font-semibold">Remarks:</span> {payment.remarks}
          </p>
        )}

        {/* Footer */}
        <div className="mt-auto flex items-end justify-between gap-4 pt-4 text-[8px] text-slate-500">
          <p className="max-w-[55%] leading-snug">
            This is a computer-generated receipt. Fees once paid are non-refundable except as
            provided in the school&apos;s refund policy.
          </p>
          <div className="text-center">
            <p className="mb-0.5 font-medium text-slate-700">{payment.collectedBy}</p>
            <div className="w-32 border-t border-slate-400 pt-0.5">Authorised signatory</div>
          </div>
        </div>
      </div>
    </div>
  );
}

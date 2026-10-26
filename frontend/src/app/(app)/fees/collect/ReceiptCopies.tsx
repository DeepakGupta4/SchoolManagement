"use client";

import { Scissors } from "lucide-react";
import { PaymentReceipt } from "./PaymentReceipt";
import type { Payment } from "@/lib/api/feeLedger";
import type { SchoolIdentity } from "@/lib/schoolIdentity";

/**
 * Two copies of a receipt on one sheet — a "School Copy" to file in the office and
 * a "Guardian Copy" to hand over. They're sized (see `.receipt-copies` in
 * globals.css) so both fit a single A4 page when printed; a dashed line marks
 * where to cut them apart.
 */
export function ReceiptCopies({ payment, school }: { payment: Payment; school?: SchoolIdentity }) {
  return (
    <div className="receipt-copies mx-auto flex w-full max-w-2xl flex-col gap-5">
      <PaymentReceipt payment={payment} school={school} copyLabel="School Copy" />
      <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-slate-400">
        <span className="h-px flex-1 border-t border-dashed border-slate-300" />
        <Scissors className="size-3" />
        cut here
        <span className="h-px flex-1 border-t border-dashed border-slate-300" />
      </div>
      <PaymentReceipt payment={payment} school={school} copyLabel="Guardian Copy" />
    </div>
  );
}

"use client";

import { createPortal } from "react-dom";
import { Printer } from "lucide-react";
import { Button, Modal } from "@/components/ui";
import { ReceiptCopies } from "../collect/ReceiptCopies";
import { useSchoolIdentity } from "@/lib/schoolIdentity";
import type { Payment } from "@/lib/api/feeLedger";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/**
 * Preview any recorded receipt from the register, then print / save it as PDF.
 *
 * Printing emits TWO copies on one page — a School Copy to file and a Guardian
 * Copy to hand over. The printable sheet is mounted at the page root through a
 * portal (not inside the modal), so the global `@media print` rules place it on a
 * clean full page instead of wherever the modal happened to sit. Only that
 * `.print-sheet` reaches paper — the modal chrome and the on-screen preview don't.
 */
export function ReceiptPreviewModal({
  payment,
  onOpenChange,
}: {
  payment: Payment | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { identity } = useSchoolIdentity();
  const reversed = payment?.status === "cancelled" || payment?.status === "bounced";

  return (
    <>
      <Modal
        open={Boolean(payment)}
        onOpenChange={onOpenChange}
        title={payment ? `Receipt ${payment.receiptNo}` : "Receipt"}
        description={
          payment
            ? `${payment.studentName} · ${inr(payment.amount)} · prints 2 copies (school + guardian)`
            : ""
        }
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={() => window.print()}>
              <Printer className="size-4" />
              Print / Save PDF
            </Button>
          </>
        }
      >
        {payment && (
          <div className="flex flex-col gap-3">
            {reversed && (
              <p className="rounded-md bg-danger-soft px-3 py-2 text-xs font-medium text-danger">
                This receipt was {payment.status}
                {payment.reversalReason ? ` — ${payment.reversalReason}` : ""}. Shown for reference only.
              </p>
            )}
            {/* On-screen preview (what prints). It isn't in a `.print-sheet`, so the
                portal below is what actually reaches paper. */}
            <ReceiptCopies payment={payment} school={identity} />
          </div>
        )}
      </Modal>

      {/* The real printed page: two copies on a clean full sheet, mounted at the
          document root so the modal's positioning can't clip or offset it. Only
          rendered once a receipt is picked (a post-hydration click), so there's no
          SSR/hydration mismatch — the document guard is just defensive. */}
      {payment &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="print-only print-sheet">
            <ReceiptCopies payment={payment} school={identity} />
          </div>,
          document.body
        )}
    </>
  );
}

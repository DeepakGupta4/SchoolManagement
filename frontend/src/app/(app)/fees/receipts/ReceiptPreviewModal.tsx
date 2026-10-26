"use client";

import { Printer } from "lucide-react";
import { Button, Modal } from "@/components/ui";
import { PaymentReceipt } from "../collect/PaymentReceipt";
import { useSchoolIdentity } from "@/lib/schoolIdentity";
import type { Payment } from "@/lib/api/feeLedger";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/**
 * Preview any recorded receipt from the register, and print / save it as PDF.
 *
 * Only the `.print-sheet` (the receipt itself) reaches paper — the global
 * `@media print` rules drop the modal chrome — so Print here produces the same
 * document the clerk saw the moment the payment was collected.
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
    <Modal
      open={Boolean(payment)}
      onOpenChange={onOpenChange}
      title={payment ? `Receipt ${payment.receiptNo}` : "Receipt"}
      description={payment ? `${payment.studentName} · ${inr(payment.amount)}` : ""}
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
            <p className="print-hide rounded-md bg-danger-soft px-3 py-2 text-xs font-medium text-danger">
              This receipt was {payment.status}
              {payment.reversalReason ? ` — ${payment.reversalReason}` : ""}. Shown for reference only.
            </p>
          )}
          <div className="print-sheet mx-auto w-full max-w-2xl">
            <PaymentReceipt payment={payment} school={identity} />
          </div>
        </div>
      )}
    </Modal>
  );
}

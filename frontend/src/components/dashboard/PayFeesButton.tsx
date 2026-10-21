"use client";

import { useState } from "react";
import { Wallet, Loader2 } from "lucide-react";
import { Button, useToast } from "@/components/ui";
import { startFeeCheckout } from "@/lib/feePayment";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

interface PayFeesButtonProps {
  /** The child's id when a guardian pays; omit for a student paying their own fees. */
  studentId?: string;
  dueRupees: number;
  prefill?: { name?: string; email?: string };
  /** Called after the server records a successful payment, so the caller can refresh. */
  onPaid?: () => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * "Pay now" CTA for a student's outstanding fees. Opens Razorpay checkout and,
 * once the server verifies and posts the receipt, calls onPaid so the dashboard
 * refreshes. Degrades gracefully: if online payment isn't configured the server
 * answers 503 and we show a plain "pay at the office" message instead of failing.
 */
export function PayFeesButton({
  studentId,
  dueRupees,
  prefill,
  onPaid,
  size = "sm",
  className,
}: PayFeesButtonProps) {
  const { toast } = useToast();
  const [paying, setPaying] = useState(false);

  if (dueRupees <= 0) return null;

  const pay = async () => {
    setPaying(true);
    try {
      const receipt = await startFeeCheckout({ studentId, prefill });
      toast({
        title: "Payment successful",
        description: `${inr(receipt.amount)} paid · receipt ${receipt.receiptNo}`,
        variant: "success",
      });
      onPaid?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      // User simply closed the checkout — nothing to report.
      if (msg === "Payment cancelled.") return;
      toast({ title: "Payment not completed", description: msg, variant: "error" });
    } finally {
      setPaying(false);
    }
  };

  return (
    <Button variant="primary" size={size} onClick={pay} disabled={paying} className={className}>
      {paying ? <Loader2 className="size-3.5 animate-spin" /> : <Wallet className="size-3.5" />}
      {paying ? "Processing…" : `Pay ${inr(dueRupees)}`}
    </Button>
  );
}

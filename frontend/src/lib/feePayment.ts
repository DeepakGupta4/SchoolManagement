import { createFeeOrder, verifyFeePayment, type FeeReceipt } from "@/lib/api/feePayment";

/**
 * Fee checkout, end to end. Loads the Razorpay gateway script on demand, asks
 * the backend to open an order for the student's own dues, opens the hosted
 * checkout, and — on success — verifies the payment ON THE SERVER before
 * resolving. The browser's success callback alone never records any money.
 *
 * Kept separate from the subscription checkout (lib/payment.ts) so the two
 * self-service flows stay independent; only the tiny script loader is shared in
 * spirit (duplicated here to leave the billing path untouched).
 */

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

interface RazorpayHandlerResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, cb: (e: unknown) => void) => void;
}

type RazorpayCtor = new (options: Record<string, unknown>) => RazorpayInstance;

function loadScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if ((window as unknown as { Razorpay?: RazorpayCtor }).Razorpay) return resolve(true);

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export interface FeeCheckoutOptions {
  /** The child's id (required when a guardian pays); omit for a student paying their own fees. */
  studentId?: string;
  prefill?: { name?: string; email?: string };
}

/**
 * Runs the whole flow. Resolves with the posted receipt once the server has
 * verified and recorded the payment; rejects on failure or if the user dismisses
 * the checkout (message "Payment cancelled."). A 503 from createFeeOrder means
 * online payment isn't configured for the school — the caller surfaces that.
 */
export async function startFeeCheckout({ studentId, prefill }: FeeCheckoutOptions = {}): Promise<FeeReceipt> {
  const ready = await loadScript();
  if (!ready) throw new Error("Could not load the payment gateway. Check your connection.");

  const order = await createFeeOrder(studentId);

  const Razorpay = (window as unknown as { Razorpay?: RazorpayCtor }).Razorpay;
  if (!Razorpay) throw new Error("Payment gateway unavailable.");

  return new Promise<FeeReceipt>((resolve, reject) => {
    const rzp = new Razorpay({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amount,
      currency: order.currency,
      name: "SchoolDeck",
      description: `Fee payment · ${order.studentName}`,
      prefill,
      theme: { color: "#2563eb" },
      handler: (response: RazorpayHandlerResponse) => {
        verifyFeePayment({
          studentId: order.studentId,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        })
          .then((receipt) => resolve(receipt))
          .catch((e) => reject(e instanceof Error ? e : new Error("Payment verification failed.")));
      },
      modal: {
        ondismiss: () => reject(new Error("Payment cancelled.")),
      },
    });
    rzp.on("payment.failed", () => reject(new Error("Payment failed. Please try again.")));
    rzp.open();
  });
}

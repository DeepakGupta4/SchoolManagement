import { createOrder, verifyPayment } from "@/lib/api/payment";

/**
 * Razorpay checkout, end to end. Loads the gateway script on demand, asks the
 * backend to create an order, opens the hosted checkout, and — on success —
 * verifies the payment ON THE SERVER before resolving. The browser's success
 * callback alone is never trusted to unlock anything.
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

export interface CheckoutOptions {
  plan: "monthly" | "yearly";
  prefill?: { name?: string; email?: string };
}

/**
 * Runs the whole flow. Resolves once the server has verified and activated the
 * subscription; rejects on failure or if the user dismisses the checkout.
 */
export async function startCheckout({ plan, prefill }: CheckoutOptions): Promise<void> {
  const ready = await loadScript();
  if (!ready) throw new Error("Could not load the payment gateway. Check your connection.");

  const order = await createOrder(plan);

  const Razorpay = (window as unknown as { Razorpay?: RazorpayCtor }).Razorpay;
  if (!Razorpay) throw new Error("Payment gateway unavailable.");

  return new Promise<void>((resolve, reject) => {
    const rzp = new Razorpay({
      key: order.keyId,
      order_id: order.orderId,
      amount: order.amount,
      currency: order.currency,
      name: "SchoolDeck",
      description: `${plan === "yearly" ? "Yearly" : "Monthly"} subscription`,
      prefill,
      theme: { color: "#2563eb" },
      handler: (response: RazorpayHandlerResponse) => {
        verifyPayment({
          plan,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        })
          .then(() => resolve())
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

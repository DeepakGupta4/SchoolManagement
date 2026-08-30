"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Ban, Check, LockKeyhole, LogOut, Mail, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui";
import { useAuthStore } from "@/store";
import { logout as apiLogout } from "@/lib/api/auth";
import type { MySubscription } from "@/lib/api/subscription";
import { getPlans, type Plan } from "@/lib/api/payment";
import { startCheckout } from "@/lib/payment";

const SUPPORT_EMAIL = "schooldeck.in@gmail.com";
const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

/**
 * A full-screen, non-dismissible wall shown when the server says the school's
 * access is not allowed (trial/subscription expired, or account suspended).
 *
 * It covers the entire app — sidebar and topbar included — so it cannot be
 * clicked past, and refreshing or clearing storage does nothing because the
 * backend re-checks on every request and this re-fetches on mount.
 */
export function SubscriptionLock({ sub }: { sub: MySubscription }) {
  const router = useRouter();
  const signOut = useAuthStore((s) => s.signOut);
  const user = useAuthStore((s) => s.user);

  const suspended = sub.status === "suspended";

  const [plans, setPlans] = useState<Plan[]>([]);
  const [paymentEnabled, setPaymentEnabled] = useState(false);
  const [paying, setPaying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (suspended) return;
    let cancelled = false;
    getPlans()
      .then((res) => {
        if (!cancelled) {
          setPlans(res.plans);
          setPaymentEnabled(res.paymentEnabled);
        }
      })
      .catch(() => {
        /* fall back to contact-only */
      });
    return () => {
      cancelled = true;
    };
  }, [suspended]);

  const handleSignOut = () => {
    apiLogout();
    signOut();
    router.replace("/login");
  };

  const pay = async (plan: "monthly" | "yearly") => {
    setError(null);
    setPaying(plan);
    try {
      await startCheckout({ plan, prefill: { name: user?.name, email: user?.email } });
      // Verified and activated on the server — reload to drop the lock.
      window.location.reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment could not be completed.");
      setPaying(null);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-md">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-7 text-center shadow-2xl">
        <div
          className={`mx-auto grid size-14 place-items-center rounded-2xl ${
            suspended ? "bg-danger-soft text-danger-text" : "bg-warning-soft text-warning-text"
          }`}
        >
          {suspended ? <Ban className="size-7" /> : <LockKeyhole className="size-7" />}
        </div>

        <h1 className="mt-5 text-xl font-semibold text-text">
          {suspended ? "Account suspended" : "Your free trial has expired"}
        </h1>

        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
          {suspended ? (
            <>This account has been suspended. Please contact us to restore access.</>
          ) : (
            <>
              Your {sub.plan === "trial" ? "7-day free demo" : "subscription"} has ended. To keep
              using {sub.schoolName ?? "SchoolDeck"}, activate your subscription.
            </>
          )}
        </p>

        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-success-soft px-3 py-1 text-xs font-medium text-success-text">
          <ShieldCheck className="size-3.5" />
          Your school data is safe and has not been deleted.
        </div>

        {/* Self-service payment */}
        {!suspended && paymentEnabled && plans.length > 0 && (
          <div className="mt-6 grid gap-2.5">
            {plans.map((p) => (
              <button
                key={p.id}
                disabled={!!paying}
                onClick={() => pay(p.id)}
                className="flex items-center justify-between rounded-xl border border-border bg-surface-hover px-4 py-3 text-left transition-colors hover:border-primary disabled:opacity-60"
              >
                <span>
                  <span className="block text-sm font-semibold text-text">{p.name} plan</span>
                  <span className="block text-xs text-muted">
                    {p.id === "yearly" ? "Best value — billed yearly" : "Billed monthly"}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-base font-bold text-text">{inr.format(p.priceInr)}</span>
                  {paying === p.id ? (
                    <Loader2 className="size-4 animate-spin text-primary" />
                  ) : (
                    <Check className="size-4 text-primary" />
                  )}
                </span>
              </button>
            ))}
          </div>
        )}

        {error && <p className="mt-3 text-sm text-danger-text">{error}</p>}

        <div className="mt-6 space-y-2.5">
          {(suspended || !paymentEnabled) && (
            <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Activate ${sub.schoolName ?? "our school"}`)}`}>
              <Button className="w-full" size="lg">
                <Mail className="size-4" /> Contact us to activate
              </Button>
            </a>
          )}
          <Button variant="outline" className="w-full" onClick={handleSignOut}>
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>

        {!suspended && paymentEnabled && (
          <p className="mt-4 text-xs text-muted">
            Prefer help? Email{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">
              {SUPPORT_EMAIL}
            </a>
          </p>
        )}
      </div>
    </div>
  );
}

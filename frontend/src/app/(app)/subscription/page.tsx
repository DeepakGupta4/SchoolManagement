"use client";

import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Check, Loader2, Sparkles } from "lucide-react";
import { Button, Card, CardContent, PageHeader, useToast } from "@/components/ui";
import { useAuthStore } from "@/store";
import { getMySubscription, type MySubscription } from "@/lib/api/subscription";
import { getPlans, type Plan } from "@/lib/api/payment";
import { startCheckout } from "@/lib/payment";

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

function fmt(d: string | null): string {
  return d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—";
}

export default function SubscriptionPage() {
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);

  const [sub, setSub] = useState<MySubscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [paymentEnabled, setPaymentEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    // setTimeout(…,0) keeps setState out of the effect body (cascading-render rule).
    const t = setTimeout(() => {
      setLoading(true);
      Promise.all([getMySubscription(), getPlans()])
        .then(([s, p]) => {
          if (cancelled) return;
          setSub(s);
          setPlans(p.plans);
          setPaymentEnabled(p.paymentEnabled);
        })
        .catch(() => {})
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [reloadKey]);

  const pay = async (plan: "monthly" | "yearly") => {
    setPaying(plan);
    try {
      await startCheckout({ plan, prefill: { name: user?.name, email: user?.email } });
      toast({ title: "Subscription activated", description: "Thank you! Your plan is now active." });
      reload();
    } catch (e) {
      toast({
        title: "Payment not completed",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setPaying(null);
    }
  };

  const statusLabel = sub?.status === "trial" ? "Free trial" : sub?.status === "active" ? "Active" : sub?.status ?? "—";

  return (
    <div className="space-y-5">
      <PageHeader title="Subscription" description="Manage your SchoolDeck plan and billing." />

      {/* Current status */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-md bg-primary/10 text-primary">
              <BadgeCheck className="size-5" />
            </div>
            <div>
              <p className="text-sm text-muted">Current plan</p>
              <p className="text-lg font-semibold capitalize text-text">
                {sub?.plan ?? "—"} · {statusLabel}
              </p>
            </div>
          </div>
          <div className="text-right text-sm">
            {sub?.status === "trial" && sub.daysRemaining != null && (
              <p className="text-muted">
                <span className="font-semibold text-text">{sub.daysRemaining} days</span> left · ends {fmt(sub.trialEndDate)}
              </p>
            )}
            {sub?.status === "active" && sub.paidEndDate && (
              <p className="text-muted">Renews / ends on <span className="font-semibold text-text">{fmt(sub.paidEndDate)}</span></p>
            )}
            {sub && !sub.hasSubscription && <p className="text-muted">No billing on this account.</p>}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid place-items-center py-16 text-muted">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {plans.map((p) => {
            const yearly = p.id === "yearly";
            return (
              <Card key={p.id} className={yearly ? "border-primary" : ""}>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-text">{p.name}</h3>
                    {yearly && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                        <Sparkles className="size-3" /> Best value
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-2xl font-bold text-text">{inr.format(p.priceInr)}</span>
                    <span className="text-sm text-muted"> / {yearly ? "year" : "month"}</span>
                  </div>
                  <ul className="space-y-1.5 text-sm text-muted">
                    <li className="flex items-center gap-2"><Check className="size-4 text-primary" /> All modules included</li>
                    <li className="flex items-center gap-2"><Check className="size-4 text-primary" /> Unlimited students &amp; staff</li>
                    <li className="flex items-center gap-2"><Check className="size-4 text-primary" /> Priority support</li>
                  </ul>
                  <Button
                    className="w-full"
                    variant={yearly ? "primary" : "outline"}
                    disabled={!paymentEnabled || !!paying}
                    onClick={() => pay(p.id)}
                  >
                    {paying === p.id ? <Loader2 className="size-4 animate-spin" /> : null}
                    {paymentEnabled ? "Pay & Activate" : "Payment coming soon"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!paymentEnabled && !loading && (
        <p className="text-sm text-muted">
          Online payment isn&apos;t enabled yet. Email{" "}
          <a href="mailto:schooldeck.in@gmail.com" className="text-primary hover:underline">
            schooldeck.in@gmail.com
          </a>{" "}
          to activate your subscription.
        </p>
      )}
    </div>
  );
}

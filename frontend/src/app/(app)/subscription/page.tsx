"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Ban,
  CalendarClock,
  CalendarDays,
  Check,
  CircleDollarSign,
  Info,
  Mail,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  Loading,
  PageHeader,
  Spinner,
  useToast,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store";
import {
  getMySubscription,
  type MySubscription,
  type SubscriptionStatus,
} from "@/lib/api/subscription";
import { getPlans, type Plan } from "@/lib/api/payment";
import { startCheckout } from "@/lib/payment";

const SUPPORT_EMAIL = "schooldeck.in@gmail.com";
const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info" | "outline";

/** How each server-reported status is presented: badge, icon, and a short line. */
const STATUS_META: Record<
  SubscriptionStatus,
  { label: string; variant: BadgeVariant; Icon: LucideIcon; iconClass: string; message: string }
> = {
  trial: {
    label: "Free trial",
    variant: "info",
    Icon: Sparkles,
    iconClass: "bg-info-soft text-info-text",
    message: "You're exploring SchoolDeck on a free trial. Choose a plan below to keep your access after it ends.",
  },
  active: {
    label: "Active",
    variant: "success",
    Icon: BadgeCheck,
    iconClass: "bg-success-soft text-success-text",
    message: "Your subscription is active. Thank you for being with SchoolDeck!",
  },
  expired: {
    label: "Expired",
    variant: "danger",
    Icon: AlertTriangle,
    iconClass: "bg-danger-soft text-danger-text",
    message: "Your access has ended. Renew a plan below to continue using SchoolDeck.",
  },
  suspended: {
    label: "Suspended",
    variant: "danger",
    Icon: Ban,
    iconClass: "bg-danger-soft text-danger-text",
    message: "This account has been suspended. Please contact support to restore access.",
  },
  cancelled: {
    label: "Cancelled",
    variant: "default",
    Icon: Ban,
    iconClass: "bg-surface-hover text-muted",
    message: "Your subscription was cancelled. You can reactivate any time by choosing a plan below.",
  },
  payment_pending: {
    label: "Payment pending",
    variant: "warning",
    Icon: CalendarClock,
    iconClass: "bg-warning-soft text-warning-text",
    message: "We're waiting for your payment to be confirmed. This usually only takes a moment.",
  },
};

const PLAN_LABEL: Record<NonNullable<MySubscription["plan"]>, string> = {
  trial: "Trial",
  monthly: "Monthly",
  yearly: "Yearly",
};

/** Shared across tiers — SchoolDeck ships as a single, fully-featured plan. */
const FEATURES = ["Every SchoolDeck module included", "Unlimited students & staff", "Priority email support"];

function fmtLong(d: string | null): string {
  return d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—";
}

/** The end-date tile's label and value, which differ by status. */
function endInfo(sub: MySubscription): { label: string; date: string | null } {
  if (sub.status === "active") return { label: "Valid until", date: sub.paidEndDate };
  if (sub.status === "trial" || sub.status === "payment_pending") return { label: "Trial ends", date: sub.trialEndDate };
  if (sub.status === "expired") return { label: "Ended on", date: sub.paidEndDate ?? sub.trialEndDate };
  return { label: "Valid until", date: sub.paidEndDate ?? sub.trialEndDate };
}

function Metric({ icon: Icon, label, value, hint }: { icon: LucideIcon; label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface px-4 py-3">
      <div className="flex items-center gap-1.5 text-xs text-muted">
        <Icon className="size-3.5" />
        {label}
      </div>
      <p className="mt-1 truncate text-lg font-semibold text-text">{value}</p>
      {hint && <p className="text-xs text-subtle">{hint}</p>}
    </div>
  );
}

export default function SubscriptionPage() {
  const { toast } = useToast();
  const user = useAuthStore((s) => s.user);

  const [sub, setSub] = useState<MySubscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [paymentEnabled, setPaymentEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    // setTimeout(…,0) keeps setState out of the effect body (cascading-render rule).
    const t = setTimeout(() => {
      setLoading(true);
      // allSettled so a failed plans fetch never blanks the current-plan card, and vice versa.
      Promise.allSettled([getMySubscription(), getPlans()])
        .then(([subRes, planRes]) => {
          if (cancelled) return;
          if (subRes.status === "fulfilled") {
            setSub(subRes.value);
            setError(null);
          } else {
            setError("We couldn't load your subscription. Please try again.");
          }
          if (planRes.status === "fulfilled") {
            setPlans(planRes.value.plans);
            setPaymentEnabled(planRes.value.paymentEnabled);
          } else {
            setPlans([]);
          }
        })
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

  // Savings are derived from the real API prices — never hard-coded.
  const monthlyPlan = plans.find((p) => p.id === "monthly");
  const yearlyPlan = plans.find((p) => p.id === "yearly");
  const yearlySavings = monthlyPlan && yearlyPlan ? monthlyPlan.priceInr * 12 - yearlyPlan.priceInr : 0;
  const yearlySavingsPct =
    monthlyPlan && yearlyPlan && monthlyPlan.priceInr > 0
      ? Math.round((yearlySavings / (monthlyPlan.priceInr * 12)) * 100)
      : 0;

  const header = (
    <PageHeader
      title="Subscription"
      description="Manage your SchoolDeck plan and billing."
      actions={
        <Button variant="ghost" onClick={reload} disabled={loading}>
          <RefreshCw className={cn("size-4", loading && "animate-spin")} /> Refresh
        </Button>
      }
    />
  );

  // First load.
  if (loading && !sub) {
    return (
      <div className="space-y-6">
        {header}
        <Loading label="Loading your subscription…" />
      </div>
    );
  }

  // Subscription couldn't be loaded at all.
  if (error && !sub) {
    return (
      <div className="space-y-6">
        {header}
        <Card>
          <CardContent>
            <EmptyState
              icon={<AlertTriangle className="size-5" />}
              title="Couldn't load your subscription"
              description={error}
              action={
                <Button onClick={reload}>
                  <RefreshCw className="size-4" /> Try again
                </Button>
              }
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Platform owner / legacy tenant — never gated, no billing.
  if (sub && !sub.hasSubscription) {
    return (
      <div className="space-y-6">
        {header}
        <Card>
          <CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-success-soft text-success-text">
              <ShieldCheck className="size-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-text">Full access — no billing</h2>
              <p className="mt-1 text-sm text-muted">
                This is a platform account, so it isn&apos;t billed and never expires. You have unrestricted
                access to every SchoolDeck feature.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const meta = sub ? STATUS_META[sub.status] : null;
  const end = sub ? endInfo(sub) : null;
  const currentPlanPrice = sub ? plans.find((p) => p.id === sub.plan)?.priceInr : undefined;
  const activePaid = !!sub && sub.status === "active" && (sub.plan === "monthly" || sub.plan === "yearly");
  const showPlanCta = !!sub && paymentEnabled && ["trial", "expired", "cancelled"].includes(sub.status);

  return (
    <div className="space-y-6">
      {header}

      {/* Current subscription */}
      {sub && meta && end && (
        <Card>
          <CardContent className="space-y-5">
            <div className="flex items-start gap-3">
              <div className={cn("grid size-11 shrink-0 place-items-center rounded-xl", meta.iconClass)}>
                <meta.Icon className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-subtle">Current subscription</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-text">
                    {sub.plan ? `${PLAN_LABEL[sub.plan]} plan` : "No active plan"}
                  </h2>
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                </div>
                {sub.schoolName && <p className="mt-0.5 truncate text-sm text-muted">{sub.schoolName}</p>}
              </div>
            </div>

            <p className="text-sm text-muted">{meta.message}</p>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Metric
                icon={CircleDollarSign}
                label="Plan cost"
                value={
                  sub.plan === "trial" || sub.plan == null
                    ? "Free"
                    : currentPlanPrice != null
                      ? inr.format(currentPlanPrice)
                      : "—"
                }
                hint={sub.plan === "monthly" ? "per month" : sub.plan === "yearly" ? "per year" : undefined}
              />
              <Metric
                icon={CalendarClock}
                label="Days remaining"
                value={sub.daysRemaining != null ? String(sub.daysRemaining) : "—"}
                hint={
                  sub.daysRemaining != null ? (sub.daysRemaining === 1 ? "day left" : "days left") : undefined
                }
              />
              <Metric icon={CalendarDays} label={end.label} value={fmtLong(end.date)} />
            </div>

            {showPlanCta && (
              <a
                href="#plans"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Choose a plan <ArrowRight className="size-4" />
              </a>
            )}
          </CardContent>
        </Card>
      )}

      {/* Available plans */}
      <div id="plans" className="scroll-mt-6 space-y-3">
        <div>
          <h2 className="text-base font-semibold text-text">Choose your plan</h2>
          <p className="text-sm text-muted">Every plan unlocks the complete SchoolDeck platform. Prices are in INR.</p>
        </div>

        {plans.length === 0 ? (
          <Card>
            <CardContent>
              <EmptyState
                icon={<Info className="size-5" />}
                title="Plans are unavailable right now"
                description="We couldn't load the available plans. Please try again in a moment."
                action={
                  <Button onClick={reload}>
                    <RefreshCw className="size-4" /> Try again
                  </Button>
                }
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {plans.map((p) => {
              const yearly = p.id === "yearly";
              const isCurrent = !!sub && sub.plan === p.id && sub.status === "active";
              const per = yearly ? "year" : "month";
              const effectiveMonthly = yearly && p.priceInr > 0 ? Math.round(p.priceInr / 12) : null;

              return (
                <Card
                  key={p.id}
                  className={cn(
                    "flex flex-col",
                    isCurrent ? "border-primary ring-1 ring-primary" : yearly ? "border-primary/40" : ""
                  )}
                >
                  <CardContent className="flex flex-1 flex-col gap-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-semibold text-text">{p.name}</h3>
                      {isCurrent ? (
                        <Badge variant="success">
                          <BadgeCheck className="mr-1 size-3" /> Current plan
                        </Badge>
                      ) : yearly ? (
                        <Badge variant="info">
                          <Sparkles className="mr-1 size-3" /> Best value
                        </Badge>
                      ) : null}
                    </div>

                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-text">{inr.format(p.priceInr)}</span>
                        <span className="text-sm text-muted">/ {per}</span>
                      </div>
                      {yearly && effectiveMonthly != null && (
                        <p className="mt-1 text-xs text-muted">
                          ≈ {inr.format(effectiveMonthly)} / month
                          {yearlySavings > 0 && (
                            <span className="text-success-text">
                              {" "}
                              · Save {inr.format(yearlySavings)} ({yearlySavingsPct}%)
                            </span>
                          )}
                        </p>
                      )}
                    </div>

                    <ul className="space-y-2 text-sm text-muted">
                      {FEATURES.map((f) => (
                        <li key={f} className="flex items-center gap-2">
                          <Check className="size-4 shrink-0 text-primary" /> {f}
                        </li>
                      ))}
                    </ul>

                    <div className="mt-auto pt-2">
                      {paymentEnabled ? (
                        <Button
                          className="w-full"
                          variant={isCurrent ? "outline" : yearly ? "primary" : "outline"}
                          disabled={!!paying}
                          onClick={() => pay(p.id)}
                        >
                          {paying === p.id ? <Spinner size="sm" /> : null}
                          {isCurrent ? "Renew plan" : activePaid ? `Switch to ${p.name}` : `Choose ${p.name}`}
                        </Button>
                      ) : (
                        <a
                          href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
                            `Activate ${p.name} plan${sub?.schoolName ? ` — ${sub.schoolName}` : ""}`
                          )}`}
                          className="block"
                        >
                          <Button className="w-full" variant={yearly ? "primary" : "outline"}>
                            <Mail className="size-4" /> Contact to activate
                          </Button>
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!paymentEnabled && plans.length > 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-border bg-surface-hover px-4 py-3 text-sm text-muted">
            <Info className="mt-0.5 size-4 shrink-0 text-info-text" />
            <p>
              Online payment isn&apos;t enabled yet. Email{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary hover:underline">
                {SUPPORT_EMAIL}
              </a>{" "}
              and we&apos;ll activate your subscription for you.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

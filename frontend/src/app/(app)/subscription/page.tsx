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
  Users,
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
import { getPlans, type TierPlan, type TierId, type BillingCycle } from "@/lib/api/payment";
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
    message: "You're exploring SchoolDeck on a free trial with full access. Choose a plan below to keep going after it ends.",
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

const CYCLE_LABEL: Record<NonNullable<MySubscription["plan"]>, string> = {
  trial: "Trial",
  monthly: "Monthly",
  yearly: "Yearly",
};

const TIER_NAME: Record<TierId, string> = { starter: "Starter", standard: "Standard", premium: "Premium" };

/**
 * Marketing highlights per tier. The AUTHORITATIVE feature set (what the API
 * actually unlocks) lives in backend/src/modules/schools/tiers.ts — these are the
 * human-friendly bullets, kept in step with it (and with the showcase site).
 */
const TIER_HIGHLIGHTS: Record<TierId, { headline: string; features: string[] }> = {
  starter: {
    headline: "Core school operations",
    features: [
      "Students, teachers, staff & parents",
      "Classes, subjects & timetable",
      "Attendance & holidays",
      "Fee collection & receipts",
      "Announcements, notices & messaging",
      "Certificates",
    ],
  },
  standard: {
    headline: "Everything in Starter, plus",
    features: [
      "Examinations, marks & report cards",
      "Assignments & syllabus",
      "Online classes & study material (LMS)",
      "Library circulation",
      "Transport & hostel",
      "Events & visitor management",
    ],
  },
  premium: {
    headline: "Everything in Standard, plus",
    features: [
      "Expenses & payroll",
      "Inventory & canteen",
      "Health / infirmary & labs",
      "Advanced analytics & dashboards",
      "AI assistant",
    ],
  },
};

const TIER_RANK: Record<TierId, number> = { starter: 0, standard: 1, premium: 2 };

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
  const [tiers, setTiers] = useState<TierPlan[]>([]);
  const [students, setStudents] = useState(0);
  const [billedStudents, setBilledStudents] = useState(0);
  const [minBilled, setMinBilled] = useState(0);
  const [currentTier, setCurrentTier] = useState<TierId | null>(null);
  const [currentCycle, setCurrentCycle] = useState<BillingCycle | null>(null);
  const [paymentEnabled, setPaymentEnabled] = useState(false);
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
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
            const p = planRes.value;
            setTiers(p.tiers);
            setStudents(p.students);
            setBilledStudents(p.billedStudents);
            setMinBilled(p.minBilledStudents);
            setPaymentEnabled(p.paymentEnabled);
            setCurrentTier(p.currentTier);
            setCurrentCycle(p.currentCycle);
            if (p.currentCycle) setCycle(p.currentCycle);
          } else {
            setTiers([]);
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

  const pay = async (tier: TierId) => {
    setPaying(tier);
    try {
      await startCheckout({ tier, cycle, prefill: { name: user?.name, email: user?.email } });
      toast({ title: "Subscription activated", description: `Thank you! Your ${TIER_NAME[tier]} plan is now active.` });
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

  const header = (
    <PageHeader
      title="Subscription"
      description="Per-student pricing — pick the plan that fits your school."
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
  // Complimentary (admin-granted free) access — full access with no expiry/billing.
  const freeAccess = !!sub?.freeAccess;
  const activePaid = !!sub && sub.status === "active" && (sub.plan === "monthly" || sub.plan === "yearly");
  const currentTierDef = currentTier ? tiers.find((t) => t.id === currentTier) : undefined;
  const currentTotal =
    currentTierDef && currentCycle
      ? currentCycle === "yearly"
        ? currentTierDef.yearlyTotalInr
        : currentTierDef.monthlyTotalInr
      : undefined;
  const showPlanCta = !!sub && paymentEnabled && ["trial", "expired", "cancelled"].includes(sub.status);

  // Heading for the current-plan card.
  const currentHeading = freeAccess
    ? "Complimentary access"
    : activePaid && currentTierDef
      ? `${currentTierDef.name} plan`
      : sub?.plan
        ? `${CYCLE_LABEL[sub.plan]} plan`
        : "No active plan";

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
                  <h2 className="text-lg font-semibold text-text">{currentHeading}</h2>
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                  {activePaid && currentCycle && <Badge variant="outline">{CYCLE_LABEL[currentCycle]}</Badge>}
                  {freeAccess && <Badge variant="info">Complimentary</Badge>}
                </div>
                {sub.schoolName && <p className="mt-0.5 truncate text-sm text-muted">{sub.schoolName}</p>}
              </div>
            </div>

            <p className="text-sm text-muted">
              {freeAccess
                ? "You have complimentary full access to every SchoolDeck module — no expiry and no billing."
                : meta.message}
            </p>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric
                icon={CircleDollarSign}
                label="Plan cost"
                value={
                  sub.plan === "trial" || sub.plan == null
                    ? "Free"
                    : currentTotal != null
                      ? inr.format(currentTotal)
                      : "—"
                }
                hint={currentCycle === "monthly" ? "per month" : currentCycle === "yearly" ? "per year" : undefined}
              />
              <Metric
                icon={Users}
                label="Students"
                value={students > 0 ? String(students) : "—"}
                hint={billedStudents > students ? `billed for ${billedStudents}` : "active"}
              />
              <Metric
                icon={CalendarClock}
                label="Days remaining"
                value={freeAccess ? "Unlimited" : sub.daysRemaining != null ? String(sub.daysRemaining) : "—"}
                hint={
                  freeAccess
                    ? "no expiry"
                    : sub.daysRemaining != null
                      ? sub.daysRemaining === 1
                        ? "day left"
                        : "days left"
                      : undefined
                }
              />
              <Metric
                icon={CalendarDays}
                label={freeAccess ? "Validity" : end.label}
                value={freeAccess ? "Never expires" : fmtLong(end.date)}
              />
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
      <div id="plans" className="scroll-mt-6 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-text">Choose your plan</h2>
            <p className="text-sm text-muted">
              Pricing is <span className="font-medium text-text">per student, per month</span>.{" "}
              {students > 0 ? (
                <>
                  You have <span className="font-medium text-text">{students}</span> active{" "}
                  {students === 1 ? "student" : "students"}
                  {billedStudents > students && <> (billed for a minimum of {minBilled})</>}.
                </>
              ) : (
                <>Add students to see your exact total.</>
              )}
            </p>
          </div>

          {/* Billing-cycle toggle */}
          <div className="inline-flex shrink-0 self-start rounded-lg border border-border bg-surface p-1 text-sm">
            <button
              type="button"
              onClick={() => setCycle("monthly")}
              className={cn(
                "rounded-md px-3 py-1.5 font-medium transition-colors",
                cycle === "monthly" ? "bg-primary text-white" : "text-muted hover:text-text"
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setCycle("yearly")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-colors",
                cycle === "yearly" ? "bg-primary text-white" : "text-muted hover:text-text"
              )}
            >
              Yearly
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  cycle === "yearly" ? "bg-white/20 text-white" : "bg-success-soft text-success-text"
                )}
              >
                2 months free
              </span>
            </button>
          </div>
        </div>

        {tiers.length === 0 ? (
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
          <div className="grid gap-4 lg:grid-cols-3">
            {tiers.map((t) => {
              const highlight = TIER_HIGHLIGHTS[t.id];
              const perStudent = cycle === "yearly" ? t.perStudentYearlyInr : t.perStudentMonthlyInr;
              const total = cycle === "yearly" ? t.yearlyTotalInr : t.monthlyTotalInr;
              const yearlySavings = t.monthlyTotalInr * 12 - t.yearlyTotalInr;
              const yearlySavingsPct =
                t.monthlyTotalInr > 0 ? Math.round((yearlySavings / (t.monthlyTotalInr * 12)) * 100) : 0;
              const effMonthlyPerStudent = Math.round(t.perStudentYearlyInr / 12);

              const isCurrentExact = activePaid && currentTier === t.id && currentCycle === cycle;
              const isCurrentTier = activePaid && currentTier === t.id;
              const featured = t.id === "standard"; // the recommended middle tier

              let ctaLabel: string;
              if (isCurrentExact) ctaLabel = "Renew plan";
              else if (activePaid && currentTier)
                ctaLabel =
                  TIER_RANK[t.id] > TIER_RANK[currentTier]
                    ? `Upgrade to ${t.name}`
                    : TIER_RANK[t.id] < TIER_RANK[currentTier]
                      ? `Switch to ${t.name}`
                      : `Switch to ${cycle === "yearly" ? "Yearly" : "Monthly"}`;
              else ctaLabel = `Choose ${t.name}`;

              return (
                <Card
                  key={t.id}
                  className={cn(
                    "relative flex flex-col",
                    isCurrentTier ? "border-primary ring-1 ring-primary" : featured ? "border-primary/40" : ""
                  )}
                >
                  <CardContent className="flex flex-1 flex-col gap-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-semibold text-text">{t.name}</h3>
                      {isCurrentTier ? (
                        <Badge variant="success">
                          <BadgeCheck className="mr-1 size-3" /> Current plan
                        </Badge>
                      ) : featured ? (
                        <Badge variant="info">
                          <Sparkles className="mr-1 size-3" /> Most popular
                        </Badge>
                      ) : null}
                    </div>

                    <p className="text-sm text-muted">{t.blurb}</p>

                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-text">{inr.format(perStudent)}</span>
                        <span className="text-sm text-muted">/ student / {cycle === "yearly" ? "year" : "month"}</span>
                      </div>
                      {cycle === "yearly" ? (
                        <p className="mt-1 text-xs text-muted">
                          ≈ {inr.format(effMonthlyPerStudent)} / student / month
                          {yearlySavings > 0 && (
                            <span className="text-success-text"> · Save {yearlySavingsPct}%</span>
                          )}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-subtle">Billed monthly</p>
                      )}
                    </div>

                    {/* What the school actually pays */}
                    <div className="rounded-lg border border-border bg-surface-hover px-3 py-2">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-xs text-muted">
                          Total for {billedStudents} {billedStudents === 1 ? "student" : "students"}
                        </span>
                        <span className="text-sm font-semibold text-text">
                          {inr.format(total)}
                          <span className="font-normal text-muted"> / {cycle === "yearly" ? "yr" : "mo"}</span>
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-subtle">{highlight.headline}</p>
                      <ul className="space-y-2 text-sm text-muted">
                        {highlight.features.map((f) => (
                          <li key={f} className="flex items-start gap-2">
                            <Check className="mt-0.5 size-4 shrink-0 text-primary" /> {f}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-auto pt-2">
                      {paymentEnabled ? (
                        <Button
                          className="w-full"
                          variant={featured || isCurrentTier ? "primary" : "outline"}
                          disabled={!!paying}
                          onClick={() => pay(t.id)}
                        >
                          {paying === t.id ? <Spinner size="sm" /> : null}
                          {ctaLabel}
                        </Button>
                      ) : (
                        <a
                          href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
                            `Activate ${t.name} plan${sub?.schoolName ? ` — ${sub.schoolName}` : ""}`
                          )}`}
                          className="block"
                        >
                          <Button className="w-full" variant={featured ? "primary" : "outline"}>
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

        {!paymentEnabled && tiers.length > 0 && (
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

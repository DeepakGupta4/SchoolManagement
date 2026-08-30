"use client";

import { AlertTriangle, Sparkles } from "lucide-react";
import type { MySubscription } from "@/lib/api/subscription";

/**
 * Slim trial countdown shown at the top of the app while a school is on trial.
 * Purely informational — the backend remains the authority on expiry. Turns to
 * a warning tone in the final two days.
 */
export function TrialBanner({ sub }: { sub: MySubscription }) {
  if (sub.status !== "trial" || sub.daysRemaining == null) return null;

  const days = sub.daysRemaining;
  const urgent = days <= 2;
  const endText = sub.trialEndDate
    ? new Date(sub.trialEndDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div
      className={`mb-5 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-3.5 py-2.5 text-sm ${
        urgent
          ? "border-warning-soft bg-warning-soft text-warning-text"
          : "border-border bg-surface-hover text-text"
      }`}
    >
      {urgent ? (
        <AlertTriangle className="size-4 shrink-0" />
      ) : (
        <Sparkles className="size-4 shrink-0 text-primary" />
      )}
      <span className="font-semibold">
        Free trial · {days} {days === 1 ? "day" : "days"} remaining
      </span>
      {endText && <span className="text-muted">Expires on {endText}</span>}
      {urgent && (
        <span className="ml-auto font-medium">
          Your trial is ending soon — activate your subscription to keep access.
        </span>
      )}
    </div>
  );
}

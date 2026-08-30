"use client";

import { useRouter } from "next/navigation";
import { Ban, LockKeyhole, LogOut, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui";
import { useAuthStore } from "@/store";
import { logout as apiLogout } from "@/lib/api/auth";
import type { MySubscription } from "@/lib/api/subscription";

const SUPPORT_EMAIL = "schooldeck.in@gmail.com";

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

  const suspended = sub.status === "suspended";

  const handleSignOut = () => {
    apiLogout();
    signOut();
    router.replace("/login");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-md">
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

        <div className="mt-6 space-y-2.5">
          <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Activate ${sub.schoolName ?? "our school"}`)}`}>
            <Button className="w-full" size="lg">
              <Mail className="size-4" /> Contact us to activate
            </Button>
          </a>
          <Button variant="outline" className="w-full" onClick={handleSignOut}>
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>

        <p className="mt-4 text-xs text-muted">Online self-service payment is coming soon.</p>
      </div>
    </div>
  );
}

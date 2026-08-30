"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@/store";
import { getMySubscription, type MySubscription } from "@/lib/api/subscription";

/**
 * Loads the current school's subscription once the session is authenticated.
 * Used by the app chrome to show the trial banner and, when access is not
 * allowed, the full-screen lock. Purely for display — the server enforces.
 */
export function useSubscription() {
  const status = useAuthStore((s) => s.status);
  const [sub, setSub] = useState<MySubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    // setTimeout(…,0) keeps setState out of the effect body (cascading-render rule).
    const t = setTimeout(() => {
      setLoading(true);
      getMySubscription()
        .then((data) => {
          if (!cancelled) {
            setSub(data);
            setLoading(false);
          }
        })
        .catch(() => {
          // Non-critical: if this fails, fall back to showing the app (the
          // backend still gates every protected call).
          if (!cancelled) setLoading(false);
        });
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [status, reloadKey]);

  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);
  return { sub, loading, refetch };
}

"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store";
import { fetchCurrentUser } from "@/lib/api/auth";
import { getToken } from "@/lib/api/client";

/**
 * Restores the session once at app start.
 *
 * The store begins in `loading`; this resolves it to `authenticated` or
 * `guest` so route guards have something definite to act on.
 */
export function SessionProvider({ children }: { children: React.ReactNode }) {
  const signIn = useAuthStore((s) => s.signIn);
  const setGuest = useAuthStore((s) => s.setGuest);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // No token means no round-trip is needed — go straight to guest.
      if (!getToken()) {
        if (!cancelled) setGuest();
        return;
      }

      const user = await fetchCurrentUser();
      if (cancelled) return;
      if (user) signIn(user);
      else setGuest();
    })();

    return () => {
      cancelled = true;
    };
  }, [signIn, setGuest]);

  return <>{children}</>;
}

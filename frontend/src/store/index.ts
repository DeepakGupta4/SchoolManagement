import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/types";

/**
 * `loading` matters: on a page refresh the token is verified against the
 * server before we know who (if anyone) is signed in. Redirecting to /login
 * during that window would bounce a perfectly valid session.
 */
export type AuthStatus = "loading" | "authenticated" | "guest";

interface AuthStore {
  user: User | null;
  status: AuthStatus;
  isAuthenticated: boolean;
  signIn: (user: User) => void;
  signOut: () => void;
  setGuest: () => void;
  /** Merge fields into the signed-in user in place (e.g. after editing name). */
  updateUser: (patch: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  status: "loading",
  isAuthenticated: false,
  signIn: (user) => set({ user, status: "authenticated", isAuthenticated: true }),
  signOut: () => set({ user: null, status: "guest", isAuthenticated: false }),
  setGuest: () => set({ user: null, status: "guest", isAuthenticated: false }),
  updateUser: (patch) => set((s) => (s.user ? { user: { ...s.user, ...patch } } : {})),
}));

/**
 * The signed-in school's feature-tier entitlements, loaded once by
 * `useSubscription` and shared with the nav/route-guard so a module outside the
 * school's plan is hidden and blocked everywhere consistently.
 */
interface EntitlementsStore {
  /** Current paid tier id, or null (trial / complimentary / platform owner). */
  tier: string | null;
  /** Module keys the plan unlocks; null = no tier restriction (full access). */
  tierModules: string[] | null;
  setEntitlements: (e: { tier: string | null; tierModules: string[] | null }) => void;
}

export const useEntitlementsStore = create<EntitlementsStore>((set) => ({
  tier: null,
  tierModules: null,
  setEntitlements: (e) => set({ tier: e.tier, tierModules: e.tierModules }),
}));

interface SidebarStore {
  /** Desktop rail collapse. Persisted — it's a deliberate user preference. */
  isCollapsed: boolean;
  toggle: () => void;
  /** Mobile overlay drawer. Never persisted; always starts closed. */
  isMobileOpen: boolean;
  openMobile: () => void;
  closeMobile: () => void;
}

export const useSidebarStore = create<SidebarStore>()(
  persist(
    (set) => ({
      isCollapsed: false,
      toggle: () => set((s) => ({ isCollapsed: !s.isCollapsed })),
      isMobileOpen: false,
      openMobile: () => set({ isMobileOpen: true }),
      closeMobile: () => set({ isMobileOpen: false }),
    }),
    {
      name: "sidebar-preferences",
      partialize: (s) => ({ isCollapsed: s.isCollapsed }),
    }
  )
);

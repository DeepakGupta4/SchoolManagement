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
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  status: "loading",
  isAuthenticated: false,
  signIn: (user) => set({ user, status: "authenticated", isAuthenticated: true }),
  signOut: () => set({ user: null, status: "guest", isAuthenticated: false }),
  setGuest: () => set({ user: null, status: "guest", isAuthenticated: false }),
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

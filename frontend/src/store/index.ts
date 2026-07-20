import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/types";

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: {
    id: "1",
    name: "Rajesh Kumar",
    email: "admin@springdale.edu",
    role: "school_admin",
    avatar: "",
    schoolId: "school_1",
  },
  isAuthenticated: true,
  setUser: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
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

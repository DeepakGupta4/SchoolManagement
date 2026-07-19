import { create } from "zustand";
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
  isCollapsed: boolean;
  toggle: () => void;
}

export const useSidebarStore = create<SidebarStore>((set) => ({
  isCollapsed: false,
  toggle: () => set((s) => ({ isCollapsed: !s.isCollapsed })),
}));

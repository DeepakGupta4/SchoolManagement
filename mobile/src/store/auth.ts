import { create } from "zustand";
import { fetchMe, logout as apiLogout, type AppUser } from "@/api/auth";
import { getToken } from "@/api/tokens";

type Status = "loading" | "authed" | "guest";

interface AuthState {
  user: AppUser | null;
  status: Status;
  signIn: (user: AppUser) => void;
  /** Replace the cached user (e.g. after editing own profile). */
  setUser: (user: AppUser) => void;
  signOut: () => Promise<void>;
  /** On launch: restore a session from a stored token, or fall back to guest. */
  hydrate: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  status: "loading",
  signIn: (user) => set({ user, status: "authed" }),
  setUser: (user) => set({ user }),
  signOut: async () => {
    await apiLogout();
    set({ user: null, status: "guest" });
  },
  hydrate: async () => {
    const token = await getToken();
    if (!token) return set({ status: "guest" });
    try {
      set({ user: await fetchMe(), status: "authed" });
    } catch {
      set({ status: "guest" });
    }
  },
}));

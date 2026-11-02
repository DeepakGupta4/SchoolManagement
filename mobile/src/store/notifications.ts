import { create } from "zustand";
import { listNotifications, type AppNotification } from "@/api/notifications";

interface NotifState {
  unread: number;
  items: AppNotification[];
  loading: boolean;
  setUnread: (n: number) => void;
  /** Refresh the list + unread badge. Safe to call on focus. */
  refresh: () => Promise<void>;
  /** Mark one item read IN PLACE (no re-fetch) — keeps a tap from reloading the list. */
  markReadLocal: (id: string) => void;
  /** Mark every item read in place. */
  markAllReadLocal: () => void;
}

export const useNotifications = create<NotifState>((set) => ({
  unread: 0,
  items: [],
  loading: false,
  setUnread: (n) => set({ unread: n }),
  refresh: async () => {
    set({ loading: true });
    try {
      const { items, unread } = await listNotifications();
      set({ items, unread, loading: false });
    } catch {
      set({ loading: false });
    }
  },
  markReadLocal: (id) =>
    set((s) => {
      const items = s.items.map((n) => (n.id === id ? { ...n, read: true } : n));
      return { items, unread: items.filter((n) => !n.read).length };
    }),
  markAllReadLocal: () =>
    set((s) => ({ items: s.items.map((n) => ({ ...n, read: true })), unread: 0 })),
}));

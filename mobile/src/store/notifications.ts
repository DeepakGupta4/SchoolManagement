import { create } from "zustand";
import { listNotifications, type AppNotification } from "@/api/notifications";

interface NotifState {
  unread: number;
  items: AppNotification[];
  loading: boolean;
  setUnread: (n: number) => void;
  /** Refresh the list + unread badge. Safe to call on focus. */
  refresh: () => Promise<void>;
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
}));

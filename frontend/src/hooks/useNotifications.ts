"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@/store";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "@/lib/api/notifications";

const POLL_MS = 45_000;

/**
 * Live notifications for the current user. Polls every 45s so the bell stays
 * current without a websocket. Unread is derived from the fetched list, so
 * optimistic mark-as-read updates the badge instantly.
 */
export function useNotifications() {
  const status = useAuthStore((s) => s.status);
  const [items, setItems] = useState<AppNotification[]>([]);

  const load = useCallback(() => {
    getNotifications()
      .then(({ items }) => setItems(items))
      .catch(() => {
        /* non-critical */
      });
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    // Defer the first fetch so no setState runs synchronously in the effect.
    const first = setTimeout(load, 0);
    const interval = setInterval(load, POLL_MS);
    return () => {
      clearTimeout(first);
      clearInterval(interval);
    };
  }, [status, load]);

  const unread = items.filter((n) => !n.read).length;

  const markAll = useCallback(() => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    markAllNotificationsRead().catch(() => {});
  }, []);

  const markOne = useCallback((id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    markNotificationRead(id).catch(() => {});
  }, []);

  return { items, unread, refetch: load, markAll, markOne };
}

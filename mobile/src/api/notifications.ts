import { api, apiEnvelope } from "./client";

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string; // a WEB route — do NOT push it in Expo Router
  read: boolean;
  createdAt: string;
}

/** Latest 30 + unread count (count rides on `meta`, so use the envelope fetch). */
export async function listNotifications(): Promise<{ items: AppNotification[]; unread: number }> {
  const { data, meta } = await apiEnvelope<AppNotification[]>("/api/notifications");
  return { items: data ?? [], unread: Number(meta?.unread ?? 0) };
}

export const markRead = (id: string) => api(`/api/notifications/${id}/read`, { method: "POST" });
export const markAllRead = () => api("/api/notifications/read-all", { method: "POST" });

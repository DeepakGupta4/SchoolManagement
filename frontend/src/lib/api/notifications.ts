import { apiList, apiRequest } from "./client";

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string;
  read: boolean;
  createdAt: string;
}

/** The caller's latest notifications plus the unread count. */
export async function getNotifications(): Promise<{ items: AppNotification[]; unread: number }> {
  const res = await apiList<AppNotification>("/api/notifications");
  const unread = (res.meta as unknown as { unread?: number }).unread ?? 0;
  return { items: res.data, unread };
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiRequest(`/api/notifications/${id}/read`, { method: "POST" });
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiRequest("/api/notifications/read-all", { method: "POST" });
}

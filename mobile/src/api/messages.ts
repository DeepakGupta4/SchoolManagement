import { api } from "./client";

/**
 * A row on the school-wide message BOARD. The backend has no sender/recipient or
 * threads — every school user sees the same list, so treat it as a shared board.
 */
export interface Message {
  id: string;
  name: string;
  role: string;
  subject: string;
  body: string;
  category: string;
  time: string; // free-form display string
  unread: number;
  online: boolean;
  read: boolean;
}

export const listMessages = () => api<Message[]>("/api/messages?limit=200");

export const createMessage = (body: {
  name: string;
  role?: string;
  subject?: string;
  body?: string;
  category?: string;
}) => api<Message>("/api/messages", { method: "POST", body });

import { createApiResource } from "./createApiResource";

export interface Message {
  id: string;
  /** Conversation / sender name shown in the sidebar and chat header. */
  name: string;
  /** Sender role / subtitle, e.g. "Math Teacher", "Group · 48 members". */
  role: string;
  subject: string;
  /** Message content — also used as the sidebar preview line. */
  body: string;
  /** Conversation type, e.g. "Direct" or "Group". */
  category: string;
  /** Display timestamp, e.g. "10:42 AM", "Yesterday", "Mon". */
  time: string;
  /** Unread badge count. */
  unread: number;
  online: boolean;
  read: boolean;
}

export interface MessageFilters {
  search?: string;
  category?: string;
}

export const MESSAGE_CATEGORY_OPTIONS = ["Direct", "Group"];

export const messagesApi = createApiResource<Message, MessageFilters>("/api/messages");

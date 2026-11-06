import { apiRequest } from "./client";

/**
 * Per-user messaging. Every message has a sender and a recipient, so a user's
 * inbox is only their own conversations — not a flat school-wide list. A
 * conversation is all the messages between the signed-in user and one other
 * person; replies are ordinary messages, so threads persist on the server.
 */

/** One conversation in the sidebar — the other party + a last-message preview. */
export interface Conversation {
  /** The other party's login email — the conversation key. */
  email: string;
  name: string;
  role: string;
  lastBody: string;
  lastAt: string;
  /** Unread messages this party has sent me. */
  unread: number;
}

/** One message in an open thread. `mine` = sent by the signed-in user. */
export interface ThreadMessage {
  id: string;
  mine: boolean;
  fromName?: string;
  body: string;
  at: string;
}

/** Someone in the school the user can start a conversation with. */
export interface MessageContact {
  email: string;
  name: string;
  role: string;
}

export const messagesApi = {
  /** My conversations, most-recent activity first. */
  conversations: () => apiRequest<Conversation[]>("/api/messages"),
  /** People I can message (active users in my school). */
  contacts: () => apiRequest<MessageContact[]>("/api/messages/contacts"),
  /** The full thread with one person (marks their messages to me read). */
  thread: (email: string) =>
    apiRequest<ThreadMessage[]>(`/api/messages/thread/${encodeURIComponent(email)}`),
  /** Send a message; returns the created message. */
  send: (toEmail: string, body: string) =>
    apiRequest<ThreadMessage>("/api/messages", { method: "POST", body: { toEmail, body } }),
};

import { api } from "./client";

export type ChatRole = "user" | "assistant";

export interface ChatMsg {
  role: ChatRole;
  content: string;
}

export interface AiChatReply {
  reply: string;
  /** "rule" = no LLM key configured (canned reply) or an upstream failure. */
  source: "openai" | "gemini" | "rule";
}

export interface Copilot {
  key: string;
  name: string;
  blurb?: string;
  prompts?: string[];
}

export interface AiStatus {
  configured: boolean;
  provider?: "openai" | "gemini" | "none";
}

/**
 * Ask the SchoolDeck assistant. Non-streaming: one POST, one reply. The user's
 * role + school are read from the JWT server-side, so they are NOT sent here.
 * `history` is the prior turns (exclude the display-only greeting); the server
 * keeps the last 8. Returns a friendly "rule" reply (HTTP 200) if AI is off.
 */
export const chatWithAssistant = (message: string, history: ChatMsg[], copilot?: string) =>
  api<AiChatReply>("/api/ai/chat", { method: "POST", body: { message, history, copilot } });

/** Personas available to the current user (role-filtered server-side). */
export const getCopilots = () => api<{ copilots: Copilot[] }>("/api/ai/copilots");

/** Whether an AI provider is configured on the server. */
export const getAiStatus = () => api<AiStatus>("/api/ai/status");

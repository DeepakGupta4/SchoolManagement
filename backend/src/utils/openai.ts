import { env } from "../config/env.js";

/**
 * Thin client for OpenAI's Chat Completions REST API.
 *
 * Uses plain HTTPS (port 443), so it works on hosts that block other outbound
 * ports. Every caller must handle the "not configured" case: without a key the
 * AI features fall back (to Gemini, then the deterministic engine).
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface GenerateOptions {
  json?: boolean;
  temperature?: number;
  /** System-style steering. */
  system?: string;
  /** Cap the response length (defaults suit short answers). */
  maxTokens?: number;
}

export function isOpenAIConfigured(): boolean {
  return Boolean(env.OPENAI_API_KEY);
}

/** Low-level chat call. Throws when unconfigured or on any API/network error. */
export async function openaiChat(messages: ChatMessage[], opts: GenerateOptions = {}): Promise<string> {
  if (!env.OPENAI_API_KEY) throw new Error("OpenAI is not configured");

  const body: Record<string, unknown> = {
    model: env.OPENAI_MODEL,
    messages,
    temperature: opts.temperature ?? 0.4,
  };
  if (opts.maxTokens) body.max_tokens = opts.maxTokens;
  if (opts.json) body.response_format = { type: "json_object" };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`OpenAI API ${res.status}: ${text.slice(0, 300)}`);
    }

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const text = data.choices?.[0]?.message?.content ?? "";
    if (!text.trim()) throw new Error("OpenAI returned an empty response");
    return text;
  } finally {
    clearTimeout(timeout);
  }
}

/** Single-prompt convenience wrapper. */
export async function openaiGenerate(prompt: string, opts: GenerateOptions = {}): Promise<string> {
  const messages: ChatMessage[] = [];
  if (opts.system) messages.push({ role: "system", content: opts.system });
  messages.push({ role: "user", content: prompt });
  return openaiChat(messages, opts);
}

/** Parses a JSON response, tolerating markdown code fences. */
export async function openaiJson<T>(prompt: string, opts: Omit<GenerateOptions, "json"> = {}): Promise<T> {
  const raw = await openaiGenerate(prompt, { ...opts, json: true });
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  return JSON.parse(cleaned) as T;
}

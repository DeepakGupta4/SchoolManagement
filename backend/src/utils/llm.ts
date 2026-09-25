import { isGeminiConfigured, geminiGenerate, geminiJson } from "./gemini.js";
import {
  isOpenAIConfigured,
  openaiGenerate,
  openaiJson,
  openaiChat,
  type ChatMessage,
} from "./openai.js";

/**
 * Provider-agnostic AI layer. Prefers OpenAI when OPENAI_API_KEY is set, then
 * Gemini when GEMINI_API_KEY is set, otherwise throws — every caller wraps this
 * in a try/catch and falls back to the deterministic rule engine, so the app
 * always works with or without an AI key.
 */

export type { ChatMessage };

export type LLMProvider = "openai" | "gemini" | "none";

export function llmProvider(): LLMProvider {
  if (isOpenAIConfigured()) return "openai";
  if (isGeminiConfigured()) return "gemini";
  return "none";
}

export function isLLMConfigured(): boolean {
  return llmProvider() !== "none";
}

interface GenerateOptions {
  temperature?: number;
  system?: string;
  maxTokens?: number;
}

export async function llmGenerate(prompt: string, opts: GenerateOptions = {}): Promise<string> {
  if (isOpenAIConfigured()) return openaiGenerate(prompt, opts);
  if (isGeminiConfigured()) return geminiGenerate(prompt, opts);
  throw new Error("No AI provider configured");
}

export async function llmJson<T>(prompt: string, opts: GenerateOptions = {}): Promise<T> {
  if (isOpenAIConfigured()) return openaiJson<T>(prompt, opts);
  if (isGeminiConfigured()) return geminiJson<T>(prompt, opts);
  throw new Error("No AI provider configured");
}

/** Multi-turn chat (for the assistant). Gemini has no native roles here, so the
 *  conversation is flattened into a single prompt as a fallback. */
export async function llmChat(messages: ChatMessage[], opts: GenerateOptions = {}): Promise<string> {
  if (isOpenAIConfigured()) return openaiChat(messages, opts);
  if (isGeminiConfigured()) {
    const system = messages.find((m) => m.role === "system")?.content;
    const convo = messages
      .filter((m) => m.role !== "system")
      .map((m) => `${m.role === "assistant" ? "Assistant" : "User"}: ${m.content}`)
      .join("\n");
    return geminiGenerate(convo, { system, temperature: opts.temperature });
  }
  throw new Error("No AI provider configured");
}

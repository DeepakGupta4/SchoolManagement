import { env } from "../config/env.js";

/**
 * Thin client for Google's Generative Language (Gemini) REST API.
 *
 * Uses plain HTTPS (port 443), so it works on hosts that block other outbound
 * ports. Every caller must handle the "not configured" case: without a key the
 * AI features degrade to the deterministic engine rather than erroring.
 */

export function isGeminiConfigured(): boolean {
  return Boolean(env.GEMINI_API_KEY);
}

interface GenerateOptions {
  /** Ask the model to return strict JSON (response is still a string to parse). */
  json?: boolean;
  temperature?: number;
  /** System-style steering prepended to the user prompt. */
  system?: string;
}

/**
 * Sends a prompt to Gemini and returns the text response.
 * Throws when unconfigured or on any API/network error — callers catch and
 * fall back.
 */
export async function geminiGenerate(prompt: string, opts: GenerateOptions = {}): Promise<string> {
  if (!env.GEMINI_API_KEY) throw new Error("Gemini is not configured");

  // If the configured model has been retired by Google (404), self-heal by
  // retrying with this always-current alias — so an old GEMINI_MODEL value
  // (env or Render) can't permanently break the AI.
  const FALLBACK_MODEL = "gemini-flash-latest";
  const makeUrl = (m: string) =>
    `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${env.GEMINI_API_KEY}`;

  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: opts.system ? `${opts.system}\n\n${prompt}` : prompt }],
      },
    ],
    generationConfig: {
      temperature: opts.temperature ?? 0.4,
      ...(opts.json ? { responseMimeType: "application/json" } : {}),
    },
  };

  // A generous timeout: Gemini can take a few seconds; abort rather than hang.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  try {
    // The free tier occasionally answers 503 ("high demand") or 429; a couple
    // of short retries turn most of those into a successful response.
    const fetchModel = async (m: string): Promise<Response> => {
      let r: Response | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        r = await fetch(makeUrl(m), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        if (r.status !== 503 && r.status !== 429) break;
        if (attempt < 2) await new Promise((res) => setTimeout(res, 1200 * (attempt + 1)));
      }
      return r!;
    };

    let res = await fetchModel(env.GEMINI_MODEL);
    // Retired model → retry once with the current alias.
    if (res.status === 404 && env.GEMINI_MODEL !== FALLBACK_MODEL) {
      res = await fetchModel(FALLBACK_MODEL);
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Gemini API ${res.status}: ${text.slice(0, 300)}`);
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
      promptFeedback?: { blockReason?: string };
    };

    if (data.promptFeedback?.blockReason) {
      throw new Error(`Gemini blocked the prompt: ${data.promptFeedback.blockReason}`);
    }

    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    if (!text.trim()) throw new Error("Gemini returned an empty response");
    return text;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Convenience wrapper that parses a JSON response, tolerating markdown code
 * fences the model sometimes adds despite the JSON mime type.
 */
export async function geminiJson<T>(prompt: string, opts: Omit<GenerateOptions, "json"> = {}): Promise<T> {
  const raw = await geminiGenerate(prompt, { ...opts, json: true });
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  return JSON.parse(cleaned) as T;
}

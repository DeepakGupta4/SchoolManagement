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

  // Try the configured model, then lighter/alias fallbacks. On the free tier the
  // full flash models are frequently overloaded (503) and dated names get
  // retired (404); the "-lite" alias is far more reliable, so it's tried next.
  const candidates = [env.GEMINI_MODEL, "gemini-flash-lite-latest", "gemini-flash-latest"].filter(
    (m, i, a) => m && a.indexOf(m) === i
  );

  // A generous timeout: several models × retries must still fit; abort rather
  // than hang.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 40_000);
  try {
    const fetchOnce = (m: string) =>
      fetch(makeUrl(m), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

    let res: Response | null = null;
    for (const m of candidates) {
      res = await fetchOnce(m);
      // One quick retry for a transient overload on this model.
      if (res.status === 503 || res.status === 429) {
        await new Promise((r) => setTimeout(r, 900));
        res = await fetchOnce(m);
      }
      if (res.ok) break;
      // Auth/bad-request errors won't be fixed by another model — stop early.
      if (res.status === 400 || res.status === 401 || res.status === 403) break;
      // Otherwise (404 retired / 503 overloaded) fall through to the next model.
    }

    if (!res || !res.ok) {
      const text = res ? await res.text().catch(() => "") : "";
      throw new Error(`Gemini API ${res?.status ?? "?"}: ${text.slice(0, 300)}`);
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

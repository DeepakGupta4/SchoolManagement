/**
 * Thin fetch wrapper for the backend API.
 *
 * Attaches the auth token, unwraps the `{ data }` envelope, and turns non-2xx
 * responses into thrown Errors carrying the server's message — so every call
 * site can rely on try/catch instead of checking status codes.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const TOKEN_KEY = "schoolos.token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** Extra query parameters; undefined and empty values are dropped. */
  query?: Record<string, string | number | undefined>;
  signal?: AbortSignal;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, signal } = options;

  const url = new URL(path.replace(/^\//, ""), `${BASE_URL.replace(/\/$/, "")}/`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
    }
  }

  const token = getToken();

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      signal,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    // A network-level failure has no status; say so plainly rather than
    // surfacing "Failed to fetch", which reads like a bug to the user.
    throw new ApiError(0, "Could not reach the server. Check your connection.");
  }

  if (response.status === 204) return undefined as T;

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (payload as { error?: string } | null)?.error ?? `Request failed (${response.status}).`;
    throw new ApiError(response.status, message, (payload as { details?: unknown } | null)?.details);
  }

  // Endpoints answer with `{ data, meta }`; unwrap so callers get the payload.
  const envelope = payload as { data?: T } | null;
  return (envelope && "data" in envelope ? envelope.data : payload) as T;
}

/** Variant that keeps the `meta` block (used by paginated lists). */
export async function apiList<T>(
  path: string,
  options: RequestOptions = {}
): Promise<{ data: T[]; meta: { total: number; page: number; limit: number; pages: number } }> {
  const token = getToken();
  const url = new URL(path.replace(/^\//, ""), `${BASE_URL.replace(/\/$/, "")}/`);
  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      signal: options.signal,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch {
    throw new ApiError(0, "Could not reach the server. Check your connection.");
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      (payload as { error?: string } | null)?.error ?? `Request failed (${response.status}).`;
    throw new ApiError(response.status, message);
  }

  return payload as { data: T[]; meta: { total: number; page: number; limit: number; pages: number } };
}

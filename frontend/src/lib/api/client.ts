/**
 * Thin fetch wrapper for the backend API.
 *
 * Attaches the auth token, unwraps the `{ data }` envelope, and turns non-2xx
 * responses into thrown Errors carrying the server's message — so every call
 * site can rely on try/catch instead of checking status codes.
 */

// Falls back to the deployed backend so the hosted frontend works even without
// a NEXT_PUBLIC_API_URL env var set on Vercel. For local dev, set
// NEXT_PUBLIC_API_URL=http://localhost:4000 in .env.local to override.
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://schoolmanagement-j8fn.onrender.com";

const TOKEN_KEY = "schooldeck.token";
const REFRESH_KEY = "schooldeck.refresh";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);
  else window.localStorage.removeItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_KEY);
}

export function setRefreshToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) window.localStorage.setItem(REFRESH_KEY, token);
  else window.localStorage.removeItem(REFRESH_KEY);
}

export function clearTokens() {
  setToken(null);
  setRefreshToken(null);
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
  /** Internal: prevents infinite retry loops on 401. */
  _isRetry?: boolean;
}

/** Attempts to get a new access token using the stored refresh token.
 *  Returns true and updates localStorage on success, false otherwise. */
async function tryRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const url = new URL("api/auth/refresh", `${BASE_URL.replace(/\/$/, "")}/`);
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) { setRefreshToken(null); return false; }
    const data = await res.json() as { token: string; refreshToken: string };
    setToken(data.token);
    setRefreshToken(data.refreshToken);
    return true;
  } catch {
    return false;
  }
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
    // On 401, try once to refresh the access token, then retry the original request.
    if (response.status === 401 && !options._isRetry) {
      const refreshed = await tryRefresh();
      if (refreshed) {
        return apiRequest<T>(path, { ...options, _isRetry: true });
      }
    }
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

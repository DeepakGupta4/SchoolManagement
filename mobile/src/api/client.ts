import { API_URL } from "@/config";
import { getToken, getRefresh, setToken, setRefresh } from "./tokens";

/** Error carrying the HTTP status so screens can react (e.g. 401). */
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface Options {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  _retry?: boolean;
}

/** Swaps the refresh token for a fresh access token. Returns true on success. */
async function tryRefresh(): Promise<boolean> {
  const refreshToken = await getRefresh();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      await setRefresh(null);
      return false;
    }
    const data = (await res.json()) as { token: string; refreshToken: string };
    await setToken(data.token);
    await setRefresh(data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

/** Single fetch wrapper: injects the token, unwraps `{ data }`, refreshes on 401. */
export async function api<T>(path: string, opts: Options = {}): Promise<T> {
  const token = await getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: opts.method ?? "GET",
      headers: {
        ...(opts.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Can't reach the server. Check your connection.");
  }

  if (res.status === 401 && !opts._retry && (await tryRefresh())) {
    return api<T>(path, { ...opts, _retry: true });
  }

  if (res.status === 204) return undefined as T;
  const payload = (await res.json().catch(() => null)) as
    | { data?: T; error?: string }
    | null;

  if (!res.ok) throw new ApiError(res.status, payload?.error ?? `Request failed (${res.status}).`);
  return (payload && "data" in payload ? payload.data : payload) as T;
}

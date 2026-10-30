import { API_URL } from "@/config";
import { api, ApiError } from "./client";
import { setToken, setRefresh, clearTokens, getRefresh } from "./tokens";

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  twoFactorEnabled?: boolean;
}

/** Either the signed-in user, or a signal that a 2FA code is still needed. */
export type LoginResult = { twoFactorRequired: true } | { user: AppUser };

export async function login(email: string, password: string, code?: string): Promise<LoginResult> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, code }),
  });
  const data = (await res.json().catch(() => null)) as {
    token?: string;
    refreshToken?: string;
    user?: AppUser;
    twoFactorRequired?: boolean;
    error?: string;
  } | null;

  if (!res.ok) throw new ApiError(res.status, data?.error ?? "Could not sign in.");
  if (data?.twoFactorRequired) return { twoFactorRequired: true };

  await setToken(data?.token ?? null);
  await setRefresh(data?.refreshToken ?? null);
  return { user: data!.user as AppUser };
}

export async function fetchMe(): Promise<AppUser> {
  const r = await api<{ user: AppUser }>("/api/auth/me");
  return r.user;
}

/** Update the signed-in user's own name / avatar (PATCH /api/auth/me → { user }). */
export async function updateMe(body: { name?: string; avatar?: string }): Promise<AppUser> {
  const r = await api<{ user: AppUser }>("/api/auth/me", { method: "PATCH", body });
  return r.user;
}

/** Change own password; does NOT log the caller out. Wrong current → 400 ApiError. */
export const changeMyPassword = (body: { currentPassword: string; newPassword: string }) =>
  api<{ ok: boolean }>("/api/auth/me/password", { method: "PATCH", body });

export async function logout() {
  const refreshToken = await getRefresh();
  try {
    if (refreshToken) await api("/api/auth/logout", { method: "POST", body: { refreshToken } });
  } catch {
    /* ignore — clear locally regardless */
  }
  await clearTokens();
}

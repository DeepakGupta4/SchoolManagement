import { apiRequest, setToken, setRefreshToken, getRefreshToken, clearTokens } from "./client";
import type { User } from "@/types";

interface LoginResponse {
  token?: string;
  refreshToken?: string;
  user?: User;
  /** Set when 2FA is on and no code was supplied — the client must ask for one. */
  twoFactorRequired?: boolean;
}

/** Either the signed-in user, or a signal that a 2FA code is still needed. */
export type LoginResult = { twoFactorRequired: true } | { user: User };

export async function login(email: string, password: string, code?: string): Promise<LoginResult> {
  const result = await apiRequest<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: { email, password, code },
  });

  if (result.twoFactorRequired) return { twoFactorRequired: true };

  setToken(result.token ?? null);
  setRefreshToken(result.refreshToken ?? null);
  return { user: result.user as User };
}

/* -------- Two-factor authentication -------- */

export async function get2faStatus() {
  return apiRequest<{ enabled: boolean }>("/api/auth/2fa/status");
}
export async function setup2fa() {
  return apiRequest<{ secret: string; otpauthUri: string }>("/api/auth/2fa/setup", { method: "POST" });
}
export async function enable2fa(code: string) {
  return apiRequest<{ enabled: boolean }>("/api/auth/2fa/enable", { method: "POST", body: { code } });
}
export async function disable2fa(code: string) {
  return apiRequest<{ enabled: boolean }>("/api/auth/2fa/disable", { method: "POST", body: { code } });
}

/** Updates the signed-in user's own display name; returns the refreshed user. */
export async function updateMyName(name: string): Promise<User> {
  const result = await apiRequest<{ user: User }>("/api/auth/me", {
    method: "PATCH",
    body: { name },
  });
  return result.user;
}

/** Updates the signed-in user's own basic profile (display name and/or photo). */
export async function updateMyProfile(patch: { name?: string; avatar?: string }): Promise<User> {
  const result = await apiRequest<{ user: User }>("/api/auth/me", {
    method: "PATCH",
    body: patch,
  });
  return result.user;
}

/** Changes the signed-in user's own password (the current one is verified server-side). */
export async function changeMyPassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiRequest("/api/auth/me/password", {
    method: "PATCH",
    body: { currentPassword, newPassword },
  });
}

/** Resolves the signed-in user from a stored token, or null if it's invalid. */
export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const result = await apiRequest<{ user: User }>("/api/auth/me");
    return result.user;
  } catch {
    clearTokens();
    return null;
  }
}

export async function logout() {
  const refreshToken = getRefreshToken();
  clearTokens();
  // Best-effort: tell the server to invalidate the refresh token.
  if (refreshToken) {
    try {
      await apiRequest("/api/auth/logout", { method: "POST", body: { refreshToken } });
    } catch { /* ignore */ }
  }
}

export async function forgotPassword(email: string): Promise<void> {
  await apiRequest("/api/auth/forgot-password", { method: "POST", body: { email } });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await apiRequest("/api/auth/reset-password", { method: "POST", body: { token, newPassword } });
}

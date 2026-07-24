import { apiRequest, setToken } from "./client";
import type { User } from "@/types";

interface LoginResponse {
  token: string;
  user: User;
}

/**
 * Signs in and stores the token.
 *
 * The login endpoint answers with `{ token, user }` at the top level rather
 * than inside a `data` envelope, so the raw response is read here.
 */
export async function login(email: string, password: string): Promise<User> {
  const result = await apiRequest<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });

  setToken(result.token);
  return result.user;
}

/** Resolves the signed-in user from a stored token, or null if it's invalid. */
export async function fetchCurrentUser(): Promise<User | null> {
  try {
    const result = await apiRequest<{ user: User }>("/api/auth/me");
    return result.user;
  } catch {
    // An expired or tampered token is indistinguishable here — either way the
    // session is over, so clear it rather than leaving a broken token behind.
    setToken(null);
    return null;
  }
}

export function logout() {
  setToken(null);
}

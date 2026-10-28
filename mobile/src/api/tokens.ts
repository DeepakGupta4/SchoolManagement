import * as SecureStore from "expo-secure-store";

/** Access + refresh tokens, kept in the device keychain (never plain storage). */
const ACCESS = "sd_access_token";
const REFRESH = "sd_refresh_token";

export const getToken = () => SecureStore.getItemAsync(ACCESS);
export const getRefresh = () => SecureStore.getItemAsync(REFRESH);

export async function setToken(v: string | null) {
  if (v) await SecureStore.setItemAsync(ACCESS, v);
  else await SecureStore.deleteItemAsync(ACCESS);
}

export async function setRefresh(v: string | null) {
  if (v) await SecureStore.setItemAsync(REFRESH, v);
  else await SecureStore.deleteItemAsync(REFRESH);
}

export async function clearTokens() {
  await Promise.all([setToken(null), setRefresh(null)]);
}

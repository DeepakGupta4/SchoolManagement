import { apiRequest, apiList, ApiError } from "./client";
import type { Resource, ResourceRecord } from "./createResource";

/**
 * Real-backend twin of `createResource`. Exposes the exact same `Resource`
 * surface (list/get/create/update/remove) so a module can switch from the
 * in-memory mock to the live API by changing only this one call — every page,
 * hook and type keeps working unchanged.
 *
 * `list(filters)` forwards the filter object as query params; the backend's
 * CRUD router applies `search` + its declared filter fields and returns the
 * tenant-scoped rows.
 */
export function createApiResource<
  T extends ResourceRecord,
  F = Record<string, unknown>,
  G extends keyof T = never,
>(basePath: string): Resource<T, F, G> {
  return {
    async list(filters) {
      const query: Record<string, string> = {};
      if (filters) {
        for (const [key, value] of Object.entries(filters as Record<string, unknown>)) {
          if (value !== undefined && value !== null && value !== "") query[key] = String(value);
        }
      }
      const res = await apiList<T>(basePath, { query });
      return res.data;
    },

    async get(id) {
      try {
        return await apiRequest<T>(`${basePath}/${id}`);
      } catch (e) {
        // Match the mock's contract: a missing row is null, not an error.
        if (e instanceof ApiError && e.status === 404) return null;
        throw e;
      }
    },

    async create(values) {
      return apiRequest<T>(basePath, { method: "POST", body: values });
    },

    async update(id, values) {
      return apiRequest<T>(`${basePath}/${id}`, { method: "PUT", body: values });
    },

    async remove(id) {
      await apiRequest<void>(`${basePath}/${id}`, { method: "DELETE" });
    },

    // No-op: real data isn't reset from the client.
    reset() {},
  };
}

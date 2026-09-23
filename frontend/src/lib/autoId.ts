/**
 * Auto-generates the next unique code-style ID for a record type, e.g.
 * "TCH001" for teachers or "STF001" for staff. It reads the trailing number of
 * every existing ID, takes the highest, and returns the prefix + next number —
 * guaranteed not to collide with any ID already in use.
 *
 * Mirrors the admission-number logic in StudentFormModal so every "unique ID"
 * across the app is derived the same way and the operator never types one.
 */
export function nextCodeId(prefix: string, existingIds: readonly (string | undefined)[], pad = 3): string {
  const used = new Set(
    existingIds.map((id) => (id ?? "").trim()).filter(Boolean)
  );

  let max = 0;
  for (const id of existingIds) {
    const m = String(id ?? "").match(/(\d+)\s*$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }

  let n = Math.max(max, used.size) + 1;
  let candidate = `${prefix}${String(n).padStart(pad, "0")}`;
  while (used.has(candidate)) {
    n += 1;
    candidate = `${prefix}${String(n).padStart(pad, "0")}`;
  }
  return candidate;
}

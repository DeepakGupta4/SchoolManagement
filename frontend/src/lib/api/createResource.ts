/**
 * Factory for the in-memory mock backends every module uses.
 *
 * Each resource gets the same async, latency-simulated CRUD surface, so the UI
 * is forced to handle loading and error states properly. When a real API lands,
 * only the bodies here change — every call site keeps working.
 */

export interface ResourceRecord {
  id: string;
}

/**
 * `G` names the fields `generate` stamps on insert. Listing them keeps
 * `create` honest: callers must not be forced to invent a value the server
 * owns, but every other field stays required.
 */
export interface ResourceConfig<T extends ResourceRecord, F, G extends keyof T = never> {
  /** Short prefix for generated ids, e.g. "book" -> "book_a1b2c3d". */
  idPrefix: string;
  /** Initial rows. Cloned, so the caller's array is never mutated. */
  seed: T[];
  /**
   * Returns false to reject a row. Called once per row per list() call.
   * Keep it pure — it runs on every keystroke of a debounced search.
   */
  matches: (row: T, filters: F) => boolean;
  /**
   * Fields that must stay unique (e.g. "isbn", "employeeId", "code"). Create
   * and update reject duplicates with a readable message. Pass several when a
   * row has more than one natural key — guarding only one lets duplicates in
   * through the other.
   */
  uniqueBy?: { field: keyof T; label: string } | { field: keyof T; label: string }[];
  /** Values the server would compute; merged into every newly created row. */
  defaults?: Partial<T>;
  /**
   * Per-record values the server would stamp at insert time — reference
   * numbers, gate passes, certificate codes. Unlike `defaults` this runs once
   * per create, so each row gets a distinct value. Receives the current row
   * count so sequences can continue from the seed.
   * Anything the caller passes in explicitly still wins.
   */
  generate?: (count: number) => Pick<T, G>;
}

export interface Resource<T extends ResourceRecord, F, G extends keyof T = never> {
  list: (filters?: F) => Promise<T[]>;
  get: (id: string) => Promise<T | null>;
  create: (values: Omit<T, "id" | G>) => Promise<T>;
  update: (id: string, values: Partial<Omit<T, "id">>) => Promise<T>;
  remove: (id: string) => Promise<void>;
  /** Restores the seed data. Only for tests and story fixtures. */
  reset: () => void;
}

/**
 * Simulated round-trip. Kept deliberately small: it exists so loading and
 * error states stay exercised during development, NOT to imitate a slow
 * server. Anything above ~100ms on a read makes every page feel sluggish,
 * because the user pays it on each navigation.
 *
 * Reads are near-instant; writes keep a touch more so the saving state on a
 * submit button is actually visible.
 */
const READ_LATENCY_MS = 60;
const WRITE_LATENCY_MS = 180;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function createResource<
  T extends ResourceRecord,
  F = Record<string, unknown>,
  G extends keyof T = never,
>(config: ResourceConfig<T, F, G>): Resource<T, F, G> {
  const { idPrefix, seed, matches, uniqueBy, defaults, generate } = config;

  let rows: T[] = seed.map((row) => ({ ...row }));

  // Monotonic issue counter for `generate`. It must NOT be derived from
  // rows.length: deleting a record would wind it back and the next create
  // would reissue a reference number that is already printed on a document.
  let issued = seed.length;

  const nextId = () => `${idPrefix}_${Math.random().toString(36).slice(2, 9)}`;

  const uniqueKeys = uniqueBy ? (Array.isArray(uniqueBy) ? uniqueBy : [uniqueBy]) : [];

  /** Checks every declared natural key, skipping ones the caller didn't supply. */
  const assertUnique = (values: Partial<T>, ignoreId?: string) => {
    for (const { field, label } of uniqueKeys) {
      const value = values[field];
      if (value === undefined) continue;
      const clash = rows.some((row) => row[field] === value && row.id !== ignoreId);
      if (clash) throw new Error(`${label} "${String(value)}" is already in use.`);
    }
  };

  return {
    async list(filters) {
      await delay(READ_LATENCY_MS);
      if (!filters) return [...rows];
      return rows.filter((row) => matches(row, filters));
    },

    async get(id) {
      await delay(READ_LATENCY_MS);
      return rows.find((row) => row.id === id) ?? null;
    },

    async create(values) {
      await delay(WRITE_LATENCY_MS);

      const record = {
        ...defaults,
        ...generate?.(issued),
        ...values,
        id: nextId(),
      } as T;

      // Checked on the assembled record, not the raw input, so generated keys
      // (reference numbers) are validated too.
      assertUnique(record);

      issued += 1;
      rows = [record, ...rows];
      return record;
    },

    async update(id, values) {
      await delay(WRITE_LATENCY_MS);

      const existing = rows.find((row) => row.id === id);
      if (!existing) throw new Error("Record not found.");
      assertUnique(values as Partial<T>, id);

      const updated = { ...existing, ...values, id } as T;
      rows = rows.map((row) => (row.id === id ? updated : row));
      return updated;
    },

    async remove(id) {
      await delay(WRITE_LATENCY_MS);
      if (!rows.some((row) => row.id === id)) throw new Error("Record not found.");
      rows = rows.filter((row) => row.id !== id);
    },

    reset() {
      rows = seed.map((row) => ({ ...row }));
    },
  };
}

/** Case-insensitive "does any of these fields contain the query" helper. */
export function textMatch(query: string | undefined, ...fields: (string | number | undefined)[]) {
  const q = query?.trim().toLowerCase();
  if (!q) return true;
  return fields.some((field) => String(field ?? "").toLowerCase().includes(q));
}

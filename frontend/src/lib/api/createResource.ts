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

export interface ResourceConfig<T extends ResourceRecord, F> {
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
   * Field that must stay unique (e.g. "isbn", "employeeId"). Create and update
   * reject duplicates with a readable message.
   */
  uniqueBy?: { field: keyof T; label: string };
  /** Values the server would compute; merged into every newly created row. */
  defaults?: Partial<T>;
}

export interface Resource<T extends ResourceRecord, F> {
  list: (filters?: F) => Promise<T[]>;
  get: (id: string) => Promise<T | null>;
  create: (values: Omit<T, "id">) => Promise<T>;
  update: (id: string, values: Partial<Omit<T, "id">>) => Promise<T>;
  remove: (id: string) => Promise<void>;
  /** Restores the seed data. Only for tests and story fixtures. */
  reset: () => void;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function createResource<T extends ResourceRecord, F = Record<string, unknown>>(
  config: ResourceConfig<T, F>
): Resource<T, F> {
  const { idPrefix, seed, matches, uniqueBy, defaults } = config;

  let rows: T[] = seed.map((row) => ({ ...row }));

  const nextId = () => `${idPrefix}_${Math.random().toString(36).slice(2, 9)}`;

  const assertUnique = (value: unknown, ignoreId?: string) => {
    if (!uniqueBy) return;
    const clash = rows.some(
      (row) => row[uniqueBy.field] === value && row.id !== ignoreId
    );
    if (clash) throw new Error(`${uniqueBy.label} "${String(value)}" is already in use.`);
  };

  return {
    async list(filters) {
      await delay(400);
      if (!filters) return [...rows];
      return rows.filter((row) => matches(row, filters));
    },

    async get(id) {
      await delay(250);
      return rows.find((row) => row.id === id) ?? null;
    },

    async create(values) {
      await delay(400);
      if (uniqueBy) assertUnique((values as Partial<T>)[uniqueBy.field]);

      const record = { ...defaults, ...values, id: nextId() } as T;
      rows = [record, ...rows];
      return record;
    },

    async update(id, values) {
      await delay(400);

      const existing = rows.find((row) => row.id === id);
      if (!existing) throw new Error("Record not found.");
      if (uniqueBy && uniqueBy.field in values) {
        assertUnique((values as Partial<T>)[uniqueBy.field], id);
      }

      const updated = { ...existing, ...values, id } as T;
      rows = rows.map((row) => (row.id === id ? updated : row));
      return updated;
    },

    async remove(id) {
      await delay(300);
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

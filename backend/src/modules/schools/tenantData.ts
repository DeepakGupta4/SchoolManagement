import mongoose from "mongoose";

/**
 * Deletes every document keyed to a school across ALL collections — the single
 * place tenant data is swept. Used by both the danger-zone data reset and the
 * super-admin hard-delete, so neither leaves rows orphaned in the ~45 collections
 * that carry a schoolId (students, fees, payments, marks, attendance, documents,
 * notifications, …).
 *
 * `keep` names collections to leave untouched: the data-reset passes
 * users/schools/schoolrequests (the logins + the school record survive, only the
 * data is wiped); the hard-delete passes nothing, so the school, its logins and
 * its request go too.
 *
 * Every query is scoped to `{ schoolId }`, so one tenant's delete can never touch
 * another tenant's rows — and the platform super-admin (schoolId "platform") is
 * never matched by a real tenant's id.
 */
export async function sweepSchoolCollections(
  schoolId: string,
  keep: Set<string> = new Set()
): Promise<{ removed: number; cleared: Record<string, number> }> {
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database not connected");

  const collections = await db.listCollections().toArray();
  const cleared: Record<string, number> = {};
  let removed = 0;

  for (const c of collections) {
    if (keep.has(c.name)) continue;
    const result = await db.collection(c.name).deleteMany({ schoolId });
    if (result.deletedCount) {
      cleared[c.name] = result.deletedCount;
      removed += result.deletedCount;
    }
  }

  return { removed, cleared };
}

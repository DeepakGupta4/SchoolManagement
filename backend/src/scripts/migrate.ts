import { pathToFileURL } from "url";
import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "../config/db.js";
// Side-effect import: pulls in every route module, which registers every Mongoose
// model. createApp() is never called, so no server starts — we just need the
// models on `mongoose.models` so we can read their declared indexes.
import "../app.js";

/**
 * One-off data migration: DEDUPE + INDEX SYNC.
 *
 * Why this exists
 * ---------------
 * ~24 models declare unique / compound-unique indexes, but Mongoose builds them
 * with autoIndex on boot. If a collection already holds rows that violate a new
 * unique index, the build throws E11000, Mongoose emits it on the model's 'index'
 * event and — with no listener — SWALLOWS it: the index is silently skipped and
 * uniqueness is never enforced. The CRUD layer relies solely on that index to
 * block duplicates, so where a build failed, duplicate-prevention is an illusion.
 *
 * This script finds those duplicates, removes the safe ones, reports the sensitive
 * ones for a human to resolve, then runs syncIndexes() so the real indexes get
 * built (and stale/orphaned indexes — e.g. the old attendance key — get dropped).
 *
 * Safety
 * ------
 *  - DRY RUN BY DEFAULT. It changes nothing unless you pass `--apply`.
 *  - It only AUTO-DELETES duplicates from operational/config collections, where a
 *    duplicate is a data-entry artifact and keeping one canonical row is safe.
 *  - Identity & financial data (students, teachers, staff, users, fee accounts,
 *    payments, payroll, roles, the school record, admission/job applications) is
 *    NEVER auto-deleted — those duplicates are only REPORTED, with their keys, so
 *    you can merge/resolve them by hand (two "same admission number" students may
 *    be a real double-enrolment or a typo — only a human should decide).
 *
 * Run
 * ---
 *   Set MONGODB_URI (your Atlas string) in backend/.env first, otherwise this runs
 *   against a throwaway in-memory DB and does nothing useful.
 *     npm run migrate              # dry run — just report
 *     npm run migrate -- --apply   # delete safe dups + sync indexes
 *
 *   After a clean apply you can set MONGO_AUTOINDEX=false in the environment to stop
 *   the per-boot index pass (syncIndexes here, or the next deploy, keeps them fresh).
 */

// Operational / config collections: a duplicate here is an accidental double-entry,
// so keeping the newest canonical row and deleting the rest is safe. Attendance is
// special — a real teacher submission ("manual") always beats the auto-absent
// sweep ("auto"); otherwise newest wins.
export const DELETE_SAFE = new Set<string>([
  "SchoolClass",
  "Subject",
  "Exam",
  "ScheduledExam",
  "Timetable",
  "FeeStructure",
  "Department",
  "StudentDocument",
  "Substitution",
  "Mark",
  "Attendance",
  "StaffAttendance",
]);

type DupDoc = { id: unknown; source?: string; updatedAt?: Date; createdAt?: Date };
type DupGroup = { _id: Record<string, unknown>; count: number; docs: DupDoc[] };

/** Orders a duplicate group's docs so [0] is the one to KEEP. */
export function canonicalFirst(modelName: string) {
  return (a: DupDoc, b: DupDoc) => {
    if (modelName === "Attendance") {
      const am = a.source === "manual" ? 1 : 0;
      const bm = b.source === "manual" ? 1 : 0;
      if (am !== bm) return bm - am; // a real submission beats an auto row
    }
    const at = +new Date(a.updatedAt ?? a.createdAt ?? 0);
    const bt = +new Date(b.updatedAt ?? b.createdAt ?? 0);
    if (at !== bt) return bt - at; // newest first
    return String(b.id).localeCompare(String(a.id)); // stable tiebreak
  };
}

export interface MigrateResult {
  groups: number;
  extra: number;
  deleted: number;
  blocked: string[];
  synced: number;
  failed: string[];
}

/** Runs the dedupe (+ index sync when apply) against the already-connected DB. */
export async function runMigrate(apply: boolean): Promise<MigrateResult> {
  console.log(
    apply
      ? "\nMODE: APPLY — will delete safe-collection duplicates and sync indexes.\n"
      : "\nMODE: DRY RUN — reporting only. Re-run with `-- --apply` to make changes.\n"
  );

  const models = Object.values(mongoose.models).sort((a, b) =>
    a.modelName.localeCompare(b.modelName)
  );

  let totalGroups = 0;
  let totalExtra = 0;
  let totalDeleted = 0;
  const blocked: string[] = []; // report-only indexes that still have duplicates

  for (const model of models) {
    const indexes = model.schema.indexes() as [Record<string, unknown>, Record<string, unknown>][];
    const uniqueIndexes = indexes.filter(([, opts]) => opts && opts.unique);

    for (const [spec, opts] of uniqueIndexes) {
      const keyFields = Object.keys(spec).filter((k) => spec[k] === 1 || spec[k] === -1);
      if (!keyFields.length) continue;

      const collation = opts.collation as { strength?: number } | undefined;
      const caseInsensitive = !!(collation && (collation.strength ?? 3) <= 2);
      const partial = opts.partialFilterExpression as Record<string, unknown> | undefined;

      // Group by the index key. For a case-insensitive (collation strength ≤ 2)
      // index, lower-case the string key fields so "Class 6" and "class 6" collide
      // exactly as the live index would.
      const groupId: Record<string, unknown> = {};
      for (const f of keyFields) {
        const isString =
          (model.schema.path(f) as { instance?: string } | undefined)?.instance === "String";
        groupId[f] = caseInsensitive && isString ? { $toLower: { $ifNull: [`$${f}`, ""] } } : `$${f}`;
      }

      const pipeline: Record<string, unknown>[] = [];
      if (partial) pipeline.push({ $match: partial });
      pipeline.push({
        $group: {
          _id: groupId,
          count: { $sum: 1 },
          docs: { $push: { id: "$_id", source: "$source", updatedAt: "$updatedAt", createdAt: "$createdAt" } },
        },
      });
      pipeline.push({ $match: { count: { $gt: 1 } } });

      const groups = (await model
        .aggregate<DupGroup>(pipeline as unknown as mongoose.PipelineStage[])
        .option({ allowDiskUse: true })) as DupGroup[];
      if (!groups.length) continue;

      const extra = groups.reduce((n, g) => n + (g.count - 1), 0);
      totalGroups += groups.length;
      totalExtra += extra;

      const safe = DELETE_SAFE.has(model.modelName);
      const label =
        keyFields.join("+") + (caseInsensitive ? " ~ci" : "") + (partial ? " [partial]" : "");
      console.log(
        `  ${model.modelName} [${model.collection.name}]  ${groups.length} dup group(s), ${extra} extra row(s)  on {${label}}` +
          (safe ? "" : "   → REPORT ONLY (resolve by hand)")
      );
      for (const g of groups.slice(0, 3)) {
        console.log(`       e.g. ${JSON.stringify(g._id)}  ×${g.count}`);
      }
      if (groups.length > 3) console.log(`       …and ${groups.length - 3} more group(s)`);

      if (!safe) {
        blocked.push(`${model.collection.name} {${keyFields.join(",")}}`);
        continue;
      }

      if (apply) {
        const toDelete: unknown[] = [];
        const cmp = canonicalFirst(model.modelName);
        for (const g of groups) {
          const ordered = [...g.docs].sort(cmp);
          for (const d of ordered.slice(1)) toDelete.push(d.id); // keep ordered[0]
        }
        if (toDelete.length) {
          const r = await model.deleteMany({ _id: { $in: toDelete } });
          totalDeleted += r.deletedCount ?? 0;
          console.log(`       → deleted ${r.deletedCount} duplicate row(s), kept ${groups.length} canonical.`);
        }
      }
    }
  }

  console.log(`\nDuplicates found: ${totalGroups} group(s), ${totalExtra} extra row(s).`);
  if (apply) console.log(`Deleted: ${totalDeleted} row(s) from safe collections.`);

  if (blocked.length) {
    console.log(
      `\n⚠  ${blocked.length} identity/financial index(es) still have duplicates (NOT auto-deleted).` +
        `\n   Resolve these by hand, then re-run — their unique index can't build until they're clean:`
    );
    for (const b of blocked) console.log(`     - ${b}`);
  }

  let synced = 0;
  const failed: string[] = [];
  if (apply) {
    console.log(`\nSyncing indexes (builds declared indexes, drops orphaned ones)…`);
    for (const model of models) {
      try {
        await model.syncIndexes();
        synced++;
      } catch (e) {
        failed.push(`${model.modelName}: ${String((e as Error).message).split("\n")[0]}`);
      }
    }
    console.log(`  synced ${synced} model(s).`);
    if (failed.length) {
      console.log(`  ${failed.length} model(s) could NOT sync (remaining duplicates — clean them, then re-run):`);
      for (const f of failed) console.log(`     - ${f}`);
    }
  } else {
    console.log(`\n(DRY RUN — nothing changed. Re-run with \`npm run migrate -- --apply\` to clean + sync.)`);
  }

  return { groups: totalGroups, extra: totalExtra, deleted: totalDeleted, blocked, synced, failed };
}

async function main() {
  const apply = process.argv.includes("--apply");
  const mode = await connectDatabase();
  console.log(`Connected — ${mode}`);
  if (mode.includes("in-memory")) {
    console.warn(
      "\n⚠  Running against an in-memory database — there is no live data to migrate.\n" +
        "   Set MONGODB_URI in backend/.env to point at Atlas, then re-run.\n"
    );
  }
  await runMigrate(apply);
  await disconnectDatabase();
  console.log("\nDone.");
}

// Run only when invoked directly (`tsx src/scripts/migrate.ts`), not when imported
// by a test that exercises runMigrate() against its own connection.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error("Migrate failed:", err);
    process.exit(1);
  });
}

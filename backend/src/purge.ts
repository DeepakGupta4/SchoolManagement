import mongoose from "mongoose";
import { connectDatabase, disconnectDatabase } from "./config/db.js";

/**
 * Clears all tenant DOMAIN data (students, teachers, staff, fees, classes,
 * exams, and every other module) so the school starts from a clean slate.
 *
 * Auth and platform state are preserved, so you stay logged in and your school
 * record + approvals survive.
 *
 * Run: `npm run purge`
 *   - To clear the LIVE database, set MONGODB_URI (e.g. your Atlas string) in
 *     .env first — otherwise this runs against a throwaway in-memory DB and
 *     clears nothing useful.
 */

// Collections to preserve — everything else is emptied.
const KEEP = new Set(["users", "schools", "schoolrequests", "notifications"]);

async function main() {
  const mode = await connectDatabase();
  console.log(`Connected — ${mode}`);

  if (mode.includes("in-memory")) {
    console.warn(
      "\n⚠  Running against an in-memory database — nothing persistent to clear.\n" +
        "   Set MONGODB_URI in .env to point at your real database, then re-run.\n"
    );
  }

  const db = mongoose.connection.db;
  if (!db) throw new Error("No database connection");

  const collections = await db.listCollections().toArray();
  let removed = 0;

  for (const c of collections) {
    if (KEEP.has(c.name)) {
      console.log(`  keep     ${c.name}`);
      continue;
    }
    const res = await db.collection(c.name).deleteMany({});
    removed += res.deletedCount ?? 0;
    console.log(`  cleared  ${c.name} (${res.deletedCount ?? 0})`);
  }

  console.log(`\nDone. Removed ${removed} document(s) across domain collections.`);
  await disconnectDatabase();
}

main().catch((err) => {
  console.error("Purge failed:", err);
  process.exit(1);
});

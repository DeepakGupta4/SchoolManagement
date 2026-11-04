import mongoose from "mongoose";
import { env } from "./env.js";

/**
 * Connects to MongoDB.
 *
 * With MONGODB_URI set (Atlas, a local mongod, anything) that is used directly.
 * Without it — development only — an in-memory MongoDB is started so the API
 * runs with no database install. That instance is wiped on every restart, which
 * is why `env.ts` refuses to boot production without a real URI.
 */
let memoryServer: { stop: () => Promise<boolean> } | null = null;

export async function connectDatabase(): Promise<string> {
  mongoose.set("strictQuery", true);
  // Index builds run automatically on boot (autoIndex). After the live data has
  // been deduped and indexes synced (`npm run migrate -- --apply`), set
  // MONGO_AUTOINDEX=false in the environment to stop the per-boot ensureIndexes()
  // pass. Unset (the default) keeps the current behaviour, so nothing regresses.
  mongoose.set("autoIndex", process.env.MONGO_AUTOINDEX !== "false");

  let uri = env.MONGODB_URI;
  let mode = "MONGODB_URI";

  if (!uri) {
    // Imported lazily so the dev-only dependency never loads in production.
    // A REPLICA SET, not a standalone: fee collection writes the receipt and
    // the ledger inside a transaction, and standalone MongoDB cannot do that.
    // Atlas is already a replica set, so both paths behave identically.
    const { MongoMemoryReplSet } = await import("mongodb-memory-server");
    const server = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
    memoryServer = server;
    uri = server.getUri();
    mode = "in-memory replica set (development only — data is lost on restart)";
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
  return mode;
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.connection.close();
  if (memoryServer) await memoryServer.stop();
}

/**
 * Surfaces silent unique-index build failures. Mongoose builds indexes in the
 * background after connecting; if a unique index can't build because the
 * collection already holds duplicate rows, the error is emitted on the model's
 * 'index' event and, with no listener, swallowed — uniqueness is silently NOT
 * enforced. Awaiting each model's init() and logging rejections makes that
 * visible in the logs. Fire-and-forget from boot so it never delays startup;
 * no-op when autoIndex is disabled, since then nothing is being built here.
 */
export async function reportIndexBuilds(): Promise<void> {
  if (process.env.MONGO_AUTOINDEX === "false") return;
  const models = Object.values(mongoose.models);
  const results = await Promise.allSettled(models.map((m) => m.init()));
  let failures = 0;
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      failures++;
      const msg = String((r.reason as Error)?.message ?? r.reason).split("\n")[0];
      console.error(`[index] ${models[i]?.modelName ?? "?"}: ${msg}`);
    }
  });
  if (failures) {
    console.error(
      `[index] ${failures} unique index(es) failed to build — likely duplicate data. ` +
        "Run `npm run migrate` to dedupe + sync."
    );
  }
}

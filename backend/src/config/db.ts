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

  let uri = env.MONGODB_URI;
  let mode = "MONGODB_URI";

  if (!uri) {
    // Imported lazily so the dev-only dependency never loads in production.
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const server = await MongoMemoryServer.create();
    memoryServer = server;
    uri = server.getUri();
    mode = "in-memory (development only — data is lost on restart)";
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
  return mode;
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.connection.close();
  if (memoryServer) await memoryServer.stop();
}

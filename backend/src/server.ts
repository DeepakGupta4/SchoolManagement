import { createApp } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/db.js";
import { ensureSuperAdmin } from "./utils/ensureSuperAdmin.js";
import { env } from "./config/env.js";

async function start() {
  const mode = await connectDatabase();
  console.log(`Database connected — ${mode}`);

  // Guarantee a platform owner exists (real DB and in-memory alike).
  await ensureSuperAdmin();

  // The in-memory database is rebuilt per process, so a separately-run seed
  // would be invisible here. Seed at boot instead, but only in that mode —
  // a real database must never be written to on startup.
  if (!env.MONGODB_URI) {
    const { seedDatabase, DEMO_PASSWORD } = await import("./seed.js");
    await seedDatabase();
    console.log(`Demo sign-in: admin@springdale.edu / ${DEMO_PASSWORD}`);
  }

  const server = createApp().listen(env.PORT, () => {
    console.log(`API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  /**
   * Finish in-flight requests before exiting, and close the database after.
   * Without this a deploy restart can cut a request mid-write.
   */
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received — shutting down.`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
    // Don't hang forever if a connection refuses to close.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

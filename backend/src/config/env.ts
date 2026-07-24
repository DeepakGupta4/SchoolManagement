import "dotenv/config";
import { z } from "zod";

/**
 * Environment is validated once, at boot. A missing secret should stop the
 * process immediately rather than surface as a confusing 500 later.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number<number>().default(4000),

  /**
   * Mongo connection string. Optional in development: when absent the server
   * starts an in-memory MongoDB so the app runs with zero local setup. It is
   * REQUIRED in production — an ephemeral database there would silently lose
   * every record on restart.
   */
  MONGODB_URI: z.string().optional(),

  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),

  /** Comma-separated list of origins allowed to call the API. */
  CORS_ORIGINS: z.string().default("http://localhost:3000"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  • ${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");
  console.error(`Invalid environment configuration:\n${issues}\n`);
  process.exit(1);
}

const raw = parsed.data;

if (raw.NODE_ENV === "production" && !raw.MONGODB_URI) {
  console.error("MONGODB_URI is required in production — refusing to start on an in-memory database.");
  process.exit(1);
}

export const env = {
  ...raw,
  isProduction: raw.NODE_ENV === "production",
  corsOrigins: raw.CORS_ORIGINS.split(",").map((o) => o.trim()).filter(Boolean),
};

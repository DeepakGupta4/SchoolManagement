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

  /** Comma-separated list of origins allowed to call the API.
   * Defaults cover the admin app (3000) and the showcase site (5173) in dev. */
  CORS_ORIGINS: z.string().default("http://localhost:3000,http://localhost:5173"),

  /** Product name shown in emails and templates. */
  SOFTWARE_NAME: z.string().default("SchoolDeck"),

  /** Where an approval email tells the school to sign in. */
  APP_LOGIN_URL: z.string().default("http://localhost:3000/login"),

  /** Length of the free trial, in days. The backend is the sole authority. */
  TRIAL_DAYS: z.coerce.number<number>().min(1).default(7),

  /**
   * SMTP (Gmail app-password). Optional: when unset, emails are logged to the
   * console instead of sent, so the approval flow works before mail is set up.
   */
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  /**
   * A Super Admin is upserted at boot from these, so a fresh deployment always
   * has a platform owner who can approve schools. Optional — skipped if unset.
   */
  SUPER_ADMIN_EMAIL: z.string().optional(),
  SUPER_ADMIN_PASSWORD: z.string().optional(),
  SUPER_ADMIN_NAME: z.string().default("Platform Owner"),

  /**
   * Razorpay. Optional: without keys the payment endpoints report "not
   * configured" and schools activate via the Super Admin instead.
   */
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),

  /** Plan prices in paise (₹1 = 100 paise). */
  PLAN_MONTHLY_PRICE: z.coerce.number<number>().min(100).default(199900),
  PLAN_YEARLY_PRICE: z.coerce.number<number>().min(100).default(1999900),

  /**
   * Shared secret for the reminder cron endpoint. Set it and point an external
   * scheduler (Render Cron, cron-job.org) at POST /api/subscription/run-reminders
   * with header `x-cron-secret`. Unset = that endpoint is disabled.
   */
  CRON_SECRET: z.string().optional(),
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

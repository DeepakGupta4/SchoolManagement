import { connectDatabase, disconnectDatabase } from "./config/db.js";
import { User, hashPassword } from "./modules/auth/user.model.js";

/**
 * Seeds sign-in accounts only — no demo domain data.
 *
 * The school starts empty: classes, students, teachers, fees and every other
 * module are added by the user from the UI. This keeps a fresh install (and
 * the local in-memory dev database) clean so what you see is what you added.
 *
 * Safe to re-run: users are upserted by email, so it never duplicates.
 */

export const DEMO_PASSWORD = "springdale123";

const DEMO_USERS = [
  { name: "Rajesh Kumar", email: "admin@springdale.edu", role: "school_admin" as const },
  { name: "Sunita Menon", email: "principal@springdale.edu", role: "principal" as const },
  { name: "Priya Sharma", email: "priya.sharma@springdale.edu", role: "teacher" as const },
  { name: "Neha Verma", email: "accounts@springdale.edu", role: "accountant" as const },
  { name: "Mahesh Patel", email: "parent@springdale.edu", role: "parent" as const },
  { name: "Aarav Sharma", email: "aarav.sharma@springdale.edu", role: "student" as const },
  { name: "Ramesh Yadav", email: "driver@springdale.edu", role: "driver" as const },
];

export async function seedDatabase({ quiet = false } = {}) {
  const log = (msg: string) => {
    if (!quiet) console.log(msg);
  };

  for (const u of DEMO_USERS) {
    await User.findOneAndUpdate(
      { email: u.email },
      {
        $set: { name: u.name, role: u.role, schoolId: "school_1", isActive: true },
        $setOnInsert: { passwordHash: await hashPassword(DEMO_PASSWORD) },
      },
      { upsert: true, new: true }
    );
  }

  // A platform-level Super Admin (not tenant-scoped) so the school-approval
  // dashboard can be tried out in dev without configuring env credentials.
  await User.findOneAndUpdate(
    { email: "owner@schooldeck.in" },
    {
      $set: { name: "Platform Owner", role: "super_admin", schoolId: "platform", isActive: true },
      $setOnInsert: { passwordHash: await hashPassword(DEMO_PASSWORD) },
    },
    { upsert: true, new: true }
  );
  log(`  ${DEMO_USERS.length + 1} sign-in accounts ready (incl. super admin owner@schooldeck.in)`);
}

/** Standalone entry point: `npm run seed`. */
async function main() {
  const mode = await connectDatabase();
  console.log(`Connected — ${mode}`);
  await seedDatabase();
  console.log(`\nDemo password for every account: ${DEMO_PASSWORD}`);
  await disconnectDatabase();
}

// Only run when invoked directly, not when imported by the server.
if (process.argv[1]?.includes("seed")) {
  main().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
}

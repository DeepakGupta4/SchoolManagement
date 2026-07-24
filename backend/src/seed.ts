import { connectDatabase, disconnectDatabase } from "./config/db.js";
import { User, hashPassword } from "./modules/auth/user.model.js";
import { Student } from "./modules/students/student.model.js";

/**
 * Seeds demo accounts and students.
 *
 * Safe to re-run: users are upserted by email and students are only inserted
 * when the collection is empty, so it never duplicates or wipes real data.
 * Exported so the dev server can call it at boot — the in-memory database is
 * recreated per process, so a separately-run seed would not be visible to it.
 */

export const DEMO_PASSWORD = "springdale123";

const DEMO_USERS = [
  { name: "Rajesh Kumar", email: "admin@springdale.edu", role: "school_admin" as const },
  { name: "Sunita Menon", email: "principal@springdale.edu", role: "principal" as const },
  { name: "Priya Sharma", email: "priya.sharma@springdale.edu", role: "teacher" as const },
  { name: "Mahesh Patel", email: "parent@springdale.edu", role: "parent" as const },
  { name: "Aarav Sharma", email: "aarav.sharma@springdale.edu", role: "student" as const },
  { name: "Ramesh Yadav", email: "driver@springdale.edu", role: "driver" as const },
];

const FIRST = ["Aarav", "Ananya", "Vivaan", "Diya", "Ishaan", "Saanvi", "Kabir", "Myra", "Arjun", "Kiara", "Rohan", "Tara"];
const LAST = ["Sharma", "Verma", "Patel", "Gupta", "Singh", "Reddy", "Nair", "Iyer"];
const CLASSES = ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"];
const SECTIONS = ["A", "B", "C"];
const BLOOD = ["A+", "B+", "O+", "AB+"] as const;

function pick<T>(arr: readonly T[], i: number): T {
  return arr[i % arr.length]!;
}

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
  log(`  ${DEMO_USERS.length} demo users ready`);

  const existing = await Student.countDocuments();
  if (existing > 0) {
    log(`  students collection already has ${existing} records — skipped`);
    return;
  }

  const students = Array.from({ length: 24 }, (_, i) => {
    const firstName = pick(FIRST, i);
    const lastName = pick(LAST, i * 3 + 1);

    return {
      schoolId: "school_1",
      admissionNo: `ADM${2024001 + i}`,
      rollNo: String((i % 40) + 1),
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@springdale.edu`,
      phone: `9${810000000 + i * 137911}`,
      dateOfBirth: `${2008 + (i % 5)}-0${(i % 9) + 1}-1${i % 9}`,
      gender: i % 2 === 0 ? "male" : "female",
      bloodGroup: pick(BLOOD, i),
      className: pick(CLASSES, i * 5 + 2),
      section: pick(SECTIONS, i * 7 + 1),
      status: i % 9 === 0 ? "inactive" : "active",
      admissionDate: `${2019 + (i % 6)}-04-1${i % 9}`,
      address: `${10 + i}, Green Park, New Delhi`,
      guardian: {
        name: `${pick(FIRST, i * 2 + 3)} ${lastName}`,
        relation: i % 3 === 0 ? "Mother" : "Father",
        phone: `9${820000000 + i * 219731}`,
        email: `guardian${i}@gmail.com`,
        occupation: pick(["Business", "Engineer", "Doctor", "Teacher"], i),
      },
      attendancePercent: 62 + ((i * 7) % 38),
      performancePercent: 45 + ((i * 11) % 54),
      feeDue: i % 3 === 0 ? (i % 12) * 500 : 0,
    };
  });

  await Student.insertMany(students);
  log(`  inserted ${students.length} students`);
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

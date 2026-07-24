import { connectDatabase, disconnectDatabase } from "./config/db.js";
import { User, hashPassword } from "./modules/auth/user.model.js";
import { Student } from "./modules/students/student.model.js";
import { Teacher } from "./modules/teachers/teacher.model.js";
import { FeeAccount } from "./modules/fees/fee.model.js";

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

  // Each collection is seeded independently — an early return here once
  // skipped every collection after students, leaving them silently empty.
  await seedStudents(log);
  await seedTeachers(log);
  await seedFeeAccounts(log);
}

const FEE_HEADS = [
  { head: "Tuition", base: 24000 },
  { head: "Transport", base: 6000 },
  { head: "Lab", base: 1800 },
  { head: "Library", base: 900 },
  { head: "Sports", base: 1200 },
  { head: "Exam", base: 1500 },
];

/**
 * Builds one fee account per student. Derived from the students already in the
 * database rather than a separate fixture, so the two can never disagree.
 */
async function seedFeeAccounts(log: (msg: string) => void) {
  if ((await FeeAccount.countDocuments()) > 0) {
    log("  fee accounts already populated — skipped");
    return;
  }

  const students = await Student.find({ schoolId: "school_1" });
  if (students.length === 0) {
    log("  no students to bill — skipped fee accounts");
    return;
  }

  const accounts = students.map((s, i) => {
    const roll = (i * 17) % 100;
    // Roughly a third have paid in full, a third partly, a third barely.
    const paidRatio = roll > 66 ? 1 : roll > 33 ? 0.5 : 0.15;

    return {
      schoolId: "school_1",
      studentId: s._id,
      admissionNo: s.admissionNo,
      name: `${s.firstName} ${s.lastName}`,
      className: s.className,
      section: s.section,
      rollNo: s.rollNo,
      guardian: s.guardian.name,
      guardianPhone: s.guardian.phone,
      session: "2025-26",
      heads: FEE_HEADS.map(({ head, base }, h) => {
        // Transport only applies to students who use the bus.
        const billed = head === "Transport" && roll % 3 === 0 ? 0 : base;
        return {
          head,
          billed,
          paid: Math.round((billed * (h === 0 ? paidRatio : paidRatio > 0.9 ? 1 : 0)) / 100) * 100,
        };
      }),
      concession: roll % 7 === 0 ? 2000 : 0,
      lateFee: paidRatio < 0.5 ? 500 : 0,
      lastPaymentDate: paidRatio > 0.1 ? "2025-07-05" : null,
    };
  });

  await FeeAccount.insertMany(accounts);
  log(`  inserted ${accounts.length} fee accounts`);
}

async function seedStudents(log: (msg: string) => void) {
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

const T_FIRST = ["Priya", "Rahul", "Anita", "Suresh", "Kavita", "Amit", "Deepa", "Vikram", "Sunita", "Manoj", "Rekha", "Sanjay", "Nisha", "Alok"];
const SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Hindi", "History", "Geography", "Computer Science", "Physical Education"];
const DEPARTMENTS = ["Science", "Mathematics", "Languages", "Social Studies", "Computer Science", "Sports"];
const QUALIFICATIONS = ["M.Sc, B.Ed", "M.A, B.Ed", "Ph.D", "M.Tech", "B.Ed", "M.Com, B.Ed"];

async function seedTeachers(log: (msg: string) => void) {
  if ((await Teacher.countDocuments()) > 0) {
    log("  teachers collection already populated — skipped");
    return;
  }

  const teachers = Array.from({ length: 18 }, (_, i) => {
    const firstName = pick(T_FIRST, i);
    const lastName = pick(LAST, i * 3 + 2);
    const primary = pick(SUBJECTS, i);
    const roll = (i * 13) % 100;

    return {
      schoolId: "school_1",
      employeeId: `EMP${1001 + i}`,
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@springdale.edu`,
      phone: `9${820000000 + i * 219731}`,
      gender: i % 2 === 0 ? "female" : "male",
      dateOfBirth: `${1975 + (i % 18)}-0${(i % 9) + 1}-1${i % 9}`,
      joiningDate: `${2012 + (i % 12)}-0${(i % 9) + 1}-0${(i % 8) + 1}`,
      department: pick(DEPARTMENTS, i * 5 + 1),
      subjects: roll > 60 ? [primary, pick(SUBJECTS, i + 3)] : [primary],
      classes: [pick(CLASSES, i * 2), pick(CLASSES, i * 3 + 1)],
      qualification: pick(QUALIFICATIONS, i),
      experienceYears: 1 + (roll % 22),
      employmentType: roll > 85 ? "part-time" : roll > 78 ? "contract" : "full-time",
      status: roll > 88 ? "on-leave" : roll > 82 ? "inactive" : "active",
      address: `${20 + i}, Civil Lines, New Delhi`,
      salary: (35 + (roll % 60)) * 1000,
      isClassTeacher: i % 3 === 0,
      rating: Math.round((3.4 + (roll % 16) / 10) * 10) / 10,
      attendancePercent: 78 + (roll % 22),
      weeklyPeriods: 12 + (roll % 20),
    };
  });

  await Teacher.insertMany(teachers);
  log(`  inserted ${teachers.length} teachers`);
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

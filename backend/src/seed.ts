import { connectDatabase, disconnectDatabase } from "./config/db.js";
import { User, hashPassword } from "./modules/auth/user.model.js";
import { Student } from "./modules/students/student.model.js";
import { Teacher } from "./modules/teachers/teacher.model.js";
import { FeeAccount } from "./modules/fees/fee.model.js";
import { SchoolClass } from "./modules/classes/class.model.js";
import { Book } from "./modules/books/book.model.js";
import { BusRoute } from "./modules/busRoutes/busRoute.model.js";
import { HostelStudent } from "./modules/hostelStudents/hostelStudent.model.js";
import { InventoryItem } from "./modules/inventory/inventoryItem.model.js";
import { Announcement } from "./modules/announcements/announcement.model.js";
import { Notice } from "./modules/notices/notice.model.js";
import { SchoolEvent } from "./modules/events/event.model.js";
import { Expense } from "./modules/expenses/expense.model.js";
import { Timetable } from "./modules/timetable/timetable.model.js";
import { Syllabus } from "./modules/syllabus/syllabus.model.js";
import { Exam } from "./modules/exams/exam.model.js";
import { ScheduledExam } from "./modules/examSchedule/examSchedule.model.js";

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
  log(`  ${DEMO_USERS.length + 1} demo users ready (incl. super admin owner@schooldeck.in)`);

  // Each collection is seeded independently — an early return here once
  // skipped every collection after students, leaving them silently empty.
  await seedStudents(log);
  await seedTeachers(log);
  await seedFeeAccounts(log);

  // Demo rows for the newer modules. Each guards on an empty collection, so
  // re-running the seed never duplicates and never touches real data.
  await seedClasses(log);
  await seedBooks(log);
  await seedBusRoutes(log);
  await seedHostelStudents(log);
  await seedInventory(log);
  await seedAnnouncements(log);
  await seedNotices(log);
  await seedEvents(log);
  await seedExpenses(log);
  await seedTimetable(log);
  await seedSyllabus(log);
  await seedExams(log);
  await seedExamSchedule(log);
}

const SCHOOL = "school_1";

/** One class row per grade, each with the demo school's three sections. */
async function seedClasses(log: (msg: string) => void) {
  if ((await SchoolClass.countDocuments({ schoolId: SCHOOL })) > 0) {
    log("  classes already populated — skipped");
    return;
  }

  const rows = CLASSES.map((name, i) => ({
    schoolId: SCHOOL,
    name,
    sections: ["A", "B", "C"],
    stream: "General",
    classTeacher: `${pick(T_FIRST, i)} ${pick(LAST, i * 3 + 1)}`,
    room: `R-${101 + i}`,
    students: 60 + i * 8,
    teachers: 6 + (i % 3),
  }));

  await SchoolClass.insertMany(rows);
  log(`  inserted ${rows.length} classes`);
}

async function seedBooks(log: (msg: string) => void) {
  if ((await Book.countDocuments({ schoolId: SCHOOL })) > 0) {
    log("  books already populated — skipped");
    return;
  }

  const rows = [
    { title: "Wings of Fire", author: "A.P.J. Abdul Kalam", category: "Biography", publisher: "Universities Press", year: 1999, total: 12 },
    { title: "The Diary of a Young Girl", author: "Anne Frank", category: "Biography", publisher: "Contact Publishing", year: 1947, total: 8 },
    { title: "NCERT Mathematics Class 10", author: "NCERT", category: "Textbook", publisher: "NCERT", year: 2023, total: 40 },
    { title: "NCERT Science Class 9", author: "NCERT", category: "Textbook", publisher: "NCERT", year: 2023, total: 40 },
    { title: "A Brief History of Time", author: "Stephen Hawking", category: "Science", publisher: "Bantam Books", year: 1988, total: 6 },
    { title: "The Alchemist", author: "Paulo Coelho", category: "Fiction", publisher: "HarperCollins", year: 1988, total: 10 },
    { title: "Malgudi Days", author: "R.K. Narayan", category: "Fiction", publisher: "Indian Thought", year: 1943, total: 9 },
    { title: "Oxford English Dictionary", author: "Oxford Press", category: "Reference", publisher: "Oxford University Press", year: 2020, total: 5 },
  ].map((b, i) => ({
    schoolId: SCHOOL,
    isbn: `978-81-${String(2000 + i).padStart(4, "0")}-${100 + i}`,
    available: Math.max(0, b.total - ((i * 3) % (b.total + 1))),
    ...b,
  }));

  await Book.insertMany(rows);
  log(`  inserted ${rows.length} library books`);
}

async function seedBusRoutes(log: (msg: string) => void) {
  if ((await BusRoute.countDocuments({ schoolId: SCHOOL })) > 0) {
    log("  bus routes already populated — skipped");
    return;
  }

  const rows = [
    { name: "Mayur Vihar – Noida Sector 18", stops: ["Mayur Vihar Phase 1", "Chilla", "Sector 15", "Sector 18"], driver: "Ramesh Yadav", bus: "DL-1PC-4521", departure: "06:50 AM", arrival: "07:45 AM", distance: "14 km" },
    { name: "Preet Vihar – Laxmi Nagar", stops: ["Preet Vihar", "Nirman Vihar", "Laxmi Nagar", "Shakarpur"], driver: "Suresh Kumar", bus: "DL-1PC-4522", departure: "07:00 AM", arrival: "07:50 AM", distance: "9 km" },
    { name: "Vasundhara – Indirapuram", stops: ["Vasundhara", "Vaibhav Khand", "Shakti Khand", "Indirapuram"], driver: "Manoj Verma", bus: "DL-1PC-4523", departure: "06:40 AM", arrival: "07:40 AM", distance: "16 km" },
    { name: "Patparganj – IP Extension", stops: ["Patparganj", "Mother Dairy", "IP Extension", "Madhu Vihar"], driver: "Amit Singh", bus: "DL-1PC-4524", departure: "07:05 AM", arrival: "07:55 AM", distance: "8 km" },
    { name: "Dilshad Garden – Seemapuri", stops: ["Dilshad Garden", "Jhilmil", "Seemapuri", "Tahirpur"], driver: "Vikram Nair", bus: "DL-1PC-4525", departure: "06:45 AM", arrival: "07:50 AM", distance: "12 km" },
    { name: "Kondli – Ghazipur", stops: ["Kondli", "Gharoli", "Khichripur", "Ghazipur"], driver: "Sanjay Reddy", bus: "DL-1PC-4526", departure: "06:55 AM", arrival: "07:45 AM", distance: "11 km" },
  ].map((r, i) => ({
    schoolId: SCHOOL,
    code: `RT-${String(i + 1).padStart(2, "0")}`,
    capacity: 40,
    students: 28 + ((i * 5) % 12),
    status: "active",
    ...r,
  }));

  await BusRoute.insertMany(rows);
  log(`  inserted ${rows.length} bus routes`);
}

async function seedHostelStudents(log: (msg: string) => void) {
  if ((await HostelStudent.countDocuments({ schoolId: SCHOOL })) > 0) {
    log("  hostel students already populated — skipped");
    return;
  }

  const rows = Array.from({ length: 8 }, (_, i) => {
    const firstName = pick(FIRST, i * 2 + 1);
    const lastName = pick(LAST, i * 3 + 2);
    const boys = i % 2 === 0;
    return {
      schoolId: SCHOOL,
      studentId: `ADM${2024001 + i}`,
      name: `${firstName} ${lastName}`,
      class: pick(CLASSES, i + 2),
      hostel: boys ? "Boys Hostel – Block A" : "Girls Hostel – Block B",
      room: `${boys ? "A" : "B"}-${101 + i}`,
      type: i % 3 === 0 ? "Triple Sharing" : "Double Sharing",
      fees: i % 4 === 0 ? "Pending" : "Paid",
      joinDate: `2025-04-${String(10 + i).padStart(2, "0")}`,
      contact: `9${820000000 + i * 137911}`,
    };
  });

  await HostelStudent.insertMany(rows);
  log(`  inserted ${rows.length} hostel students`);
}

async function seedInventory(log: (msg: string) => void) {
  if ((await InventoryItem.countDocuments({ schoolId: SCHOOL })) > 0) {
    log("  inventory already populated — skipped");
    return;
  }

  const rows = [
    { name: "Whiteboard Marker (Black)", category: "Stationery", qty: 240, minQty: 100, unit: "pcs", unitPrice: 25, supplier: "Delhi Stationers" },
    { name: "A4 Print Paper Ream", category: "Stationery", qty: 80, minQty: 40, unit: "reams", unitPrice: 280, supplier: "Delhi Stationers" },
    { name: "Chemistry Lab Beaker 250ml", category: "Lab Equipment", qty: 45, minQty: 30, unit: "pcs", unitPrice: 90, supplier: "SciLab Supplies" },
    { name: "Student Bench (2-seater)", category: "Furniture", qty: 120, minQty: 100, unit: "pcs", unitPrice: 3200, supplier: "Woodcraft Furnishers" },
    { name: "Football", category: "Sports", qty: 18, minQty: 20, unit: "pcs", unitPrice: 650, supplier: "PlayOn Sports" },
    { name: "First Aid Kit", category: "Medical", qty: 12, minQty: 15, unit: "kits", unitPrice: 850, supplier: "MedCare" },
    { name: "Projector Bulb", category: "Electronics", qty: 6, minQty: 10, unit: "pcs", unitPrice: 4500, supplier: "TechVision" },
    { name: "Cleaning Detergent 5L", category: "Housekeeping", qty: 30, minQty: 20, unit: "cans", unitPrice: 420, supplier: "CleanPro" },
  ].map((it, i) => ({
    schoolId: SCHOOL,
    code: `INV-${String(i + 1).padStart(3, "0")}`,
    lastUpdated: `2025-09-${String(1 + i).padStart(2, "0")}`,
    status: it.qty < it.minQty ? "low-stock" : "in-stock",
    ...it,
  }));

  await InventoryItem.insertMany(rows);
  log(`  inserted ${rows.length} inventory items`);
}

async function seedAnnouncements(log: (msg: string) => void) {
  if ((await Announcement.countDocuments({ schoolId: SCHOOL })) > 0) {
    log("  announcements already populated — skipped");
    return;
  }

  const rows = [
    { title: "Parent-Teacher Meeting on 20 Sep", body: "The quarterly PTM for all classes will be held on 20 September 2025 from 9:00 AM to 1:00 PM.", category: "Academic", audience: ["Parents", "Teachers"], pinned: true },
    { title: "Annual Sports Day Registrations Open", body: "Students may register for track and field events with their PE teachers by 25 September.", category: "Sports", audience: ["Students"], pinned: false },
    { title: "Diwali Break Schedule", body: "The school will remain closed from 20 to 25 October 2025 for the Diwali vacation.", category: "General", audience: ["Students", "Parents", "Teachers"], pinned: true },
    { title: "New Library Books Added", body: "Over 150 new titles across fiction, science and reference have been added to the library.", category: "Library", audience: ["Students", "Teachers"], pinned: false },
    { title: "Science Exhibition – Class 8 to 10", body: "The inter-house science exhibition will be held in the main auditorium on 5 October.", category: "Academic", audience: ["Students"], pinned: false },
    { title: "Fee Payment Reminder – Q2", body: "Second quarter fees are due by 30 September. Kindly clear dues to avoid a late fee.", category: "Finance", audience: ["Parents"], pinned: false },
  ].map((a, i) => ({
    schoolId: SCHOOL,
    author: `${pick(T_FIRST, i)} ${pick(LAST, i + 1)}`,
    date: `2025-09-${String(2 + i * 2).padStart(2, "0")}`,
    views: 40 + (i * 37) % 200,
    ...a,
  }));

  await Announcement.insertMany(rows);
  log(`  inserted ${rows.length} announcements`);
}

async function seedNotices(log: (msg: string) => void) {
  if ((await Notice.countDocuments({ schoolId: SCHOOL })) > 0) {
    log("  notices already populated — skipped");
    return;
  }

  const rows = [
    { title: "Revised Timings for Winter", body: "From 1 November, school will start at 8:30 AM and end at 2:30 PM.", category: "Administrative", audience: ["Students", "Parents"], priority: "High", pinned: true },
    { title: "Holiday – Gandhi Jayanti", body: "The school will remain closed on 2 October 2025.", category: "Holiday", audience: ["Students", "Parents", "Teachers"], priority: "Medium", pinned: false },
    { title: "Half-Yearly Exam Datesheet Released", body: "The datesheet for the half-yearly examinations is available on the notice board and portal.", category: "Examination", audience: ["Students", "Parents"], priority: "High", pinned: true },
    { title: "Vaccination Camp for Class 6", body: "A health department vaccination camp will be conducted in the school clinic on 18 September.", category: "Health", audience: ["Parents"], priority: "Medium", pinned: false },
    { title: "Uniform Compliance Check", body: "Class teachers will conduct a uniform and ID card check every Monday.", category: "Administrative", audience: ["Students"], priority: "Low", pinned: false },
    { title: "Scholarship Applications Invited", body: "Merit-cum-means scholarship applications are open until 10 October.", category: "General", audience: ["Students", "Parents"], priority: "Medium", pinned: false },
  ].map((n, i) => ({
    schoolId: SCHOOL,
    date: `2025-09-${String(3 + i * 2).padStart(2, "0")}`,
    expiry: `2025-1${i % 2}-${String(10 + i).padStart(2, "0")}`,
    postedBy: `${pick(T_FIRST, i + 2)} ${pick(LAST, i)}`,
    ...n,
  }));

  await Notice.insertMany(rows);
  log(`  inserted ${rows.length} notices`);
}

async function seedEvents(log: (msg: string) => void) {
  if ((await SchoolEvent.countDocuments({ schoolId: SCHOOL })) > 0) {
    log("  events already populated — skipped");
    return;
  }

  const rows = [
    { name: "Annual Sports Day", category: "Sports", venue: "Main Ground", capacity: 800, participants: 620, status: "upcoming", registration: "open" },
    { name: "Science Exhibition", category: "Academic", venue: "Auditorium", capacity: 300, participants: 210, status: "upcoming", registration: "open" },
    { name: "Annual Day Celebration", category: "Cultural", venue: "Auditorium", capacity: 700, participants: 540, status: "upcoming", registration: "closed" },
    { name: "Inter-House Debate", category: "Literary", venue: "Seminar Hall", capacity: 150, participants: 96, status: "completed", registration: "closed" },
    { name: "Independence Day Function", category: "Cultural", venue: "Main Ground", capacity: 900, participants: 880, status: "completed", registration: "closed" },
    { name: "Career Counselling Workshop", category: "Academic", venue: "Room 301", capacity: 120, participants: 74, status: "upcoming", registration: "open" },
  ].map((e, i) => ({
    schoolId: SCHOOL,
    code: `EV-${String(i + 1).padStart(3, "0")}`,
    date: `2025-1${i % 2}-${String(5 + i * 3).padStart(2, "0")}`,
    coordinator: `${pick(T_FIRST, i + 1)} ${pick(LAST, i + 2)}`,
    mediaCount: (i * 4) % 20,
    ...e,
  }));

  await SchoolEvent.insertMany(rows);
  log(`  inserted ${rows.length} events`);
}

async function seedExpenses(log: (msg: string) => void) {
  if ((await Expense.countDocuments({ schoolId: SCHOOL })) > 0) {
    log("  expenses already populated — skipped");
    return;
  }

  const rows = [
    { title: "Electricity Bill – August", category: "Utilities", amount: 84500, paidTo: "BSES Yamuna", method: "Bank Transfer", status: "paid", recurring: true },
    { title: "Staff Salaries – August", category: "Payroll", amount: 1850000, paidTo: "Staff Payroll", method: "Bank Transfer", status: "paid", recurring: true },
    { title: "Library Book Purchase", category: "Academic", amount: 42000, paidTo: "HarperCollins Distributors", method: "Cheque", status: "paid", recurring: false },
    { title: "Bus Diesel Refill", category: "Transport", amount: 68000, paidTo: "Indian Oil", method: "Card", status: "paid", recurring: true },
    { title: "Lab Equipment", category: "Academic", amount: 96000, paidTo: "SciLab Supplies", method: "Bank Transfer", status: "pending", recurring: false },
    { title: "Housekeeping Supplies", category: "Maintenance", amount: 18500, paidTo: "CleanPro", method: "Cash", status: "paid", recurring: true },
    { title: "Sports Equipment", category: "Sports", amount: 34000, paidTo: "PlayOn Sports", method: "Card", status: "pending", recurring: false },
    { title: "Water Tanker Supply", category: "Utilities", amount: 12000, paidTo: "Delhi Jal Board", method: "Cash", status: "paid", recurring: true },
  ].map((e, i) => ({
    schoolId: SCHOOL,
    voucherNo: `VCH-2025-${String(i + 1).padStart(4, "0")}`,
    date: `2025-08-${String(3 + i * 3).padStart(2, "0")}`,
    notes: "",
    ...e,
  }));

  await Expense.insertMany(rows);
  log(`  inserted ${rows.length} expenses`);
}

const WEEK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const PERIOD_TIMES = ["08:00 – 08:45", "08:45 – 09:30", "09:30 – 10:15", "10:35 – 11:20", "11:20 – 12:05", "12:05 – 12:50"];

/** A full weekly timetable for one demo class (Class 10 · Section A). */
async function seedTimetable(log: (msg: string) => void) {
  if ((await Timetable.countDocuments({ schoolId: SCHOOL })) > 0) {
    log("  timetable already populated — skipped");
    return;
  }

  const daySubjects = ["English", "Mathematics", "Science", "Social Science", "Hindi", "Computer Science"];
  const rows = daySubjects.map((subject, p) => ({
    schoolId: SCHOOL,
    className: "Class 10 - A",
    day: "Monday",
    period: p + 1,
    time: PERIOD_TIMES[p],
    subject,
    teacher: `${pick(T_FIRST, p)} ${pick(LAST, p + 1)}`,
    room: p === 2 ? "Science Lab" : p === 5 ? "Computer Lab" : "R-105",
  }));

  await Timetable.insertMany(rows);
  log(`  inserted ${rows.length} timetable periods`);
}

async function seedSyllabus(log: (msg: string) => void) {
  if ((await Syllabus.countDocuments({ schoolId: SCHOOL })) > 0) {
    log("  syllabus already populated — skipped");
    return;
  }

  const rows = [
    { subject: "Mathematics", unit: "Unit 1", chapter: "Real Numbers", topics: 6, completedTopics: 6 },
    { subject: "Mathematics", unit: "Unit 2", chapter: "Polynomials", topics: 5, completedTopics: 3 },
    { subject: "Science", unit: "Unit 1", chapter: "Chemical Reactions", topics: 7, completedTopics: 7 },
    { subject: "Science", unit: "Unit 2", chapter: "Acids, Bases and Salts", topics: 6, completedTopics: 2 },
    { subject: "English", unit: "Unit 1", chapter: "A Letter to God", topics: 4, completedTopics: 4 },
    { subject: "Social Science", unit: "Unit 1", chapter: "The Rise of Nationalism", topics: 5, completedTopics: 1 },
  ].map((s, i) => {
    const status = s.completedTopics >= s.topics ? "completed" : s.completedTopics === 0 ? "pending" : "in-progress";
    return {
      schoolId: SCHOOL,
      className: "Class 10",
      teacher: `${pick(T_FIRST, i)} ${pick(LAST, i + 2)}`,
      status,
      date: `2025-09-${String(4 + i * 2).padStart(2, "0")}`,
      ...s,
    };
  });

  await Syllabus.insertMany(rows);
  log(`  inserted ${rows.length} syllabus entries`);
}

async function seedExams(log: (msg: string) => void) {
  if ((await Exam.countDocuments({ schoolId: SCHOOL })) > 0) {
    log("  exams already populated — skipped");
    return;
  }

  const rows = [
    { name: "Unit Test 1 2025-26", type: "Unit Test", classes: ["Class 9", "Class 10"], subject: "All Subjects", date: "2025-07-15", totalMarks: 25, status: "completed", students: 120 },
    { name: "Mid-Term Examination 2025-26", type: "Mid-Term", classes: ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"], subject: "All Subjects", date: "2025-09-22", totalMarks: 80, status: "upcoming", students: 320 },
    { name: "Unit Test 2 2025-26", type: "Unit Test", classes: ["Class 9", "Class 10"], subject: "All Subjects", date: "2025-11-10", totalMarks: 25, status: "upcoming", students: 118 },
    { name: "Practical Examination 2025-26", type: "Practical", classes: ["Class 10"], subject: "Science", date: "2026-01-20", totalMarks: 30, status: "upcoming", students: 64 },
    { name: "Pre-Board Examination 2025-26", type: "Pre-Board", classes: ["Class 10"], subject: "All Subjects", date: "2026-01-05", totalMarks: 80, status: "upcoming", students: 62 },
    { name: "Final Examination 2025-26", type: "Final", classes: ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"], subject: "All Subjects", date: "2026-03-02", totalMarks: 80, status: "upcoming", students: 320 },
  ].map((e, i) => ({
    schoolId: SCHOOL,
    code: `EX-${String(i + 1).padStart(3, "0")}`,
    time: "10:00 AM",
    duration: e.totalMarks >= 80 ? "3 hrs" : "1.5 hrs",
    ...e,
  }));

  await Exam.insertMany(rows);
  log(`  inserted ${rows.length} exams`);
}

/**
 * Per-subject schedule for the Mid-Term across two class-sections. The class
 * code format ("10-A") and dates feed the Admit Cards page directly.
 */
async function seedExamSchedule(log: (msg: string) => void) {
  if ((await ScheduledExam.countDocuments({ schoolId: SCHOOL })) > 0) {
    log("  exam schedule already populated — skipped");
    return;
  }

  const papers = [
    { subject: "English", date: "02 Mar 2026", room: "Hall A" },
    { subject: "Hindi", date: "04 Mar 2026", room: "Hall A" },
    { subject: "Mathematics", date: "06 Mar 2026", room: "Hall B" },
    { subject: "Science", date: "09 Mar 2026", room: "Hall B" },
    { subject: "Social Science", date: "11 Mar 2026", room: "Room 201" },
  ];
  const invigilators = ["Dr. Priya Sharma", "Mr. Rahul Verma", "Ms. Kavita Singh", "Ms. Anita Patel", "Ms. Deepa Nair"];

  const rows = ["10-A", "9-A"].flatMap((cls, c) =>
    papers.map((p, i) => ({
      schoolId: SCHOOL,
      code: `ES${String(c * papers.length + i + 1).padStart(3, "0")}`,
      exam: "Mid-Term Examination 2025-26",
      subject: p.subject,
      class: cls,
      date: p.date,
      time: "10:00 AM",
      duration: "3 hrs",
      room: p.room,
      invigilator: pick(invigilators, i),
      totalMarks: 80,
      status: "upcoming",
    }))
  );

  await ScheduledExam.insertMany(rows);
  log(`  inserted ${rows.length} exam schedule entries`);
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

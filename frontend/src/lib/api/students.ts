import type { Student, StudentFormValues } from "@/types/student";

/**
 * In-memory mock backend.
 *
 * Every function is async and latency-simulated so the UI is forced to handle
 * loading and error states properly. When a real API lands, only the bodies
 * of these functions change — call sites stay identical.
 */

const CLASSES = ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"];
const SECTIONS = ["A", "B", "C"];
const FIRST = ["Aarav", "Vivaan", "Aditya", "Ananya", "Diya", "Ishaan", "Kabir", "Myra", "Reyansh", "Saanvi", "Advik", "Anika", "Arjun", "Kiara", "Rohan", "Tara", "Vihaan", "Zara", "Neha", "Karan", "Priya", "Sahil", "Meera", "Dev"];
const LAST = ["Sharma", "Verma", "Patel", "Gupta", "Singh", "Reddy", "Nair", "Iyer", "Joshi", "Mehta", "Kapoor", "Bose"];
const RELATIONS = ["Father", "Mother", "Guardian"];
const BLOOD: Student["bloodGroup"][] = ["A+", "B+", "O+", "AB+", "A-", "O-"];

/** Deterministic PRNG so the seed list is stable across reloads and SSR. */
function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function buildSeed(): Student[] {
  const rand = seededRandom(42);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
  const between = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;

  return Array.from({ length: 24 }, (_, i) => {
    const firstName = FIRST[i % FIRST.length];
    const lastName = pick(LAST);
    const className = pick(CLASSES);
    const section = pick(SECTIONS);
    const guardianFirst = pick(FIRST);

    return {
      id: `stu_${String(i + 1).padStart(3, "0")}`,
      admissionNo: `ADM${2024000 + i + 1}`,
      rollNo: String(between(1, 40)),
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@springdale.edu`,
      phone: `9${between(100000000, 999999999)}`,
      dateOfBirth: `${between(2008, 2013)}-${String(between(1, 12)).padStart(2, "0")}-${String(between(1, 28)).padStart(2, "0")}`,
      gender: (i % 2 === 0 ? "male" : "female") as Student["gender"],
      bloodGroup: pick(BLOOD),
      className,
      section,
      status: (rand() > 0.12 ? "active" : "inactive") as Student["status"],
      admissionDate: `${between(2019, 2024)}-04-${String(between(1, 28)).padStart(2, "0")}`,
      address: `${between(10, 99)}, ${pick(["Green Park", "Sector 21", "MG Road", "Civil Lines", "Model Town"])}, New Delhi`,
      guardian: {
        name: `${guardianFirst} ${lastName}`,
        relation: pick(RELATIONS),
        phone: `9${between(100000000, 999999999)}`,
        email: `${guardianFirst.toLowerCase()}.${lastName.toLowerCase()}@gmail.com`,
        occupation: pick(["Business", "Engineer", "Doctor", "Teacher", "Government Service"]),
      },
      attendancePercent: between(62, 99),
      performancePercent: between(45, 98),
      feeDue: rand() > 0.55 ? between(1, 24) * 500 : 0,
      medicalNotes: rand() > 0.8 ? "Mild dust allergy — keep inhaler accessible." : undefined,
    } satisfies Student;
  });
}

let students: Student[] = buildSeed();

const delay = (ms = 450) => new Promise((resolve) => setTimeout(resolve, ms));

export interface StudentFilters {
  search?: string;
  className?: string;
  status?: string;
}

export async function listStudents(filters: StudentFilters = {}): Promise<Student[]> {
  await delay();
  const { search, className, status } = filters;
  const query = search?.trim().toLowerCase();

  return students.filter((s) => {
    if (className && s.className !== className) return false;
    if (status && s.status !== status) return false;
    if (!query) return true;
    return (
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(query) ||
      s.admissionNo.toLowerCase().includes(query) ||
      s.email.toLowerCase().includes(query) ||
      s.rollNo.includes(query)
    );
  });
}

export async function getStudent(id: string): Promise<Student | null> {
  await delay(300);
  return students.find((s) => s.id === id) ?? null;
}

export async function createStudent(values: StudentFormValues): Promise<Student> {
  await delay();

  if (students.some((s) => s.admissionNo === values.admissionNo)) {
    throw new Error(`Admission number ${values.admissionNo} is already in use.`);
  }

  const student: Student = {
    ...values,
    id: `stu_${Math.random().toString(36).slice(2, 9)}`,
    attendancePercent: 100,
    performancePercent: 0,
    feeDue: 0,
  };
  students = [student, ...students];
  return student;
}

export async function updateStudent(id: string, values: StudentFormValues): Promise<Student> {
  await delay();

  const index = students.findIndex((s) => s.id === id);
  if (index === -1) throw new Error("Student not found.");

  if (students.some((s) => s.admissionNo === values.admissionNo && s.id !== id)) {
    throw new Error(`Admission number ${values.admissionNo} is already in use.`);
  }

  const updated = { ...students[index], ...values };
  students = students.map((s) => (s.id === id ? updated : s));
  return updated;
}

export async function deleteStudent(id: string): Promise<void> {
  await delay(350);
  if (!students.some((s) => s.id === id)) throw new Error("Student not found.");
  students = students.filter((s) => s.id !== id);
}

export const CLASS_OPTIONS = CLASSES;
export const SECTION_OPTIONS = SECTIONS;

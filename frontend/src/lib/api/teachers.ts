import type { Teacher, TeacherFormValues } from "@/types/teacher";

/**
 * In-memory mock backend — same contract as the students API.
 * Swap the bodies for real HTTP calls and every call site keeps working.
 */

export const SUBJECT_OPTIONS = [
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "Hindi",
  "History",
  "Geography",
  "Computer Science",
  "Physical Education",
];

export const DEPARTMENT_OPTIONS = [
  "Science",
  "Mathematics",
  "Languages",
  "Social Studies",
  "Computer Science",
  "Sports",
];

export const TEACHER_CLASS_OPTIONS = ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"];

const FIRST = ["Priya", "Rahul", "Anita", "Suresh", "Kavita", "Amit", "Deepa", "Vikram", "Sunita", "Manoj", "Rekha", "Sanjay", "Nisha", "Alok", "Geeta", "Rajiv", "Shalini", "Naveen"];
const LAST = ["Sharma", "Verma", "Patel", "Kumar", "Singh", "Joshi", "Nair", "Gupta", "Iyer", "Mehta"];
const QUALIFICATIONS = ["M.Sc, B.Ed", "M.A, B.Ed", "Ph.D", "M.Tech", "B.Ed", "M.Com, B.Ed"];

function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function buildSeed(): Teacher[] {
  const rand = seededRandom(7);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
  const between = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;

  return Array.from({ length: 18 }, (_, i) => {
    const firstName = FIRST[i % FIRST.length];
    const lastName = pick(LAST);
    const primarySubject = SUBJECT_OPTIONS[i % SUBJECT_OPTIONS.length];
    const experienceYears = between(1, 22);

    const subjects = [primarySubject];
    if (rand() > 0.6) {
      const extra = pick(SUBJECT_OPTIONS);
      if (extra !== primarySubject) subjects.push(extra);
    }

    const classCount = between(1, 3);
    const classes = Array.from(new Set(Array.from({ length: classCount }, () => pick(TEACHER_CLASS_OPTIONS))));

    const roll = rand();
    const status: Teacher["status"] = roll > 0.88 ? "on-leave" : roll > 0.82 ? "inactive" : "active";

    const typeRoll = rand();
    const employmentType: Teacher["employmentType"] =
      typeRoll > 0.85 ? "part-time" : typeRoll > 0.78 ? "contract" : "full-time";

    return {
      id: `tch_${String(i + 1).padStart(3, "0")}`,
      employeeId: `EMP${1000 + i + 1}`,
      firstName,
      lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@springdale.edu`,
      phone: `9${between(100000000, 999999999)}`,
      gender: (i % 2 === 0 ? "female" : "male") as Teacher["gender"],
      dateOfBirth: `${between(1972, 1995)}-${String(between(1, 12)).padStart(2, "0")}-${String(between(1, 28)).padStart(2, "0")}`,
      joiningDate: `${between(2010, 2024)}-${String(between(1, 12)).padStart(2, "0")}-${String(between(1, 28)).padStart(2, "0")}`,
      department: pick(DEPARTMENT_OPTIONS),
      subjects,
      classes,
      qualification: pick(QUALIFICATIONS),
      experienceYears,
      employmentType,
      status,
      address: `${between(10, 99)}, ${pick(["Green Park", "Sector 21", "MG Road", "Civil Lines", "Model Town"])}, New Delhi`,
      salary: between(35, 95) * 1000,
      rating: Math.round((3.4 + rand() * 1.6) * 10) / 10,
      attendancePercent: between(78, 100),
      weeklyPeriods: between(12, 32),
      isClassTeacher: rand() > 0.6,
    } satisfies Teacher;
  });
}

let teachers: Teacher[] = buildSeed();

const delay = (ms = 450) => new Promise((resolve) => setTimeout(resolve, ms));

export interface TeacherFilters {
  search?: string;
  subject?: string;
  status?: string;
  employmentType?: string;
}

export async function listTeachers(filters: TeacherFilters = {}): Promise<Teacher[]> {
  await delay();
  const { search, subject, status, employmentType } = filters;
  const query = search?.trim().toLowerCase();

  return teachers.filter((t) => {
    if (subject && !t.subjects.includes(subject)) return false;
    if (status && t.status !== status) return false;
    if (employmentType && t.employmentType !== employmentType) return false;
    if (!query) return true;
    return (
      `${t.firstName} ${t.lastName}`.toLowerCase().includes(query) ||
      t.employeeId.toLowerCase().includes(query) ||
      t.email.toLowerCase().includes(query) ||
      t.subjects.some((s) => s.toLowerCase().includes(query))
    );
  });
}

export async function getTeacher(id: string): Promise<Teacher | null> {
  await delay(300);
  return teachers.find((t) => t.id === id) ?? null;
}

export async function createTeacher(values: TeacherFormValues): Promise<Teacher> {
  await delay();

  if (teachers.some((t) => t.employeeId === values.employeeId)) {
    throw new Error(`Employee ID ${values.employeeId} is already in use.`);
  }

  const teacher: Teacher = {
    ...values,
    id: `tch_${Math.random().toString(36).slice(2, 9)}`,
    rating: 0,
    attendancePercent: 100,
    weeklyPeriods: 0,
  };
  teachers = [teacher, ...teachers];
  return teacher;
}

export async function updateTeacher(id: string, values: TeacherFormValues): Promise<Teacher> {
  await delay();

  const index = teachers.findIndex((t) => t.id === id);
  if (index === -1) throw new Error("Teacher not found.");

  if (teachers.some((t) => t.employeeId === values.employeeId && t.id !== id)) {
    throw new Error(`Employee ID ${values.employeeId} is already in use.`);
  }

  const updated = { ...teachers[index], ...values };
  teachers = teachers.map((t) => (t.id === id ? updated : t));
  return updated;
}

export async function deleteTeacher(id: string): Promise<void> {
  await delay(350);
  if (!teachers.some((t) => t.id === id)) throw new Error("Teacher not found.");
  teachers = teachers.filter((t) => t.id !== id);
}

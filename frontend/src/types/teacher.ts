export type TeacherStatus = "active" | "on-leave" | "inactive" | "resigned";
export type EmploymentType = "full-time" | "part-time" | "contract" | "visiting";

export interface Teacher {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: "male" | "female" | "other";
  dateOfBirth: string; // ISO yyyy-mm-dd
  joiningDate: string; // ISO yyyy-mm-dd
  department: string;
  /** Subjects the teacher is qualified to teach. */
  subjects: string[];
  /** Classes currently assigned, e.g. ["Class 9", "Class 10"]. */
  classes: string[];
  qualification: string;
  experienceYears: number;
  employmentType: EmploymentType;
  status: TeacherStatus;
  address: string;
  avatar?: string;
  /** Monthly gross salary in INR. */
  salary: number;
  /** Average peer/student rating, 0-5. */
  rating: number;
  /** Percentage, 0-100. */
  attendancePercent: number;
  /** Weekly teaching periods assigned. */
  weeklyPeriods: number;
  isClassTeacher: boolean;
  /** The class this teacher is class teacher of, e.g. "Class 10" (when isClassTeacher). */
  classTeacherOf?: string;
  /** The section they are class teacher of, e.g. "A". */
  classTeacherSection?: string;
}

/** Fields the create/edit form owns. Server-derived fields are excluded. */
export type TeacherFormValues = Omit<
  Teacher,
  "id" | "rating" | "attendancePercent" | "weeklyPeriods"
>;

export const teacherName = (t: Teacher) => `${t.firstName} ${t.lastName}`;

export type StudentStatus = "active" | "inactive" | "alumni" | "transferred";
export type Gender = "male" | "female" | "other";
export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "O+" | "O-" | "AB+" | "AB-";

export interface Guardian {
  name: string;
  relation: string;
  phone: string;
  email?: string;
  occupation?: string;
}

export interface Student {
  id: string;
  admissionNo: string;
  rollNo: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string; // ISO yyyy-mm-dd
  gender: Gender;
  /** null = explicitly "not recorded" (clearable on edit); undefined = never set. */
  bloodGroup?: BloodGroup | null;
  className: string;
  section: string;
  status: StudentStatus;
  admissionDate: string; // ISO yyyy-mm-dd
  address: string;
  guardian: Guardian;
  avatar?: string;
  /** Percentage, 0-100. */
  attendancePercent: number;
  /** Average marks percentage, 0-100. */
  performancePercent: number;
  feeDue: number;
  medicalNotes?: string;

  // --- Optional admission-form details (all backward-compatible) ---
  // Parents, kept separate from the required `guardian` above.
  fatherName?: string;
  fatherOccupation?: string;
  fatherPhone?: string;
  fatherEmail?: string;
  motherName?: string;
  motherOccupation?: string;
  motherPhone?: string;
  motherEmail?: string;
  // Other particulars.
  nationality?: string;
  religion?: string;
  category?: string;
  motherTongue?: string;
  aadhaarNo?: string;
  placeOfBirth?: string;
  annualIncome?: string;
  // Contact extras.
  correspondenceAddress?: string;
  emergencyContact?: string;
  // Previous school.
  previousSchool?: string;
  previousClass?: string;
  previousBoard?: string;
  tcNumber?: string;
  previousResult?: string;
  // Transport.
  transportRequired?: boolean;
  pickupPoint?: string;
}

/**
 * Fields the create/edit form owns. Server-derived metrics are excluded, but
 * `avatar` (the uploaded photo, stored inline as a data URL) is included so it
 * flows straight through to the profile and the ID card.
 */
export type StudentFormValues = Omit<
  Student,
  "id" | "attendancePercent" | "performancePercent" | "feeDue"
>;

export const fullName = (s: Pick<Student, "firstName" | "lastName">) =>
  `${s.firstName} ${s.lastName}`;

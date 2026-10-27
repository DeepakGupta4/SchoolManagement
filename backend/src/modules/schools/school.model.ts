import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * A tenant. One document per paying/​trialing customer school, created the
 * moment a Super Admin approves a registration request. Its `schoolId` is the
 * same string stamped on every User and every tenant record (students, fees,
 * …), so this is the row that ties an entire school's data together.
 *
 * The subscription is embedded rather than a separate collection: it is always
 * one-to-one with the school and always read alongside it (the access check
 * runs on every request), so keeping them together avoids a second lookup and
 * makes updates atomic.
 */

export const SUBSCRIPTION_PLANS = ["trial", "monthly", "yearly"] as const;
export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number];

export const SUBSCRIPTION_STATUSES = [
  "trial",
  "active",
  "expired",
  "payment_pending",
  "suspended",
  "cancelled",
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

const subscriptionSchema = new Schema(
  {
    plan: { type: String, enum: SUBSCRIPTION_PLANS, default: "trial" },
    /** Feature tier of a PAID plan. Trial/complimentary access is always full, so
     *  the default is "premium" and the tier gate only restricts a paid tier. */
    tier: { type: String, enum: ["starter", "standard", "premium"], default: "premium" },
    status: { type: String, enum: SUBSCRIPTION_STATUSES, default: "trial" },
    trialStartDate: { type: Date, default: null },
    trialEndDate: { type: Date, default: null },
    paidStartDate: { type: Date, default: null },
    paidEndDate: { type: Date, default: null },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    paymentId: { type: String, default: "" },
    orderId: { type: String, default: "" },
    // Every gateway payment id we've already activated, so a (replayable) verify
    // call with an old but valid signature can't extend the plan for free.
    processedPaymentIds: { type: [String], default: [] },
    autoRenew: { type: Boolean, default: false },
    /** Free access granted by a Super Admin, bypassing payment. */
    freeAccess: { type: Boolean, default: false },

    // Reminder de-duplication: each email is sent at most once per window and
    // reset when the window changes (a trial is extended, a plan is renewed…).
    notifiedTrialEnding: { type: Boolean, default: false },
    notifiedTrialExpired: { type: Boolean, default: false },
    notifiedPaidEnding: { type: Boolean, default: false },
  },
  { _id: false }
);

const schoolSchema = new Schema(
  {
    // The tenant key. Unique, and copied onto every record the school owns.
    schoolId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    ownerName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    country: { type: String, default: "India" },
    studentCount: { type: Number, default: 0 },
    teacherCount: { type: Number, default: 0 },
    schoolType: { type: String, default: "" },
    website: { type: String, default: "" },
    // Daily open/close times (local "HH:MM", 24h). Captured at registration,
    // editable in Settings; drives the dashboard Open/Closed badge.
    openingTime: { type: String, default: "08:00" },
    closingTime: { type: String, default: "15:00" },
    // Board/affiliation line printed on official documents (report cards, ID
    // cards, admit cards, certificates), e.g. "CBSE Affiliation No. 2730123".
    affiliation: { type: String, default: "" },
    logo: { type: String, default: "" },
    // Authorised signatory image (data URL). Uploaded once by an admin and
    // printed in the signature area of every student/staff ID card.
    signatureUrl: { type: String, default: "" },
    // Suspension is separate from subscription state: an admin can freeze an
    // account regardless of whether its trial or plan is otherwise valid.
    status: { type: String, enum: ["active", "suspended"], default: "active" },
    subscription: { type: subscriptionSchema, default: () => ({}) },
    // Per-school bell schedule for the timetable. Admin-editable; empty means
    // the app falls back to its built-in default period list.
    bellSchedule: {
      type: [
        new Schema(
          {
            label: { type: String, default: "" },
            time: { type: String, default: "" },
            isBreak: { type: Boolean, default: false },
          },
          { _id: false }
        ),
      ],
      default: [],
    },

    // Per-school grade bands (A1/A2/…) with %-cut-offs, grade points and remarks.
    // Grades are DERIVED from these at read time (never stored on marks), so
    // editing the scheme re-grades every result. Empty bands → the app falls back
    // to the built-in CBSE-style default (see utils/grading.ts).
    gradingScheme: {
      enabled: { type: Boolean, default: true },
      passPercent: { type: Number, default: 33 },
      bands: {
        type: [
          new Schema(
            {
              grade: { type: String, default: "" },
              minPercent: { type: Number, default: 0 },
              maxPercent: { type: Number, default: 100 },
              gradePoint: { type: Number, default: 0 },
              remark: { type: String, default: "" },
            },
            { _id: false }
          ),
        ],
        default: [],
      },
    },

    // ── Branding ──────────────────────────────────────────────────────────────
    displayName: { type: String, default: "" },
    tagline: { type: String, default: "" },
    theme: { type: String, default: "indigo" },
    density: { type: String, default: "comfortable" },
    receiptFooter: { type: String, default: "" },

    // ── Academic Session ──────────────────────────────────────────────────────
    sessionLabel: { type: String, default: "" },
    sessionStartDate: { type: String, default: "" },
    sessionEndDate: { type: String, default: "" },
    terms: { type: String, default: "3" },
    weekOff: { type: String, default: "sunday" },
    attendanceMode: { type: String, default: "period" },

    // ── Notifications ─────────────────────────────────────────────────────────
    notifChannel: { type: String, default: "email" },
    notifSenderId: { type: String, default: "" },
    notifFeeReminderDays: { type: String, default: "3" },
    notifAbsentAlert: { type: String, default: "immediate" },
    notifDigest: { type: String, default: "" },
  },
  { timestamps: true }
);

export type SchoolDoc = InferSchemaType<typeof schoolSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const School = mongoose.model<SchoolDoc>("School", schoolSchema);

/**
 * The effective, server-authoritative access decision for a school. Trial and
 * paid windows are compared against the current server time here so the answer
 * never depends on anything the client can influence.
 *
 * Returns the state to expose to the app plus whether protected features may
 * be used right now.
 */
export function evaluateAccess(
  school: Pick<SchoolDoc, "status" | "subscription">,
  now: Date = new Date()
): {
  status: SubscriptionStatus | "suspended";
  allowed: boolean;
  daysRemaining: number | null;
  trialEndDate: Date | null;
  paidEndDate: Date | null;
} {
  const sub = school.subscription;

  if (school.status === "suspended" || sub.status === "suspended") {
    return { status: "suspended", allowed: false, daysRemaining: null, trialEndDate: sub.trialEndDate ?? null, paidEndDate: sub.paidEndDate ?? null };
  }

  if (sub.status === "cancelled") {
    return { status: "cancelled", allowed: false, daysRemaining: null, trialEndDate: sub.trialEndDate ?? null, paidEndDate: sub.paidEndDate ?? null };
  }

  // Admin-granted free access always wins.
  if (sub.freeAccess) {
    return { status: "active", allowed: true, daysRemaining: null, trialEndDate: sub.trialEndDate ?? null, paidEndDate: sub.paidEndDate ?? null };
  }

  // A paid plan is valid until its end date.
  if ((sub.status === "active" || sub.plan === "monthly" || sub.plan === "yearly") && sub.paidEndDate) {
    const allowed = now < sub.paidEndDate;
    return {
      status: allowed ? "active" : "expired",
      allowed,
      daysRemaining: allowed ? daysBetween(now, sub.paidEndDate) : 0,
      trialEndDate: sub.trialEndDate ?? null,
      paidEndDate: sub.paidEndDate,
    };
  }

  // Otherwise it is a trial, valid until the trial end date.
  if (sub.trialEndDate) {
    const allowed = now < sub.trialEndDate;
    return {
      status: allowed ? "trial" : "expired",
      allowed,
      daysRemaining: allowed ? daysBetween(now, sub.trialEndDate) : 0,
      trialEndDate: sub.trialEndDate,
      paidEndDate: sub.paidEndDate ?? null,
    };
  }

  return { status: "expired", allowed: false, daysRemaining: 0, trialEndDate: null, paidEndDate: null };
}

/** Whole days from `a` to `b`, rounded up, never negative. */
function daysBetween(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

/**
 * Clears the reminder de-dup flags. Called whenever the subscription window
 * moves (extended, renewed, trial date changed) so the relevant reminders can
 * legitimately fire again for the new window.
 */
export function resetReminders(sub: SchoolDoc["subscription"]): void {
  sub.notifiedTrialEnding = false;
  sub.notifiedTrialExpired = false;
  sub.notifiedPaidEnding = false;
}

/** Client-facing shape for a school, with the live access decision folded in. */
export function toPublicSchool(school: SchoolDoc) {
  const access = evaluateAccess(school);
  return {
    id: String(school._id),
    schoolId: school.schoolId,
    name: school.name,
    ownerName: school.ownerName,
    email: school.email,
    phone: school.phone,
    address: school.address,
    city: school.city,
    state: school.state,
    country: school.country,
    studentCount: school.studentCount,
    teacherCount: school.teacherCount,
    schoolType: school.schoolType,
    website: school.website,
    openingTime: school.openingTime || "08:00",
    closingTime: school.closingTime || "15:00",
    affiliation: school.affiliation ?? "",
    logo: school.logo,
    signatureUrl: school.signatureUrl ?? "",
    bellSchedule: (school.bellSchedule ?? []).map((p) => ({
      label: p.label ?? "",
      time: p.time ?? "",
      isBreak: Boolean(p.isBreak),
    })),
    gradingScheme: {
      enabled: school.gradingScheme?.enabled !== false,
      passPercent: school.gradingScheme?.passPercent ?? 33,
      bands: (school.gradingScheme?.bands ?? []).map((b) => ({
        grade: b.grade ?? "",
        minPercent: b.minPercent ?? 0,
        maxPercent: b.maxPercent ?? 100,
        gradePoint: b.gradePoint ?? 0,
        remark: b.remark ?? "",
      })),
    },
    status: school.status,
    // Branding
    displayName: school.displayName ?? "",
    tagline: school.tagline ?? "",
    theme: school.theme ?? "indigo",
    density: school.density ?? "comfortable",
    receiptFooter: school.receiptFooter ?? "",
    // Academic session
    sessionLabel: school.sessionLabel ?? "",
    sessionStartDate: school.sessionStartDate ?? "",
    sessionEndDate: school.sessionEndDate ?? "",
    terms: school.terms ?? "3",
    weekOff: school.weekOff ?? "sunday",
    attendanceMode: school.attendanceMode ?? "period",
    // Notifications
    notifChannel: school.notifChannel ?? "email",
    notifSenderId: school.notifSenderId ?? "",
    notifFeeReminderDays: school.notifFeeReminderDays ?? "3",
    notifAbsentAlert: school.notifAbsentAlert ?? "immediate",
    notifDigest: school.notifDigest ?? "",
    subscription: {
      plan: school.subscription.plan,
      tier: school.subscription.tier,
      status: school.subscription.status,
      trialStartDate: school.subscription.trialStartDate,
      trialEndDate: school.subscription.trialEndDate,
      paidStartDate: school.subscription.paidStartDate,
      paidEndDate: school.subscription.paidEndDate,
      paymentStatus: school.subscription.paymentStatus,
      autoRenew: school.subscription.autoRenew,
      freeAccess: school.subscription.freeAccess,
    },
    access,
    createdAt: school.createdAt,
  };
}

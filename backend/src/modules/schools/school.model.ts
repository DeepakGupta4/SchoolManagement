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
    status: { type: String, enum: SUBSCRIPTION_STATUSES, default: "trial" },
    trialStartDate: { type: Date, default: null },
    trialEndDate: { type: Date, default: null },
    paidStartDate: { type: Date, default: null },
    paidEndDate: { type: Date, default: null },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    paymentId: { type: String, default: "" },
    orderId: { type: String, default: "" },
    autoRenew: { type: Boolean, default: false },
    /** Free access granted by a Super Admin, bypassing payment. */
    freeAccess: { type: Boolean, default: false },
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
    // Suspension is separate from subscription state: an admin can freeze an
    // account regardless of whether its trial or plan is otherwise valid.
    status: { type: String, enum: ["active", "suspended"], default: "active" },
    subscription: { type: subscriptionSchema, default: () => ({}) },
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
    status: school.status,
    subscription: {
      plan: school.subscription.plan,
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

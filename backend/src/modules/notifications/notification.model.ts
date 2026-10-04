import mongoose, { Schema, type InferSchemaType } from "mongoose";

/**
 * An in-app notification. Targeted by AUDIENCE:
 *  - "super_admin": platform events (a new school registered) — every super
 *    admin sees these; schoolId is "platform".
 *  - "school": tenant events (approved, trial ending, payment) — seen by every
 *    user of that `schoolId`.
 *  - "user": a message for ONE person in a tenant (e.g. a substitution assigned
 *    to a specific teacher) — matched by `schoolId` + `recipientEmail`. The
 *    person sees it alongside the school-wide ones when they sign in.
 */
export const NOTIFICATION_AUDIENCES = ["super_admin", "school", "user"] as const;
export type NotificationAudience = (typeof NOTIFICATION_AUDIENCES)[number];

const notificationSchema = new Schema(
  {
    audience: { type: String, enum: NOTIFICATION_AUDIENCES, required: true, index: true },
    schoolId: { type: String, required: true, default: "platform", index: true },
    /**
     * For `audience: "user"` only — the recipient's login email (lowercased).
     * Teachers/users are linked to a login by email, so this is the targeting
     * key. Empty for school-wide / platform notifications.
     */
    recipientEmail: { type: String, default: "", lowercase: true, trim: true, index: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, default: "" },
    /** In-app destination when clicked. */
    link: { type: String, default: "" },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export type NotificationDoc = InferSchemaType<typeof notificationSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Notification = mongoose.model<NotificationDoc>("Notification", notificationSchema);

export function toPublicNotification(doc: NotificationDoc) {
  return {
    id: String(doc._id),
    type: doc.type,
    title: doc.title,
    body: doc.body,
    link: doc.link,
    read: doc.read,
    createdAt: doc.createdAt,
  };
}

/** Records a platform-owner notification (new registrations, etc.). */
export async function notifySuperAdmin(input: {
  type: string;
  title: string;
  body?: string;
  link?: string;
}): Promise<void> {
  try {
    await Notification.create({ audience: "super_admin", schoolId: "platform", ...input });
  } catch (err) {
    // Notifications are best-effort; never break the triggering action.
    console.error("[notify] super admin failed:", err);
  }
}

/** Records a notification for one tenant school. */
export async function notifySchool(
  schoolId: string,
  input: { type: string; title: string; body?: string; link?: string }
): Promise<void> {
  try {
    await Notification.create({ audience: "school", schoolId, ...input });
  } catch (err) {
    console.error("[notify] school failed:", err);
  }
}

/**
 * Records a notification for ONE person in a tenant, targeted by login email.
 * The person sees it in their bell when they sign in (email matches their user).
 * No-op when `email` is blank — a record targeted at nobody would never surface.
 */
export async function notifyUser(input: {
  schoolId: string;
  email: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
}): Promise<void> {
  const email = (input.email || "").trim().toLowerCase();
  if (!email) return;
  try {
    await Notification.create({
      audience: "user",
      schoolId: input.schoolId,
      recipientEmail: email,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link,
    });
  } catch (err) {
    console.error("[notify] user failed:", err);
  }
}

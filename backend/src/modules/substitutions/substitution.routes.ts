import { z } from "zod";
import type { HydratedDocument } from "mongoose";
import { Substitution, type SubstitutionAttrs } from "./substitution.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";
import { notifyUser } from "../notifications/notification.model.js";
import { ISO_DATE, isRealDate } from "../../utils/dates.js";

const substitutionSchema = z.object({
  date: z
    .string()
    .min(1, "Date is required.")
    .regex(ISO_DATE, "Use a YYYY-MM-DD date.")
    .refine(isRealDate, "That date doesn't exist on the calendar.")
    .refine((d) => d >= "2000-01-01" && d <= "2100-01-01", "Date is out of range."),
  day: z.string().default(""),
  period: z.coerce.number<number>().min(1).max(20).default(1),
  time: z.string().default(""),
  className: z.string().default(""),
  subject: z.string().default(""),
  room: z.string().default(""),
  absentTeacher: z.string().min(1, "Absent teacher is required."),
  absentEmpId: z.string().default(""),
  substituteTeacher: z.string().min(1, "Substitute teacher is required."),
  substituteEmpId: z.string().default(""),
  substituteEmail: z.string().default(""),
  status: z.enum(["assigned", "cancelled"]).default("assigned"),
  note: z.string().default(""),
});

/** Builds the short notification line sent to the substitute. */
function coverLine(doc: SubstitutionAttrs): string {
  const when = doc.day ? `${doc.day} ${doc.date}` : doc.date;
  const slot = doc.time ? `Period ${doc.period} (${doc.time})` : `Period ${doc.period}`;
  const where = [doc.subject, doc.className].filter(Boolean).join(" · ");
  const tail = where ? ` — ${where}` : "";
  return `${when} · ${slot}${tail} (covering ${doc.absentTeacher})`;
}

/** Notifies the substitute of a new/updated or cancelled cover arrangement. */
async function notifySubstitute(doc: HydratedDocument<SubstitutionAttrs>): Promise<void> {
  if (!doc.substituteEmail) return;
  const cancelled = doc.status === "cancelled";
  await notifyUser({
    schoolId: doc.schoolId,
    email: doc.substituteEmail,
    type: "substitution",
    title: cancelled ? "Substitution cancelled" : "Substitution assigned",
    body: coverLine(doc),
    link: "/timetable",
  });
}

export default createCrudRouter<SubstitutionAttrs>({
  model: Substitution,
  createSchema: substitutionSchema,
  searchFields: ["absentTeacher", "substituteTeacher", "className", "subject"],
  filterFields: ["date", "status", "substituteTeacher", "absentTeacher"],
  // Newest absence first, then in period order within a day.
  sort: { date: -1, period: 1 },
  afterCreate: async (doc) => {
    await notifySubstitute(doc);
  },
  afterUpdate: async (doc) => {
    await notifySubstitute(doc);
  },
});

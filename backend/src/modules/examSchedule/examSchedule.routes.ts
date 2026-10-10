import { z } from "zod";
import { ScheduledExam } from "./examSchedule.model.js";
import { createCrudRouter, toPublic } from "../../utils/crudRouter.js";
import { requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { ApiError } from "../../utils/ApiError.js";
import { ISO_DATE, isRealDate } from "../../utils/dates.js";

const scheduleDate = z
  .string()
  .default("")
  .refine((d) => d === "" || (ISO_DATE.test(d) && isRealDate(d)), "Enter a valid date (YYYY-MM-DD).");

const scheduleCreateSchema = z.object({
  code: z.string().trim().min(1),
  exam: z.string().trim().default(""),
  subject: z.string().trim().default(""),
  class: z.string().trim().default(""),
  date: scheduleDate,
  time: z.string().trim().default(""),
  duration: z.string().trim().default(""),
  room: z.string().trim().default(""),
  invigilator: z.string().trim().default(""),
  totalMarks: z.coerce.number<number>().min(0).default(0),
  status: z.enum(["upcoming", "ongoing", "completed", "cancelled"]).default("upcoming"),
});
const scheduleUpdateSchema = scheduleCreateSchema.partial();

/**
 * Rejects a scheduled paper that collides with another at the same date+time — the
 * same ROOM, the same INVIGILATOR, or the same CLASS can't be in two places at once.
 * Only meaningful once a date and time are set (drafts can't clash). Excludes the row
 * being edited so a slot never clashes with itself. (Exact {date,time} match — time
 * is free text, same granularity as the timetable's {day,period} clash check.)
 */
async function assertNoClash(
  schoolId: string,
  slot: { date?: string; time?: string; room?: string; invigilator?: string; class?: string },
  excludeId?: string
): Promise<void> {
  if (!slot.date || !slot.time) return;
  const base: Record<string, unknown> = { schoolId, date: slot.date, time: slot.time };
  if (excludeId) base._id = { $ne: excludeId };

  if (slot.room) {
    const clash = await ScheduledExam.findOne({ ...base, room: slot.room });
    if (clash) {
      throw ApiError.conflict(
        `Room ${slot.room} is already booked (${clash.exam || "another exam"} · ${clash.class}) at ${slot.date} ${slot.time}.`
      );
    }
  }
  if (slot.invigilator) {
    const clash = await ScheduledExam.findOne({ ...base, invigilator: slot.invigilator });
    if (clash) {
      throw ApiError.conflict(
        `${slot.invigilator} is already invigilating ${clash.class || "another paper"} at ${slot.date} ${slot.time}.`
      );
    }
  }
  if (slot.class) {
    const clash = await ScheduledExam.findOne({ ...base, class: slot.class });
    if (clash) {
      throw ApiError.conflict(
        `${slot.class} already has a paper (${clash.subject || clash.exam || "scheduled"}) at ${slot.date} ${slot.time}.`
      );
    }
  }
}

export default createCrudRouter({
  model: ScheduledExam,
  createSchema: scheduleCreateSchema,
  searchFields: ["exam", "code", "subject", "class", "room", "invigilator"],
  filterFields: ["status", "exam", "class"],
  extend: (router) => {
    router.post(
      "/",
      requireRole("super_admin", "school_admin", "principal"),
      validate(scheduleCreateSchema),
      async (req, res, next) => {
        try {
          const schoolId = req.user!.schoolId;
          const body = req.body as z.infer<typeof scheduleCreateSchema>;
          await assertNoClash(schoolId, body);
          const doc = await ScheduledExam.create({ ...body, schoolId });
          res.status(201).json({ data: toPublic(doc) });
        } catch (err) {
          next(err);
        }
      }
    );

    router.put(
      "/:id",
      requireRole("super_admin", "school_admin", "principal"),
      validate(scheduleUpdateSchema),
      async (req, res, next) => {
        try {
          const schoolId = req.user!.schoolId;
          const existing = await ScheduledExam.findOne({ _id: req.params.id, schoolId });
          if (!existing) throw ApiError.notFound("Scheduled exam not found.");

          const merged = {
            date: (req.body.date ?? existing.date) as string,
            time: (req.body.time ?? existing.time) as string,
            room: (req.body.room ?? existing.room) as string,
            invigilator: (req.body.invigilator ?? existing.invigilator) as string,
            class: (req.body.class ?? existing.class) as string,
          };
          await assertNoClash(schoolId, merged, String(req.params.id));

          const updated = await ScheduledExam.findOneAndUpdate(
            { _id: req.params.id, schoolId },
            req.body,
            { new: true, runValidators: true }
          );
          if (!updated) throw ApiError.notFound("Scheduled exam not found.");
          res.json({ data: toPublic(updated) });
        } catch (err) {
          next(err);
        }
      }
    );
  },
});

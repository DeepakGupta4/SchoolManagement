import { z } from "zod";
import { Timetable } from "./timetable.model.js";
import { createCrudRouter, toPublic } from "../../utils/crudRouter.js";
import { requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { ApiError } from "../../utils/ApiError.js";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

const timetableCreateSchema = z.object({
  className: z.string().trim().min(1),
  day: z.enum(DAYS),
  period: z.coerce.number<number>().int().min(1).max(20).default(1),
  time: z.string().trim().default(""),
  subject: z.string().trim().min(1),
  teacher: z.string().trim().default(""),
  room: z.string().trim().default(""),
});
const timetableUpdateSchema = timetableCreateSchema.partial();

/**
 * Rejects a teacher or room already booked for the same day+period in ANOTHER
 * class — a teacher can't be in two places at once, and a room can't hold two
 * classes. `excludeId` skips the row being edited so a slot never clashes with
 * itself.
 */
async function assertNoClash(
  schoolId: string,
  slot: { day: string; period: number; teacher?: string; room?: string; className: string },
  excludeId?: string
): Promise<void> {
  const base: Record<string, unknown> = { schoolId, day: slot.day, period: slot.period };
  if (excludeId) base._id = { $ne: excludeId };

  if (slot.teacher) {
    const clash = await Timetable.findOne({ ...base, teacher: slot.teacher });
    if (clash) {
      throw ApiError.conflict(
        `${slot.teacher} is already teaching ${clash.className} in this period (${slot.day}). A teacher can't be in two classes at once.`
      );
    }
  }
  if (slot.room) {
    const clash = await Timetable.findOne({ ...base, room: slot.room });
    if (clash) {
      throw ApiError.conflict(
        `Room ${slot.room} is already booked by ${clash.className} in this period (${slot.day}).`
      );
    }
  }
}

export default createCrudRouter({
  model: Timetable,
  createSchema: timetableCreateSchema,
  searchFields: ["className", "subject", "teacher", "room"],
  // `teacher` is an exact filter so a substitution screen can pull exactly one
  // teacher's periods for a day without substring-matching other names.
  filterFields: ["className", "day", "subject", "teacher"],
  extend: (router) => {
    // Custom create — a timetable has constraints the generic router can't express:
    // one period per class/day slot, and no teacher/room double-booked.
    router.post(
      "/",
      requireRole("super_admin", "school_admin", "principal"),
      validate(timetableCreateSchema),
      async (req, res, next) => {
        try {
          const schoolId = req.user!.schoolId;
          const body = req.body as z.infer<typeof timetableCreateSchema>;

          const occupied = await Timetable.findOne({
            schoolId,
            className: body.className,
            day: body.day,
            period: body.period,
          });
          if (occupied) {
            throw ApiError.conflict(
              `${body.className} already has a period in this slot (${body.day} P${body.period}). Edit it instead.`
            );
          }
          await assertNoClash(schoolId, body);

          const doc = await Timetable.create({ ...body, schoolId });
          res.status(201).json({ data: toPublic(doc) });
        } catch (err) {
          next(err);
        }
      }
    );

    // Custom update — the same clash checks, evaluated against the merged final
    // values and excluding the row being edited.
    router.put(
      "/:id",
      requireRole("super_admin", "school_admin", "principal"),
      validate(timetableUpdateSchema),
      async (req, res, next) => {
        try {
          const schoolId = req.user!.schoolId;
          const existing = await Timetable.findOne({ _id: req.params.id, schoolId });
          if (!existing) throw ApiError.notFound("Timetable entry not found.");

          const merged = {
            className: (req.body.className ?? existing.className) as string,
            day: (req.body.day ?? existing.day) as string,
            period: (req.body.period ?? existing.period) as number,
            teacher: (req.body.teacher ?? existing.teacher) as string,
            room: (req.body.room ?? existing.room) as string,
          };
          await assertNoClash(schoolId, merged, String(req.params.id));

          const updated = await Timetable.findOneAndUpdate(
            { _id: req.params.id, schoolId },
            req.body,
            { new: true, runValidators: true }
          );
          if (!updated) throw ApiError.notFound("Timetable entry not found.");
          res.json({ data: toPublic(updated) });
        } catch (err) {
          next(err);
        }
      }
    );
  },
});

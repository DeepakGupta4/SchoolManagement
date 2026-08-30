import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { ApiError } from "../../utils/ApiError.js";
import { Notification, toPublicNotification } from "./notification.model.js";

const router = Router();

router.use(requireAuth);

/** The filter that selects the caller's own notifications. */
function scopeFor(user: { role: string; schoolId: string }) {
  return user.role === "super_admin"
    ? { audience: "super_admin" as const }
    : { audience: "school" as const, schoolId: user.schoolId };
}

/** Latest notifications for the caller, with the unread count. */
router.get("/", async (req, res, next) => {
  try {
    const filter = scopeFor(req.user!);
    const [docs, unread] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).limit(30),
      Notification.countDocuments({ ...filter, read: false }),
    ]);
    res.json({ data: docs.map(toPublicNotification), meta: { unread } });
  } catch (err) {
    next(err);
  }
});

router.post("/read-all", async (req, res, next) => {
  try {
    await Notification.updateMany({ ...scopeFor(req.user!), read: false }, { $set: { read: true } });
    res.json({ data: { ok: true } });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/read", async (req, res, next) => {
  try {
    const doc = await Notification.findOneAndUpdate(
      { _id: req.params.id, ...scopeFor(req.user!) },
      { $set: { read: true } },
      { new: true }
    );
    if (!doc) throw ApiError.notFound("Notification not found.");
    res.json({ data: toPublicNotification(doc) });
  } catch (err) {
    next(err);
  }
});

export default router;

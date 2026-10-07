import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { Student } from "../students/student.model.js";

const router = Router();
router.use(requireAuth);

/**
 * The signed-in user's own children — students in their school whose guardian,
 * father or mother email matches the caller's login email (case-insensitive).
 * Powers the parent portal; returns only the child's own summary, never
 * school-wide data, so a parent can't see anything beyond their children.
 */
router.get("/children", async (req, res, next) => {
  try {
    const schoolId = req.user!.schoolId;
    const email = (req.user!.email || "").trim().toLowerCase();
    if (!email) {
      res.json({ data: [] });
      return;
    }
    const all = await Student.find({ schoolId }).lean();
    const mine = all.filter((s) => {
      const emails = [s.guardian?.email, s.fatherEmail, s.motherEmail].map((e) =>
        String(e ?? "").trim().toLowerCase()
      );
      return emails.includes(email);
    });
    res.json({
      data: mine.map((s) => ({
        id: String(s._id),
        name: `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim(),
        className: s.className ?? "",
        section: s.section ?? "",
        rollNo: s.rollNo ?? "",
        admissionNo: s.admissionNo ?? "",
        avatar: s.avatar ?? "",
        status: s.status ?? "active",
        attendancePercent: s.attendancePercent ?? 0,
        performancePercent: s.performancePercent ?? 0,
        feeDue: s.feeDue ?? 0,
      })),
    });
  } catch (err) {
    next(err);
  }
});

export default router;

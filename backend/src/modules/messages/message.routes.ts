import { Router } from "express";
import { z } from "zod";
import { Message } from "./message.model.js";
import { User } from "../auth/user.model.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { validate, parsed } from "../../middleware/validate.js";
import { ApiError } from "../../utils/ApiError.js";

const router = Router();
// Internal messaging is for the school's staff (the web app's audience). Custom
// roles are admitted only with the "messages" permission — set upstream by
// customRolePermissionGate (view for GET, edit for POST); parents / students /
// drivers use their own apps and are not messaging contacts here.
router.use(
  requireAuth,
  requireRole("super_admin", "school_admin", "principal", "teacher", "accountant", "librarian", "staff")
);

const norm = (e: unknown) => String(e ?? "").trim().toLowerCase();

/**
 * GET /api/messages — the signed-in user's conversations, one row per other
 * party, most-recent activity first. Scoped to messages where the caller is the
 * sender OR the recipient, so nobody sees anyone else's threads.
 */
router.get("/", async (req, res, next) => {
  try {
    const schoolId = req.user!.schoolId;
    const me = norm(req.user!.email);

    const msgs = await Message.find({
      schoolId,
      $or: [{ fromEmail: me }, { toEmail: me }],
    }).sort({ createdAt: -1 });

    // Fold into one entry per other party; the first time we see a party is the
    // latest message (the find is newest-first) → that's the preview line.
    const byParty = new Map<
      string,
      { email: string; name: string; role: string; lastBody: string; lastAt: Date | null; mineLast: boolean; unread: number }
    >();
    for (const m of msgs) {
      const mine = norm(m.fromEmail) === me;
      const otherEmail = mine ? norm(m.toEmail) : norm(m.fromEmail);
      if (!otherEmail) continue;
      let conv = byParty.get(otherEmail);
      if (!conv) {
        conv = {
          email: otherEmail,
          name: (mine ? m.toName : m.fromName) || otherEmail,
          role: (mine ? m.toRole : m.fromRole) || "",
          lastBody: m.body,
          lastAt: m.createdAt ?? null,
          mineLast: mine,
          unread: 0,
        };
        byParty.set(otherEmail, conv);
      }
      // Unread = messages addressed TO me by this party that I haven't opened.
      if (!mine && !m.readAt) conv.unread++;
    }

    res.json({ data: [...byParty.values()] });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/messages/contacts — people the caller can start a conversation with:
 * the active users in their own school (never themselves).
 */
router.get("/contacts", async (req, res, next) => {
  try {
    const schoolId = req.user!.schoolId;
    const me = norm(req.user!.email);
    const users = await User.find({ schoolId, isActive: true })
      .select("name email role")
      .sort({ name: 1 });
    const contacts = users
      .map((u) => ({ email: norm(u.email), name: u.name, role: u.role }))
      .filter((u) => u.email && u.email !== me);
    res.json({ data: contacts });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/messages/thread/:email — the full conversation between the caller and
 * :email, oldest first, and marks that party's messages to the caller as read.
 */
router.get("/thread/:email", async (req, res, next) => {
  try {
    const schoolId = req.user!.schoolId;
    const me = norm(req.user!.email);
    const other = norm(req.params.email);
    if (!other) throw ApiError.badRequest("A conversation is required.");

    const msgs = await Message.find({
      schoolId,
      $or: [
        { fromEmail: me, toEmail: other },
        { fromEmail: other, toEmail: me },
      ],
    }).sort({ createdAt: 1 });

    // Opening the thread reads the other party's messages to me.
    await Message.updateMany(
      { schoolId, fromEmail: other, toEmail: me, readAt: null },
      { $set: { readAt: new Date() } }
    );

    res.json({
      data: msgs.map((m) => ({
        id: String(m._id),
        mine: norm(m.fromEmail) === me,
        fromName: m.fromName,
        body: m.body,
        at: m.createdAt,
      })),
    });
  } catch (err) {
    next(err);
  }
});

const sendBody = z.object({
  toEmail: z.email("A valid recipient is required"),
  body: z.string().trim().min(1, "Message can't be empty").max(5000, "Message is too long"),
});

/**
 * POST /api/messages — send a message to someone in the caller's school. The
 * sender is always the caller (never trusted from the client); the recipient is
 * re-checked to be a real user in the same school.
 */
router.post("/", validate(sendBody), async (req, res, next) => {
  try {
    const schoolId = req.user!.schoolId;
    const me = norm(req.user!.email);
    const { toEmail, body } = parsed<z.infer<typeof sendBody>>(req, "body");
    const to = norm(toEmail);
    if (!to || to === me) throw ApiError.badRequest("Choose someone else to message.");

    const recipient = await User.findOne({ schoolId, email: to }).select("name role");
    if (!recipient) throw ApiError.notFound("That person isn't in your school.");
    const sender = await User.findOne({ schoolId, email: me }).select("name role");

    const created = await Message.create({
      schoolId,
      fromEmail: me,
      fromName: sender?.name ?? req.user!.email,
      fromRole: sender?.role ?? req.user!.role ?? "",
      toEmail: to,
      toName: recipient.name,
      toRole: recipient.role,
      body: body.trim(),
    });

    res.status(201).json({
      data: { id: String(created._id), mine: true, fromName: created.fromName, body: created.body, at: created.createdAt },
    });
  } catch (err) {
    next(err);
  }
});

export default router;

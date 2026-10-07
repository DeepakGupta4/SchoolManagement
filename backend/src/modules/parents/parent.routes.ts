import { z } from "zod";
import { Parent } from "./parent.model.js";
import { Student } from "../students/student.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";
import { requireRole } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { User, hashPassword } from "../auth/user.model.js";
import { generateTempPassword } from "../../utils/password.js";
import { notifyUser } from "../notifications/notification.model.js";
import { sendEmail, isEmailConfigured } from "../../utils/email.js";

/** Create-a-parent-login payload. */
const inviteSchema = z.object({ name: z.string().default(""), email: z.email() });

/** Compose-a-message payload (sent in-app + by email to the given parents). */
const messageSchema = z.object({
  recipients: z.array(z.email()).min(1, "Pick at least one recipient"),
  title: z.string().min(1, "Subject is required"),
  body: z.string().min(1, "Message is required"),
});

const parentSchema = z.object({
  name: z.string().min(1),
  relation: z.string().default("Guardian"),
  phone: z.string().default(""),
  email: z.string().default(""),
  occupation: z.string().default(""),
  address: z.string().default(""),
  isPrimary: z.boolean().default(false),
  isEmergencyContact: z.boolean().default(false),
  isPickupAuthorized: z.boolean().default(false),
  // Linked student `_id`s — see parent.model.ts for why ids over admission nos.
  students: z.array(z.string()).default([]),
});

/** Dedupe key: prefer a 10-digit phone, else a lowercased email, else none. */
function contactKey(phone?: string, email?: string): string {
  const p = String(phone ?? "").replace(/\D/g, "").slice(-10);
  if (p.length === 10) return "p:" + p;
  const e = String(email ?? "").trim().toLowerCase();
  return e ? "e:" + e : "";
}

interface DirChild { id: string; name: string; className: string; section: string }
interface DirEntry {
  id: string;
  name: string;
  relation: string;
  phone: string;
  email: string;
  occupation: string;
  address: string;
  isPrimary: boolean;
  isEmergencyContact: boolean;
  isPickupAuthorized: boolean;
  source: "student" | "manual";
  students: string[];
  children: DirChild[];
}

export default createCrudRouter({
  model: Parent,
  createSchema: parentSchema,
  searchFields: ["name", "phone", "email", "occupation"],
  filterFields: ["relation"],
  // Parent contact details are PII — office/HR only.
  readRoles: ["super_admin", "school_admin", "principal", "accountant"],
  // The parents DIRECTORY: derived from every student's guardian/father/mother
  // contacts (deduped by phone/email so one parent with several children collapses
  // to one row with all their children), then merged with any manually-added
  // Parent records. This is what populates the admin Parents page automatically.
  extend: (router) => {
    router.get(
      "/directory",
      requireRole("super_admin", "school_admin", "principal", "accountant"),
      async (req, res, next) => {
        try {
          const schoolId = req.user!.schoolId;
          const [students, manual] = await Promise.all([
            Student.find({ schoolId }).lean(),
            Parent.find({ schoolId }).lean(),
          ]);
          type StudentLean = (typeof students)[number];

          const childOf = (s: StudentLean): DirChild => ({
            id: String(s._id),
            name: `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim(),
            className: s.className ?? "",
            section: s.section ?? "",
          });

          const map = new Map<string, DirEntry>();
          const addContact = (
            c: { name?: string; relation?: string; phone?: string; email?: string; occupation?: string },
            s: StudentLean
          ) => {
            const name = (c.name ?? "").trim();
            const phone = (c.phone ?? "").trim();
            const email = (c.email ?? "").trim().toLowerCase();
            if (!name && !phone && !email) return;
            const key = contactKey(phone, email);
            if (!key) return; // no stable key to dedupe on — skip
            let e = map.get(key);
            if (!e) {
              e = {
                id: "d:" + key,
                name,
                relation: c.relation || "Guardian",
                phone,
                email,
                occupation: (c.occupation ?? "").trim(),
                address: "",
                isPrimary: false,
                isEmergencyContact: false,
                isPickupAuthorized: false,
                source: "student",
                students: [],
                children: [],
              };
              map.set(key, e);
            } else {
              if (!e.name && name) e.name = name;
              if (!e.phone && phone) e.phone = phone;
              if (!e.email && email) e.email = email;
              if (!e.occupation && c.occupation) e.occupation = c.occupation.trim();
            }
            const cid = String(s._id);
            if (!e.students.includes(cid)) {
              e.students.push(cid);
              e.children.push(childOf(s));
            }
          };

          for (const s of students) {
            if (s.guardian) {
              addContact(
                {
                  name: s.guardian.name,
                  relation: s.guardian.relation || "Guardian",
                  phone: s.guardian.phone,
                  email: s.guardian.email,
                  occupation: s.guardian.occupation,
                },
                s
              );
            }
            if (s.fatherName || s.fatherPhone || s.fatherEmail) {
              addContact(
                { name: s.fatherName, relation: "Father", phone: s.fatherPhone, email: s.fatherEmail, occupation: s.fatherOccupation },
                s
              );
            }
            if (s.motherName || s.motherPhone || s.motherEmail) {
              addContact(
                { name: s.motherName, relation: "Mother", phone: s.motherPhone, email: s.motherEmail, occupation: s.motherOccupation },
                s
              );
            }
          }

          // Merge manually-added Parent records (editable; keyed by contact).
          const studentById = new Map(students.map((s) => [String(s._id), s]));
          for (const p of manual) {
            const manualChildren: DirChild[] = (p.students ?? [])
              .map((id) => studentById.get(id))
              .filter((s): s is StudentLean => Boolean(s))
              .map(childOf);
            const key = contactKey(p.phone, p.email);
            const existing = key ? map.get(key) : undefined;
            if (existing) {
              existing.id = String(p._id);
              existing.source = "manual";
              if (p.name) existing.name = p.name;
              if (p.relation) existing.relation = p.relation;
              if (p.phone) existing.phone = p.phone;
              if (p.email) existing.email = p.email.toLowerCase();
              if (p.occupation) existing.occupation = p.occupation;
              if (p.address) existing.address = p.address;
              existing.isPrimary = Boolean(p.isPrimary);
              existing.isEmergencyContact = Boolean(p.isEmergencyContact);
              existing.isPickupAuthorized = Boolean(p.isPickupAuthorized);
              for (const c of manualChildren) {
                if (!existing.students.includes(c.id)) {
                  existing.students.push(c.id);
                  existing.children.push(c);
                }
              }
            } else {
              map.set(key || "m:" + String(p._id), {
                id: String(p._id),
                name: p.name,
                relation: p.relation || "Guardian",
                phone: p.phone ?? "",
                email: (p.email ?? "").toLowerCase(),
                occupation: p.occupation ?? "",
                address: p.address ?? "",
                isPrimary: Boolean(p.isPrimary),
                isEmergencyContact: Boolean(p.isEmergencyContact),
                isPickupAuthorized: Boolean(p.isPickupAuthorized),
                source: "manual",
                students: manualChildren.map((c) => c.id),
                children: manualChildren,
              });
            }
          }

          const data = [...map.values()]
            .map((e) => ({ ...e, childCount: e.children.length }))
            .sort((a, b) => a.name.localeCompare(b.name));
          res.json({ data });
        } catch (err) {
          next(err);
        }
      }
    );

    // Create a parent login (role "parent") so they can sign in to the portal.
    // The portal matches their children by this login email, so invite with the
    // same email that's on the child's record. Returns the temp password once.
    router.post(
      "/invite",
      requireRole("super_admin", "school_admin", "principal"),
      validate(inviteSchema),
      async (req, res, next) => {
        try {
          const { name, email } = req.body as z.infer<typeof inviteSchema>;
          const lower = email.toLowerCase();
          const schoolId = req.user!.schoolId;
          const existing = await User.findOne({ email: lower });
          if (existing) {
            res.json({ data: { email: lower, existing: true } });
            return;
          }
          const tempPassword = generateTempPassword();
          await User.create({
            name: name.trim() || lower,
            email: lower,
            passwordHash: await hashPassword(tempPassword),
            role: "parent",
            schoolId,
          });
          res.status(201).json({ data: { email: lower, temporaryPassword: tempPassword, existing: false } });
        } catch (err) {
          next(err);
        }
      }
    );

    // Message parents — one in-app notification per recipient (shows in their
    // portal) plus an email when mail is configured. Best-effort per recipient.
    router.post(
      "/message",
      requireRole("super_admin", "school_admin", "principal"),
      validate(messageSchema),
      async (req, res, next) => {
        try {
          const { recipients, title, body } = req.body as z.infer<typeof messageSchema>;
          const schoolId = req.user!.schoolId;
          const emailConfigured = isEmailConfigured();
          const unique = [...new Set(recipients.map((e) => e.toLowerCase()))];
          let emailed = 0;
          for (const email of unique) {
            await notifyUser({ schoolId, email, type: "parent_message", title, body, link: "/dashboard" });
            if (emailConfigured) {
              const r = await sendEmail({
                to: email,
                subject: title,
                text: body,
                html: `<p>${body.replace(/\n/g, "<br/>")}</p>`,
              });
              if (r.delivered) emailed++;
            }
          }
          res.json({ data: { recipients: unique.length, emailed, emailConfigured } });
        } catch (err) {
          next(err);
        }
      }
    );
  },
});

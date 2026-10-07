import { z } from "zod";
import { Parent } from "./parent.model.js";
import { Student } from "../students/student.model.js";
import { createCrudRouter } from "../../utils/crudRouter.js";
import { requireRole } from "../../middleware/auth.js";

const parentSchema = z.object({
  name: z.string().min(1),
  relation: z.string().default("Guardian"),
  phone: z.string().default(""),
  email: z.string().default(""),
  occupation: z.string().default(""),
  address: z.string().default(""),
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
  },
});

import { apiRequest } from "./client";
import { createApiResource } from "./createApiResource";
import { fetchAllStudents } from "./students";
import { fullName, type Student } from "@/types/student";

export type ParentRelation = "Father" | "Mother" | "Guardian";

export interface Parent {
  id: string;
  name: string;
  relation: ParentRelation;
  phone: string;
  email: string;
  occupation: string;
  address: string;
  /**
   * Linked student ids — each is the `id` the students API returns (the Mongo
   * `_id`), used to resolve a parent's children live from the students data.
   */
  students: string[];
}

export interface ParentFilters {
  search?: string;
  relation?: string;
}

export const RELATION_OPTIONS: { label: string; value: ParentRelation }[] = [
  { label: "Father", value: "Father" },
  { label: "Mother", value: "Mother" },
  { label: "Guardian", value: "Guardian" },
];

export const parentApi = createApiResource<Parent, ParentFilters>("/api/parents");

export interface ParentChild {
  id: string;
  name: string;
  className: string;
  section: string;
}

/**
 * A directory row: parents DERIVED from students' guardian/father/mother data
 * (deduped by phone/email, with their children resolved server-side), merged with
 * any manually-added Parent records. `source: "manual"` rows are editable; `"student"`
 * rows are auto-derived and read-only (edit the student to change them).
 */
export interface ParentDirectoryEntry {
  id: string;
  name: string;
  relation: string;
  phone: string;
  email: string;
  occupation: string;
  address: string;
  source: "student" | "manual";
  /** Linked student ids. */
  students: string[];
  children: ParentChild[];
  childCount: number;
}

const dedupeKey = (phone?: string, email?: string): string => {
  const p = String(phone ?? "").replace(/\D/g, "").slice(-10);
  if (p.length === 10) return "p:" + p;
  const e = String(email ?? "").trim().toLowerCase();
  return e ? "e:" + e : "";
};

/**
 * Builds the parents directory on the CLIENT from the student roster + manual
 * parent records — identical logic to the server's /directory endpoint. Used as
 * a fallback so the page still works if that endpoint isn't available yet (e.g.
 * before the backend is restarted).
 */
function deriveDirectory(students: Student[], manual: Parent[]): ParentDirectoryEntry[] {
  const map = new Map<string, ParentDirectoryEntry>();
  const childOf = (s: Student): ParentChild => ({
    id: s.id,
    name: fullName(s),
    className: s.className,
    section: s.section,
  });
  const add = (
    c: { name?: string; relation?: string; phone?: string; email?: string; occupation?: string },
    s: Student
  ) => {
    const name = (c.name ?? "").trim();
    const phone = (c.phone ?? "").trim();
    const email = (c.email ?? "").trim().toLowerCase();
    if (!name && !phone && !email) return;
    const key = dedupeKey(phone, email);
    if (!key) return;
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
        childCount: 0,
      };
      map.set(key, e);
    } else {
      if (!e.name && name) e.name = name;
      if (!e.phone && phone) e.phone = phone;
      if (!e.email && email) e.email = email;
      if (!e.occupation && c.occupation) e.occupation = c.occupation.trim();
    }
    if (!e.students.includes(s.id)) {
      e.students.push(s.id);
      e.children.push(childOf(s));
    }
  };

  for (const s of students) {
    if (s.guardian) {
      add(
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
      add({ name: s.fatherName, relation: "Father", phone: s.fatherPhone, email: s.fatherEmail, occupation: s.fatherOccupation }, s);
    }
    if (s.motherName || s.motherPhone || s.motherEmail) {
      add({ name: s.motherName, relation: "Mother", phone: s.motherPhone, email: s.motherEmail, occupation: s.motherOccupation }, s);
    }
  }

  const byId = new Map(students.map((s) => [s.id, s]));
  for (const p of manual) {
    const manualChildren = (p.students ?? [])
      .map((id) => byId.get(id))
      .filter((s): s is Student => Boolean(s))
      .map(childOf);
    const key = dedupeKey(p.phone, p.email);
    const existing = key ? map.get(key) : undefined;
    if (existing) {
      existing.id = p.id;
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
      map.set(key || "m:" + p.id, {
        id: p.id,
        name: p.name,
        relation: p.relation || "Guardian",
        phone: p.phone || "",
        email: (p.email || "").toLowerCase(),
        occupation: p.occupation || "",
        address: p.address || "",
        source: "manual",
        students: manualChildren.map((c) => c.id),
        children: manualChildren,
        childCount: 0,
      });
    }
  }

  return [...map.values()]
    .map((e) => ({ ...e, childCount: e.children.length }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * The populated parents directory (auto-derived from students + manual records).
 * Prefers the server's /directory endpoint; falls back to deriving on the client
 * so the page works even before the backend is restarted.
 */
export async function getParentDirectory(): Promise<ParentDirectoryEntry[]> {
  try {
    return await apiRequest<ParentDirectoryEntry[]>("/api/parents/directory");
  } catch {
    const [students, manual] = await Promise.all([
      fetchAllStudents(),
      parentApi.list().catch(() => [] as Parent[]),
    ]);
    return deriveDirectory(students, manual);
  }
}

export interface ParentInviteResult {
  email: string;
  /** The one-time temporary password (only when a new login was created). */
  temporaryPassword?: string;
  /** True when a login for this email already existed (none created). */
  existing: boolean;
}

/** Create a parent login (role "parent") for an email so they can use the portal. */
export async function inviteParent(input: { name: string; email: string }): Promise<ParentInviteResult> {
  return apiRequest<ParentInviteResult>("/api/parents/invite", { method: "POST", body: input });
}

"use client";

import type { Student } from "@/types/student";
import type { SchoolProfile } from "@/lib/api/schools";

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] ?? c));

/** yyyy-mm-dd -> "02 Jan 2015"; leaves other strings as-is. */
function niceDate(s?: string): string {
  if (!s) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return s;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${m[3]} ${months[parseInt(m[2], 10) - 1]} ${m[1]}`;
}

function field(label: string, value: unknown): string {
  const v = String(value ?? "").trim() || "—";
  return `<div class="f"><span class="l">${esc(label)}</span><span class="v">${esc(v)}</span></div>`;
}

/**
 * Opens a print-ready A4 window with a proper school admission form filled from
 * the student (and guardian) record, with photo and signature spaces. The user
 * prints or "Save as PDF". Returns false if the popup was blocked.
 */
export function printAdmissionForm(student: Student, school?: SchoolProfile | null): boolean {
  const w = window.open("", "_blank", "width=900,height=1040");
  if (!w) return false;

  const schoolName = school?.name || "Your School";
  const addr = [school?.address, school?.city, school?.state].filter(Boolean).join(", ");
  const contact = [school?.phone, school?.email].filter(Boolean).join("  ·  ");
  const cls = `${student.className || "—"}${student.section ? " - " + student.section : ""}`;
  const name = `${student.firstName} ${student.lastName}`.trim();

  const logo = school?.logo ? `<img class="logo" src="${esc(school.logo)}" alt=""/>` : "";
  const photo = student.avatar
    ? `<img class="photo" src="${esc(student.avatar)}" alt="Student photo"/>`
    : `<div class="photo ph">Affix recent<br/>photograph</div>`;
  const sign = school?.signatureUrl ? `<img class="sig" src="${esc(school.signatureUrl)}" alt=""/>` : "";

  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Admission Form — ${esc(name)}</title>
<style>
  @page { size: A4; margin: 14mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #0F172A; margin: 0; padding: 20px; font-size: 13px; }
  .head { display: flex; align-items: center; gap: 14px; border-bottom: 2px solid #0F172A; padding-bottom: 12px; }
  .logo { width: 56px; height: 56px; object-fit: contain; }
  .sname { font-size: 24px; font-weight: 800; letter-spacing: .3px; }
  .saddr { font-size: 12px; color: #475569; margin-top: 2px; }
  .title { text-align: center; font-size: 16px; font-weight: 800; letter-spacing: 2px; margin: 16px 0 4px; text-transform: uppercase; }
  .title small { display:block; font-size: 11px; font-weight: 600; letter-spacing: 1px; color:#64748B; margin-top:2px;}
  .top { display: flex; gap: 16px; margin-top: 12px; }
  .top .meta { flex: 1; }
  .photo { width: 120px; height: 150px; object-fit: cover; border: 1.5px solid #334155; border-radius: 4px; }
  .photo.ph { display:flex; align-items:center; justify-content:center; text-align:center; color:#94A3B8; font-size:11px; border-style:dashed; }
  .sec { margin-top: 16px; }
  .sec h3 { font-size: 12.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #4F46E5; background:#EEF0FF; padding:6px 10px; border-radius:6px; margin:0 0 10px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 26px; }
  .f { display:flex; gap:8px; align-items:flex-end; border-bottom:1px dotted #94A3B8; padding:3px 0; }
  .f.full { grid-column: 1 / -1; }
  .l { color:#64748B; font-weight:600; min-width:118px; }
  .v { color:#0F172A; font-weight:600; flex:1; }
  .decl { margin-top:16px; font-size:11.5px; color:#475569; line-height:1.5; border:1px solid #E2E8F0; border-radius:8px; padding:10px 12px; }
  .signs { display:flex; justify-content:space-between; margin-top:38px; gap:20px; }
  .sb { flex:1; text-align:center; }
  .sb .line { border-top:1.5px solid #334155; margin-top:44px; padding-top:6px; font-size:11.5px; font-weight:600; color:#334155; }
  .sb .sig { height:42px; object-fit:contain; display:block; margin:0 auto -6px; }
  .foot { margin-top:22px; text-align:center; font-size:10.5px; color:#94A3B8; border-top:1px solid #E2E8F0; padding-top:8px; }
  .noprint { text-align:center; margin:18px 0; }
  button { padding:9px 18px; font-size:13px; border:1px solid #333; border-radius:6px; background:#f3f3f3; cursor:pointer; }
  @media print { .noprint { display:none; } body { padding:0; } }
</style></head><body>
  <div class="head">${logo}<div><div class="sname">${esc(schoolName)}</div>${addr ? `<div class="saddr">${esc(addr)}</div>` : ""}${contact ? `<div class="saddr">${esc(contact)}</div>` : ""}</div></div>
  <div class="title">Student Admission Form<small>Academic record · ${esc(cls)}</small></div>

  <div class="top">
    <div class="meta grid">
      ${field("Admission No.", student.admissionNo)}
      ${field("Roll No.", student.rollNo)}
      ${field("Class & Section", cls)}
      ${field("Admission Date", niceDate(student.admissionDate))}
      ${field("Status", student.status)}
      ${field("Blood Group", student.bloodGroup)}
    </div>
    <div>${photo}</div>
  </div>

  <div class="sec">
    <h3>Student Details</h3>
    <div class="grid">
      ${field("Full Name", name)}
      ${field("Date of Birth", niceDate(student.dateOfBirth))}
      ${field("Gender", student.gender)}
      ${field("Phone", student.phone)}
      ${field("Email", student.email)}
      ${field("Class", student.className)}
      <div class="f full"><span class="l">Address</span><span class="v">${esc(student.address || "—")}</span></div>
      ${student.medicalNotes ? `<div class="f full"><span class="l">Medical Notes</span><span class="v">${esc(student.medicalNotes)}</span></div>` : ""}
    </div>
  </div>

  <div class="sec">
    <h3>Parent / Guardian Details</h3>
    <div class="grid">
      ${field("Guardian Name", student.guardian?.name)}
      ${field("Relation", student.guardian?.relation)}
      ${field("Phone", student.guardian?.phone)}
      ${field("Email", student.guardian?.email)}
      ${field("Occupation", student.guardian?.occupation)}
    </div>
  </div>

  <div class="decl">I hereby declare that the information provided above is true and correct to the best of my knowledge, and I agree to abide by the rules and regulations of the school.</div>

  <div class="signs">
    <div class="sb"><div class="line">Student's Signature</div></div>
    <div class="sb"><div class="line">Parent / Guardian's Signature</div></div>
    <div class="sb">${sign ? `<img class="sig" src="${esc(school?.signatureUrl)}" alt=""/>` : ""}<div class="line">Principal / Authorised Signatory</div></div>
  </div>

  <div class="foot">Generated on ${esc(niceDate(new Date().toISOString().slice(0, 10)))} · ${esc(schoolName)} · SchoolDeck</div>
  <div class="noprint"><button onclick="window.print()">Print / Save as PDF</button></div>
</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => { try { w.print(); } catch { /* button remains */ } }, 400);
  return true;
}

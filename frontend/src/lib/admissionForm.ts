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

/** Academic session like "2026-27" from an ISO/admission date (April rollover). */
function sessionFrom(iso?: string): string {
  const m = iso && /^(\d{4})-(\d{2})/.exec(iso);
  if (!m) return "";
  const y = parseInt(m[1], 10);
  const mon = parseInt(m[2], 10);
  const start = mon >= 4 ? y : y - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

export function printAdmissionForm(student: Student, school?: SchoolProfile | null): boolean {
  const w = window.open("", "_blank", "width=900,height=1040");
  if (!w) return false;
  w.document.write(buildAdmissionFormHtml(student, school));
  w.document.close();
  w.focus();
  setTimeout(() => { try { w.print(); } catch { /* button remains */ } }, 400);
  return true;
}

/** Builds the full admission-form HTML document (pure; renderable anywhere). */
export function buildAdmissionFormHtml(student: Student, school?: SchoolProfile | null): string {
  const schoolName = school?.name || "Your School";
  const addr = [school?.address, school?.city, school?.state].filter(Boolean).join(", ");
  const contact = [school?.phone, school?.email, school?.website].filter(Boolean).join("  ·  ");
  const cls = `${student.className || ""}${student.section ? " - " + student.section : ""}`;
  const name = `${student.firstName} ${student.lastName}`.trim();
  const rel = (student.guardian?.relation || "").toLowerCase();
  const gName = student.guardian?.name || "";
  const gPhone = student.guardian?.phone || "";
  const gOcc = student.guardian?.occupation || "";
  const isFather = rel.includes("father");
  const isMother = rel.includes("mother");

  const logo = school?.logo ? `<img class="logo" src="${esc(school.logo)}" alt=""/>` : `<div class="logo ph"></div>`;
  const photo = student.avatar
    ? `<img class="photo" src="${esc(student.avatar)}" alt="Photo"/>`
    : `<div class="photo ph">Affix recent<br/>passport-size<br/>photograph</div>`;
  const sign = school?.signatureUrl ? `<img class="osign" src="${esc(school.signatureUrl)}" alt=""/>` : "";

  // one label/value cell pair; blank value renders as a fillable line
  const V = (v: unknown) => (String(v ?? "").trim() ? `<b>${esc(v)}</b>` : "");
  const chk = (label: string, on = false) =>
    `<span class="chk"><span class="box">${on ? "✓" : ""}</span>${esc(label)}</span>`;

  return `<!doctype html><html><head><meta charset="utf-8"><title>Admission Form — ${esc(name)}</title>
<style>
  @page { size: A4; margin: 10mm 10mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color:#111827; margin:0; padding:14px; font-size:11.5px; }
  .sheet { border:1.5px solid #111827; }
  .head { display:flex; align-items:center; gap:12px; padding:10px 14px; border-bottom:1.5px solid #111827; }
  .logo { width:52px; height:52px; object-fit:contain; }
  .logo.ph { border:1px dashed #9CA3AF; border-radius:6px; }
  .head .mid { flex:1; text-align:center; }
  .sname { font-size:22px; font-weight:800; letter-spacing:.3px; }
  .saddr { font-size:10.5px; color:#374151; margin-top:1px; }
  .head .right { font-size:10px; text-align:right; min-width:120px; }
  .head .right div { margin-bottom:3px; }
  .u { display:inline-block; min-width:70px; border-bottom:1px solid #6B7280; padding:0 4px; font-weight:700; }
  .titlebar { text-align:center; font-size:13px; font-weight:800; letter-spacing:2px; padding:5px; background:#111827; color:#fff; text-transform:uppercase; }
  .applied { display:flex; }
  .applied .l { flex:1; padding:8px 14px; border-right:1.5px solid #111827; }
  .applied .ph { width:118px; padding:6px; display:flex; align-items:center; justify-content:center; }
  .photo { width:104px; height:124px; object-fit:cover; border:1px solid #374151; }
  .photo.ph { width:104px; height:124px; border:1px dashed #9CA3AF; display:flex; align-items:center; justify-content:center; text-align:center; color:#9CA3AF; font-size:9.5px; line-height:1.4; }
  .sec-h { background:#EEF0FF; color:#312E81; font-weight:800; font-size:11px; letter-spacing:.8px; text-transform:uppercase; padding:5px 14px; border-top:1.5px solid #111827; border-bottom:1px solid #C7CBF5; }
  table.grid { width:100%; border-collapse:collapse; }
  table.grid td { border:1px solid #D1D5DB; padding:6px 10px; vertical-align:top; height:26px; }
  td.lab { background:#F8FAFC; color:#475569; font-weight:600; width:22%; white-space:nowrap; }
  td.val { width:28%; }
  td.val b { font-weight:700; color:#0F172A; }
  .chk { display:inline-block; margin-right:14px; white-space:nowrap; }
  .box { display:inline-block; width:13px; height:13px; border:1.2px solid #374151; margin-right:5px; text-align:center; line-height:12px; font-weight:800; vertical-align:-2px; }
  .decl { padding:8px 14px; font-size:10.5px; color:#374151; line-height:1.5; border-top:1.5px solid #111827; }
  .signs { display:flex; border-top:1px solid #D1D5DB; }
  .signs .sb { flex:1; text-align:center; padding:30px 10px 8px; font-weight:700; font-size:10.5px; border-right:1px solid #D1D5DB; }
  .signs .sb:last-child { border-right:none; }
  .office { border-top:1.5px solid #111827; }
  .office .oh { background:#111827; color:#fff; font-weight:800; font-size:10.5px; letter-spacing:1px; padding:4px 14px; text-transform:uppercase; }
  .osign { height:34px; object-fit:contain; display:block; margin:0 auto 2px; }
  .foot { text-align:center; font-size:9.5px; color:#9CA3AF; margin-top:8px; }
  .noprint { text-align:center; margin:14px 0; }
  button { padding:9px 18px; font-size:13px; border:1px solid #333; border-radius:6px; background:#f3f3f3; cursor:pointer; }
  @media print { .noprint { display:none; } body { padding:0; } }
</style></head><body>
<div class="sheet">
  <div class="head">
    ${logo}
    <div class="mid"><div class="sname">${esc(schoolName)}</div>${addr ? `<div class="saddr">${esc(addr)}</div>` : ""}${contact ? `<div class="saddr">${esc(contact)}</div>` : ""}</div>
    <div class="right"><div>Form No: <span class="u">${esc(student.admissionNo || "")}</span></div><div>Session: <span class="u">${esc(sessionFrom(student.admissionDate) || sessionFrom(new Date().toISOString()))}</span></div></div>
  </div>
  <div class="titlebar">Application for Admission</div>

  <div class="applied">
    <div class="l">
      Class applied for: <span class="u">${esc(student.className || "")}</span>
      &nbsp;&nbsp;Section: <span class="u">${esc(student.section || "")}</span><br/><br/>
      Admission No: <span class="u">${esc(student.admissionNo || "")}</span>
      &nbsp;&nbsp;Roll No: <span class="u">${esc(student.rollNo || "")}</span><br/><br/>
      Date of Admission: <span class="u">${esc(niceDate(student.admissionDate))}</span>
    </div>
    <div class="ph">${photo}</div>
  </div>

  <div class="sec-h">1. Student's Particulars</div>
  <table class="grid">
    <tr><td class="lab">Full Name</td><td class="val" colspan="3"><b>${esc(name)}</b></td></tr>
    <tr><td class="lab">Date of Birth</td><td class="val">${V(niceDate(student.dateOfBirth))}</td><td class="lab">Gender</td><td class="val">${V(student.gender)}</td></tr>
    <tr><td class="lab">Blood Group</td><td class="val">${V(student.bloodGroup)}</td><td class="lab">Nationality</td><td class="val"></td></tr>
    <tr><td class="lab">Religion</td><td class="val"></td><td class="lab">Mother Tongue</td><td class="val"></td></tr>
    <tr><td class="lab">Category</td><td class="val" colspan="3">${chk("General")}${chk("OBC")}${chk("SC")}${chk("ST")}${chk("Other")}</td></tr>
    <tr><td class="lab">Aadhaar No.</td><td class="val"></td><td class="lab">Place of Birth</td><td class="val"></td></tr>
  </table>

  <div class="sec-h">2. Parent / Guardian Details</div>
  <table class="grid">
    <tr><td class="lab">Father's Name</td><td class="val">${V(isFather ? gName : "")}</td><td class="lab">Occupation</td><td class="val">${V(isFather ? gOcc : "")}</td></tr>
    <tr><td class="lab">Father's Mobile</td><td class="val">${V(isFather ? gPhone : "")}</td><td class="lab">Father's Email</td><td class="val">${V(isFather ? student.guardian?.email : "")}</td></tr>
    <tr><td class="lab">Mother's Name</td><td class="val">${V(isMother ? gName : "")}</td><td class="lab">Occupation</td><td class="val">${V(isMother ? gOcc : "")}</td></tr>
    <tr><td class="lab">Mother's Mobile</td><td class="val">${V(isMother ? gPhone : "")}</td><td class="lab">Mother's Email</td><td class="val">${V(isMother ? student.guardian?.email : "")}</td></tr>
    <tr><td class="lab">Guardian (if any)</td><td class="val">${V(!isFather && !isMother ? gName : "")}</td><td class="lab">Relation / Mobile</td><td class="val">${V(!isFather && !isMother && gName ? `${student.guardian?.relation || ""}  ${gPhone}` : "")}</td></tr>
    <tr><td class="lab">Annual Income</td><td class="val"></td><td class="lab">Student Mobile</td><td class="val">${V(student.phone)}</td></tr>
  </table>

  <div class="sec-h">3. Contact &amp; Address</div>
  <table class="grid">
    <tr><td class="lab">Permanent Address</td><td class="val" colspan="3"><b>${esc(student.address || "")}</b></td></tr>
    <tr><td class="lab">Correspondence Address</td><td class="val" colspan="3"></td></tr>
    <tr><td class="lab">Email</td><td class="val"><b>${esc(student.email || "")}</b></td><td class="lab">Emergency Contact</td><td class="val"></td></tr>
  </table>

  <div class="sec-h">4. Previous School (if applicable)</div>
  <table class="grid">
    <tr><td class="lab">Last School Attended</td><td class="val" colspan="3"></td></tr>
    <tr><td class="lab">Class Passed</td><td class="val"></td><td class="lab">Board</td><td class="val"></td></tr>
    <tr><td class="lab">T.C. Number</td><td class="val"></td><td class="lab">Result / %</td><td class="val"></td></tr>
  </table>

  <div class="sec-h">5. Transport, Medical &amp; Documents Enclosed</div>
  <table class="grid">
    <tr><td class="lab">Transport Required</td><td class="val">${chk("Yes")}${chk("No")}</td><td class="lab">Pick-up Point / Route</td><td class="val"></td></tr>
    <tr><td class="lab">Medical Conditions</td><td class="val" colspan="3"><b>${esc(student.medicalNotes || "")}</b></td></tr>
    <tr><td class="lab">Documents</td><td class="val" colspan="3">${chk("Birth Certificate")}${chk("Aadhaar Card")}${chk("Transfer Certificate")}${chk("Prev. Marksheet")}${chk("Photographs")}${chk("Caste Certificate")}</td></tr>
  </table>

  <div class="decl">
    <b>Declaration:</b> I hereby declare that the information furnished above is true and correct to the best of my knowledge and belief. I undertake that my ward will abide by the rules and regulations of the school. I shall not hold the school responsible for any mis-statement made by me.
  </div>
  <div class="signs">
    <div class="sb"><br/>Student's Signature</div>
    <div class="sb"><br/>Parent / Guardian's Signature</div>
    <div class="sb"><br/>Date</div>
  </div>

  <div class="office">
    <div class="oh">For Office Use Only</div>
    <table class="grid">
      <tr><td class="lab">Class &amp; Section Allotted</td><td class="val">${V(cls)}</td><td class="lab">Roll No.</td><td class="val">${V(student.rollNo)}</td></tr>
      <tr><td class="lab">Admission No.</td><td class="val">${V(student.admissionNo)}</td><td class="lab">Fee Received (₹)</td><td class="val"></td></tr>
      <tr><td class="lab">Remarks</td><td class="val" colspan="3"></td></tr>
      <tr><td class="lab">Verified By</td><td class="val"></td><td class="lab" style="text-align:center">Principal / Authorised Signatory</td><td class="val" style="text-align:center">${sign}</td></tr>
    </table>
  </div>
</div>
<div class="foot">Generated on ${esc(niceDate(new Date().toISOString().slice(0, 10)))} · ${esc(schoolName)} · SchoolDeck</div>
<div class="noprint"><button onclick="window.print()">Print / Save as PDF</button></div>
</body></html>`;
}

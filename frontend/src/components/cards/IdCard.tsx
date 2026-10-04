"use client";

import { GraduationCap, MapPin, Phone } from "lucide-react";
import { PhotoFrame } from "./PhotoFrame";
import { QrCode } from "./QrCode";
import { ID_CARD_TEMPLATES, type IdCardTemplate } from "./idCardTemplates";
import { academicYear } from "@/lib/dates";
import type { SchoolIdentity } from "@/lib/schoolIdentity";

export interface IdCardHolder {
  id: string;
  name: string;
  /** "Student" | "Teacher" | "Staff" — printed in the title band. */
  role: string;
  /** Admission no. for students, employee ID for staff. */
  identifier: string;
  identifierLabel: string;
  /** Class + section, or department. */
  affiliation: string;
  /** Roll number (students only) — folded into the QR identity payload. */
  rollNo?: string;
  /** Date of birth (ISO yyyy-mm-dd) — folded into the QR identity payload. */
  dob?: string;
  bloodGroup?: string;
  phone?: string;
  guardianOrDesignation?: string;
  guardianLabel?: string;
  validTill: string;
  photo?: string;
  /** Home address for the "if found" strip. */
  address?: string;
}

/**
 * The string encoded in the card's QR: a compact, self-contained identity
 * record. No public verify route exists, so rather than a URL the QR carries
 * the holder's verifiable details directly — a generic scanner reads them
 * offline, with no network dependency. The identifier (admission no. / employee
 * ID) makes every payload unique per holder, for students and staff alike.
 *
 * Pure: derived only from its arguments, so it is safe to call in render.
 */
export function idCardPayload(holder: IdCardHolder, schoolName?: string): string {
  const record: Record<string, string> = {
    typ: "SCHOOLDECK-ID",
    role: holder.role,
    name: holder.name,
    id: holder.identifier,
    idType: holder.identifierLabel,
    for: holder.affiliation,
    valid: holder.validTill,
  };
  if (schoolName) record.school = schoolName;
  if (holder.rollNo) record.roll = holder.rollNo;
  if (holder.dob) record.dob = holder.dob;
  return JSON.stringify(record);
}

/** One detail row in the card body. */
function Row({ label, value, accentClass }: { label: string; value: string; accentClass?: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-slate-100 py-[3px] last:border-0">
      <span className="shrink-0 text-[7.5px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <span className={`truncate text-right text-[9px] font-semibold ${accentClass ?? "text-slate-800"}`}>
        {value}
      </span>
    </div>
  );
}

/**
 * Vertical (lanyard) school ID card at portrait CR80 proportions
 * (54 × 85.6 mm ≈ 0.631:1) — the format Indian schools actually print.
 *
 * Colours are fixed per `template` rather than themed: a printed card must look
 * identical regardless of the operator's light/dark preference.
 */
export function IdCard({
  holder,
  signatureUrl,
  school,
  template = ID_CARD_TEMPLATES[0],
  sessionLabel = academicYear().label,
}: {
  holder: IdCardHolder;
  /** Authorised signature image (data URL) from the live school profile. */
  signatureUrl?: string;
  /** Live school identity for the masthead, footer and QR payload. */
  school?: SchoolIdentity;
  /** Visual design to render. Defaults to the first template. */
  template?: IdCardTemplate;
  /** Academic-year badge, e.g. "2026-27". */
  sessionLabel?: string;
}) {
  const t = template;
  return (
    <div className="id-card relative mx-auto flex w-full max-w-75 flex-col overflow-hidden rounded-2xl bg-white text-slate-900 shadow-lg ring-1 ring-slate-200">
      {/* Header crest band */}
      <div className={`relative shrink-0 overflow-hidden px-3 pb-5 pt-3 text-white ${t.header}`}>
        {/* Decorative rings */}
        <div className="pointer-events-none absolute -right-6 -top-8 size-24 rounded-full bg-white/10" aria-hidden />
        <div className="pointer-events-none absolute -right-2 top-6 size-14 rounded-full bg-white/10" aria-hidden />
        <div className={`relative flex gap-2 ${t.center ? "flex-col items-center text-center" : "items-center"}`}>
          <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl ring-1 backdrop-blur ${t.crestTile}`}>
            <GraduationCap className="size-5" />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[12px] font-extrabold uppercase tracking-wide">{school?.name || "Your School"}</p>
            {(school?.addressLine || school?.affiliation) && (
              <p className="truncate text-[7px] font-medium opacity-85">
                {[school?.addressLine, school?.affiliation].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Title strip — overlaps the header for a layered look */}
      <div className={`relative z-10 -mt-3 mx-3 flex items-center justify-between rounded-lg px-3 py-1 shadow-md ${t.strip}`}>
        <span className="text-[7.5px] font-bold uppercase tracking-[0.18em]">
          {holder.role} Identity Card
        </span>
        <span className="rounded bg-white/15 px-1.5 py-0.5 text-[6.5px] font-semibold">{sessionLabel}</span>
      </div>

      {/* Photo + name */}
      <div className="flex shrink-0 flex-col items-center gap-1 px-3 pt-2.5">
        <div className={`rounded-xl p-[3px] shadow-sm ring-1 ${t.photoWrap}`}>
          <PhotoFrame src={holder.photo} name={holder.name} className="w-[64px] rounded-lg" />
        </div>
        <div className="text-center leading-tight">
          <p className="text-[13px] font-bold text-slate-900">{holder.name}</p>
          <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[7.5px] font-bold uppercase tracking-wide ring-1 ${t.chip}`}>
            {holder.affiliation}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="px-3 pt-2">
        <div className="rounded-lg bg-slate-50 px-2.5 py-1 ring-1 ring-slate-100">
          <Row label={holder.identifierLabel} value={holder.identifier} />
          {holder.guardianOrDesignation && (
            <Row label={holder.guardianLabel ?? "Guardian"} value={holder.guardianOrDesignation} />
          )}
          {holder.phone && <Row label="Phone" value={holder.phone} />}
          {holder.bloodGroup && <Row label="Blood Group" value={holder.bloodGroup} accentClass={t.blood} />}
          <Row label="Valid Till" value={holder.validTill} />
        </div>

        {/* QR + signature */}
        <div className="mt-2.5 flex items-end justify-between">
          <div className="flex flex-col items-center gap-0.5">
            <QrCode value={idCardPayload(holder, school?.name)} className="size-12" />
            <span className="text-[5.5px] font-medium uppercase tracking-wide text-slate-400">Scan to verify</span>
          </div>
          <div className="text-center">
            {signatureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={signatureUrl}
                alt="Authorised signature"
                className="mx-auto h-5 w-16 object-contain"
              />
            ) : (
              <div className="h-5 w-16 border-b border-slate-300" />
            )}
            <p className="mt-0.5 text-[6.5px] italic text-slate-400">Principal</p>
          </div>
        </div>
      </div>

      {/* If-found footer */}
      <div className={`mt-2 shrink-0 space-y-0.5 px-3 py-1.5 text-white ${t.footer}`}>
        <p className="flex items-center gap-1 text-[6.5px] opacity-90">
          <MapPin className="size-2 shrink-0" />
          <span className="truncate">
            If found, return to {school?.name || "the school"}
            {school?.addressLine ? `, ${school.addressLine}` : ""}
          </span>
        </p>
        {school?.phone && (
          <p className="flex items-center gap-1 text-[6.5px] opacity-90">
            <Phone className="size-2 shrink-0" />
            {school.phone}
          </p>
        )}
      </div>
    </div>
  );
}

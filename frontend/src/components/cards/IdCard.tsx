"use client";

import { GraduationCap, MapPin, Phone } from "lucide-react";
import { PhotoFrame } from "./PhotoFrame";
import { QrCode } from "./QrCode";

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
  bloodGroup?: string;
  phone?: string;
  guardianOrDesignation?: string;
  guardianLabel?: string;
  validTill: string;
  photo?: string;
  /** Home address for the "if found" strip. */
  address?: string;
}

/** One detail row in the card body. */
function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-slate-100 py-[3px] last:border-0">
      <span className="shrink-0 text-[7.5px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <span
        className={`truncate text-right text-[9px] font-semibold ${
          accent ? "text-rose-600" : "text-slate-800"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * Vertical (lanyard) school ID card at portrait CR80 proportions
 * (54 × 85.6 mm ≈ 0.631:1) — the format Indian schools actually print.
 *
 * Colours are fixed rather than themed: a printed card must look identical
 * regardless of the operator's light/dark preference.
 */
export function IdCard({ holder }: { holder: IdCardHolder }) {
  return (
    <div className="id-card relative mx-auto flex w-full max-w-75 flex-col overflow-hidden rounded-2xl bg-white text-slate-900 shadow-lg ring-1 ring-slate-200">
      {/* Header crest band */}
      <div className="relative shrink-0 overflow-hidden bg-linear-to-br from-indigo-600 via-indigo-600 to-violet-600 px-3 pb-5 pt-3 text-white">
        {/* Decorative rings */}
        <div className="pointer-events-none absolute -right-6 -top-8 size-24 rounded-full bg-white/10" aria-hidden />
        <div className="pointer-events-none absolute -right-2 top-6 size-14 rounded-full bg-white/10" aria-hidden />
        <div className="relative flex items-center gap-2">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/40 backdrop-blur">
            <GraduationCap className="size-5" />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[12px] font-extrabold uppercase tracking-wide">Springdale School</p>
            <p className="truncate text-[7px] font-medium opacity-85">Mayur Vihar, New Delhi · CBSE 2730123</p>
          </div>
        </div>
      </div>

      {/* Title strip — overlaps the header for a layered look */}
      <div className="relative z-10 -mt-3 mx-3 flex items-center justify-between rounded-lg bg-slate-900 px-3 py-1 text-white shadow-md">
        <span className="text-[7.5px] font-bold uppercase tracking-[0.18em]">
          {holder.role} Identity Card
        </span>
        <span className="rounded bg-white/15 px-1.5 py-0.5 text-[6.5px] font-semibold">2025-26</span>
      </div>

      {/* Photo + name */}
      <div className="flex shrink-0 flex-col items-center gap-1 px-3 pt-2.5">
        <div className="rounded-xl bg-linear-to-br from-indigo-100 to-violet-100 p-[3px] shadow-sm ring-1 ring-indigo-200">
          <PhotoFrame src={holder.photo} name={holder.name} className="w-[64px] rounded-lg" />
        </div>
        <div className="text-center leading-tight">
          <p className="text-[13px] font-bold text-slate-900">{holder.name}</p>
          <span className="mt-0.5 inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-[7.5px] font-bold uppercase tracking-wide text-indigo-600 ring-1 ring-indigo-100">
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
          {holder.bloodGroup && <Row label="Blood Group" value={holder.bloodGroup} accent />}
          <Row label="Valid Till" value={holder.validTill} />
        </div>

        {/* QR + signature */}
        <div className="mt-2.5 flex items-end justify-between">
          <div className="flex flex-col items-center gap-0.5">
            <QrCode value={`${holder.identifier}|${holder.name}`} className="size-12" />
            <span className="text-[5.5px] font-medium uppercase tracking-wide text-slate-400">Scan to verify</span>
          </div>
          <div className="text-center">
            <div className="h-5 w-16 border-b border-slate-300" />
            <p className="mt-0.5 text-[6.5px] italic text-slate-400">Principal</p>
          </div>
        </div>
      </div>

      {/* If-found footer */}
      <div className="mt-2 shrink-0 space-y-0.5 bg-linear-to-r from-slate-900 to-slate-800 px-3 py-1.5 text-white">
        <p className="flex items-center gap-1 text-[6.5px] opacity-90">
          <MapPin className="size-2 shrink-0" />
          <span className="truncate">
            If found, return to Springdale School, Mayur Vihar, New Delhi 110091
          </span>
        </p>
        <p className="flex items-center gap-1 text-[6.5px] opacity-90">
          <Phone className="size-2 shrink-0" />
          011-2345-6789
        </p>
      </div>
    </div>
  );
}

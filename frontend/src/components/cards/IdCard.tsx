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

/**
 * Vertical (lanyard) school ID card at portrait CR80 proportions
 * (54 × 85.6 mm ≈ 0.631:1) — the format Indian schools actually print.
 *
 * Colours are fixed rather than themed: a printed card must look identical
 * regardless of the operator's light/dark preference.
 */
export function IdCard({ holder }: { holder: IdCardHolder }) {
  return (
    <div
      className="id-card relative flex w-full flex-col overflow-hidden rounded-xl bg-white text-slate-900 shadow-md ring-1 ring-slate-200"
      style={{ aspectRatio: "0.631 / 1" }}
    >
      {/* Header crest band */}
      <div className="relative shrink-0 bg-linear-to-br from-indigo-600 to-violet-600 px-3 pb-3 pt-3 text-white">
        <div className="flex items-center gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/30">
            <GraduationCap className="size-4" />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[11px] font-bold uppercase tracking-wide">Springdale School</p>
            <p className="truncate text-[7px] opacity-80">Mayur Vihar, New Delhi · CBSE 2730123</p>
          </div>
        </div>
      </div>

      {/* Title strip */}
      <div className="flex shrink-0 items-center justify-between bg-slate-900 px-3 py-1 text-white">
        <span className="text-[8px] font-bold uppercase tracking-[0.15em]">
          {holder.role} Identity Card
        </span>
        <span className="text-[7px] opacity-70">2025-26</span>
      </div>

      {/* Photo + name */}
      <div className="flex shrink-0 flex-col items-center gap-1.5 px-3 pt-3">
        <PhotoFrame src={holder.photo} name={holder.name} className="w-[38%] shadow-sm" />
        <div className="text-center leading-tight">
          <p className="text-[13px] font-bold">{holder.name}</p>
          <p className="text-[8px] font-semibold uppercase tracking-wide text-indigo-600">
            {holder.affiliation}
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="min-h-0 flex-1 px-3 pt-2.5">
        <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.75 text-[8px] leading-tight">
          <dt className="font-semibold text-slate-500">{holder.identifierLabel}</dt>
          <dd className="truncate text-right font-mono font-medium">{holder.identifier}</dd>

          {holder.guardianOrDesignation && (
            <>
              <dt className="font-semibold text-slate-500">{holder.guardianLabel}</dt>
              <dd className="truncate text-right font-medium">{holder.guardianOrDesignation}</dd>
            </>
          )}

          {holder.phone && (
            <>
              <dt className="font-semibold text-slate-500">Phone</dt>
              <dd className="truncate text-right font-medium">{holder.phone}</dd>
            </>
          )}

          {holder.bloodGroup && (
            <>
              <dt className="font-semibold text-slate-500">Blood Group</dt>
              <dd className="text-right font-bold text-rose-600">{holder.bloodGroup}</dd>
            </>
          )}

          <dt className="font-semibold text-slate-500">Valid Till</dt>
          <dd className="truncate text-right font-medium">{holder.validTill}</dd>
        </dl>

        {/* QR + signature */}
        <div className="mt-2.5 flex items-end justify-between">
          <QrCode value={`${holder.identifier}|${holder.name}`} className="size-11" />
          <div className="text-center">
            <div className="h-5 w-16 border-b border-slate-300" />
            <p className="mt-0.5 text-[6.5px] italic text-slate-400">Principal</p>
          </div>
        </div>
      </div>

      {/* If-found footer */}
      <div className="mt-2 shrink-0 space-y-0.5 bg-slate-900 px-3 py-1.5 text-white">
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

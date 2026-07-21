"use client";

import { Droplet, Phone, School } from "lucide-react";
import { Avatar } from "@/components/ui";
import { QrCode } from "./QrCode";

export interface IdCardHolder {
  id: string;
  name: string;
  /** "Student" | "Teacher" | "Staff" — printed above the name. */
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
}

/**
 * Front face of a school ID card at CR80 proportions (85.6 × 54 mm ≈ 1.585:1),
 * so what's on screen matches what comes off a PVC card printer.
 *
 * Colours here are deliberately fixed rather than themed — a printed card
 * must look identical regardless of the operator's light/dark preference.
 */
export function IdCard({ holder }: { holder: IdCardHolder }) {
  return (
    <div
      className="id-card relative flex w-full flex-col overflow-hidden rounded-lg bg-white text-slate-900 shadow-md ring-1 ring-slate-200"
      style={{ aspectRatio: "1.585 / 1" }}
    >
      {/* Masthead */}
      <div className="flex shrink-0 items-center gap-2 bg-indigo-600 px-3 py-2 text-white">
        <div className="flex size-6 shrink-0 items-center justify-center rounded bg-white/20">
          <School className="size-3.5" />
        </div>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[10px] font-bold uppercase tracking-wide">Springdale School</p>
          <p className="truncate text-[7px] opacity-80">New Delhi · CBSE Affiliated</p>
        </div>
        <span className="ml-auto shrink-0 rounded bg-white/20 px-1.5 py-0.5 text-[7px] font-bold uppercase">
          {holder.role}
        </span>
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1 gap-2.5 p-2.5">
        <div className="flex shrink-0 flex-col items-center gap-1">
          <Avatar
            name={holder.name}
            src={holder.photo}
            className="size-[52px] rounded-md ring-2 ring-indigo-100"
          />
          <QrCode value={`${holder.identifier}|${holder.name}`} className="size-[34px]" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center gap-[3px]">
          <p className="truncate text-[13px] font-bold leading-tight">{holder.name}</p>
          <p className="truncate text-[8px] font-medium text-indigo-600">{holder.affiliation}</p>

          <dl className="mt-0.5 grid grid-cols-[auto_1fr] gap-x-1.5 gap-y-[2px] text-[7.5px] leading-tight">
            <dt className="font-semibold text-slate-500">{holder.identifierLabel}</dt>
            <dd className="truncate font-mono">{holder.identifier}</dd>

            {holder.guardianOrDesignation && (
              <>
                <dt className="font-semibold text-slate-500">{holder.guardianLabel}</dt>
                <dd className="truncate">{holder.guardianOrDesignation}</dd>
              </>
            )}

            {holder.phone && (
              <>
                <dt className="font-semibold text-slate-500">Phone</dt>
                <dd className="truncate">{holder.phone}</dd>
              </>
            )}
          </dl>

          <div className="mt-auto flex items-center gap-2 pt-1">
            {holder.bloodGroup && (
              <span className="inline-flex items-center gap-0.5 rounded bg-rose-50 px-1 py-[1px] text-[7px] font-bold text-rose-600">
                <Droplet className="size-2" />
                {holder.bloodGroup}
              </span>
            )}
            <span className="text-[7px] text-slate-500">Valid till {holder.validTill}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-2.5 py-1">
        <span className="inline-flex items-center gap-1 text-[7px] text-slate-500">
          <Phone className="size-2" />
          011-2345-6789
        </span>
        <span className="text-[7px] italic text-slate-400">Principal</span>
      </div>
    </div>
  );
}

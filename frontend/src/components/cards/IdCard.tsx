"use client";

import { GraduationCap, MapPin, Phone } from "lucide-react";
import { PhotoFrame } from "./PhotoFrame";
import { QrCode } from "./QrCode";
import { ID_CARD_TEMPLATES, type IdCardTemplate } from "./idCardTemplates";
import { academicYear } from "@/lib/dates";
import { cn } from "@/lib/utils";
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
 * offline. Pure: derived only from its arguments, so safe to call in render.
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

const ROOT =
  "id-card relative mx-auto flex w-full max-w-75 flex-col overflow-hidden rounded-2xl bg-white text-slate-900 shadow-lg ring-1 ring-slate-200";

// ─── Shared primitives ──────────────────────────────────────────────────────

/** The real school logo when available, else a neutral graduation-cap mark. */
function Logo({ school, iconClass = "size-5" }: { school?: SchoolIdentity; iconClass?: string }) {
  return school?.logo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={school.logo} alt="School logo" className="size-full object-contain p-0.5" />
  ) : (
    <GraduationCap className={iconClass} />
  );
}

/** Logo inside a themed tile (used on coloured headers). */
function Crest({
  school,
  tile,
  size = "size-9",
  icon = "size-5",
}: {
  school?: SchoolIdentity;
  tile: string;
  size?: string;
  icon?: string;
}) {
  return (
    <div className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-xl ring-1 backdrop-blur", size, tile)}>
      <Logo school={school} iconClass={icon} />
    </div>
  );
}

/** School name + address/affiliation line. Inherits the parent's text colour. */
function Masthead({ school, className }: { school?: SchoolIdentity; className?: string }) {
  return (
    <div className={cn("min-w-0 leading-tight", className)}>
      <p className="truncate text-[12px] font-extrabold uppercase tracking-wide">{school?.name || "Your School"}</p>
      {(school?.addressLine || school?.affiliation) && (
        <p className="truncate text-[7px] font-medium opacity-85">
          {[school?.addressLine, school?.affiliation].filter(Boolean).join(" · ")}
        </p>
      )}
    </div>
  );
}

function Rings() {
  return (
    <>
      <div className="pointer-events-none absolute -right-6 -top-8 size-24 rounded-full bg-white/10" aria-hidden />
      <div className="pointer-events-none absolute -right-2 top-6 size-14 rounded-full bg-white/10" aria-hidden />
    </>
  );
}

function Row({ label, value, accentClass }: { label: string; value: string; accentClass?: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-slate-100 py-[3px] last:border-0">
      <span className="shrink-0 text-[7.5px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <span className={cn("truncate text-right text-[9px] font-semibold", accentClass ?? "text-slate-800")}>{value}</span>
    </div>
  );
}

function DetailRows({ holder, bloodClass, showBlood = true }: { holder: IdCardHolder; bloodClass: string; showBlood?: boolean }) {
  return (
    <>
      <Row label={holder.identifierLabel} value={holder.identifier} />
      {holder.guardianOrDesignation && <Row label={holder.guardianLabel ?? "Guardian"} value={holder.guardianOrDesignation} />}
      {holder.phone && <Row label="Phone" value={holder.phone} />}
      {showBlood && holder.bloodGroup && <Row label="Blood Group" value={holder.bloodGroup} accentClass={bloodClass} />}
      <Row label="Valid Till" value={holder.validTill} />
    </>
  );
}

function GridItem({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="min-w-0 border-b border-slate-100 py-0.5">
      <p className="text-[6.5px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={cn("truncate text-[9px] font-semibold", valueClass ?? "text-slate-800")}>{value}</p>
    </div>
  );
}

function Chip({ text, className }: { text: string; className: string }) {
  return (
    <span className={cn("inline-block rounded-full px-2 py-0.5 text-[7px] font-bold uppercase tracking-wide ring-1", className)}>
      {text}
    </span>
  );
}

function QrBlock({ holder, schoolName, size = "size-12" }: { holder: IdCardHolder; schoolName?: string; size?: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <QrCode value={idCardPayload(holder, schoolName)} className={size} />
      <span className="text-[5.5px] font-medium uppercase tracking-wide text-slate-400">Scan to verify</span>
    </div>
  );
}

function SignBlock({ signatureUrl }: { signatureUrl?: string }) {
  return (
    <div className="text-center">
      {signatureUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={signatureUrl} alt="Authorised signature" className="mx-auto h-5 w-16 object-contain" />
      ) : (
        <div className="h-5 w-16 border-b border-slate-300" />
      )}
      <p className="mt-0.5 text-[6.5px] italic text-slate-400">Principal</p>
    </div>
  );
}

function Footer({ school, footerClass }: { school?: SchoolIdentity; footerClass: string }) {
  return (
    <div className={cn("mt-2 shrink-0 space-y-0.5 px-3 py-1.5 text-white", footerClass)}>
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
  );
}

interface CardProps {
  holder: IdCardHolder;
  school?: SchoolIdentity;
  signatureUrl?: string;
  t: IdCardTemplate;
  sessionLabel: string;
}

// ─── Layout 1: crest (classic, overlapping title strip) ─────────────────────
function CrestCard({ holder, school, signatureUrl, t, sessionLabel }: CardProps) {
  return (
    <div className={ROOT}>
      <div className={cn("relative shrink-0 overflow-hidden px-3 pb-5 pt-3 text-white", t.header)}>
        <Rings />
        <div className={cn("relative flex gap-2", t.center ? "flex-col items-center text-center" : "items-center")}>
          <Crest school={school} tile={t.crestTile} />
          <Masthead school={school} />
        </div>
      </div>
      <div className={cn("relative z-10 -mt-3 mx-3 flex items-center justify-between rounded-lg px-3 py-1 shadow-md", t.strip)}>
        <span className="text-[7.5px] font-bold uppercase tracking-[0.18em]">{holder.role} Identity Card</span>
        <span className="rounded bg-white/15 px-1.5 py-0.5 text-[6.5px] font-semibold">{sessionLabel}</span>
      </div>
      <div className="flex shrink-0 flex-col items-center gap-1 px-3 pt-2.5">
        <div className={cn("rounded-xl p-[3px] shadow-sm ring-1", t.photoWrap)}>
          <PhotoFrame src={holder.photo} name={holder.name} className="w-[64px] rounded-lg" />
        </div>
        <div className="text-center leading-tight">
          <p className="text-[13px] font-bold text-slate-900">{holder.name}</p>
          <div className="mt-0.5">
            <Chip text={holder.affiliation} className={t.chip} />
          </div>
        </div>
      </div>
      <div className="px-3 pt-2">
        <div className="rounded-lg bg-slate-50 px-2.5 py-1 ring-1 ring-slate-100">
          <DetailRows holder={holder} bloodClass={t.blood} />
        </div>
        <div className="mt-2.5 flex items-end justify-between">
          <QrBlock holder={holder} schoolName={school?.name} />
          <SignBlock signatureUrl={signatureUrl} />
        </div>
      </div>
      <Footer school={school} footerClass={t.footer} />
    </div>
  );
}

// ─── Layout 2: banner (centred masthead, photo overlaps left) ───────────────
function BannerCard({ holder, school, signatureUrl, t, sessionLabel }: CardProps) {
  return (
    <div className={ROOT}>
      <div className={cn("relative shrink-0 overflow-hidden px-3 pb-8 pt-3 text-center text-white", t.header)}>
        <Rings />
        <span className="absolute right-2 top-2 rounded bg-white/15 px-1.5 py-0.5 text-[6.5px] font-semibold">{sessionLabel}</span>
        <div className="relative flex flex-col items-center gap-1">
          <Crest school={school} tile={t.crestTile} size="size-8" icon="size-4" />
          <Masthead school={school} className="text-center" />
        </div>
      </div>
      <div className="-mt-6 flex items-end gap-3 px-3">
        <div className={cn("shrink-0 rounded-xl p-[3px] shadow-md ring-1", t.photoWrap)}>
          <PhotoFrame src={holder.photo} name={holder.name} className="w-[58px] rounded-lg" />
        </div>
        <div className="min-w-0 pb-1">
          <p className="truncate text-[13px] font-bold text-slate-900">{holder.name}</p>
          <div className="mt-0.5">
            <Chip text={holder.affiliation} className={t.chip} />
          </div>
          <p className="mt-0.5 text-[7px] font-semibold uppercase tracking-wide text-slate-400">{holder.role} ID</p>
        </div>
      </div>
      <div className="px-3 pt-2">
        <div className="rounded-lg bg-slate-50 px-2.5 py-1 ring-1 ring-slate-100">
          <DetailRows holder={holder} bloodClass={t.blood} />
        </div>
        <div className="mt-2.5 flex items-end justify-between">
          <QrBlock holder={holder} schoolName={school?.name} />
          <SignBlock signatureUrl={signatureUrl} />
        </div>
      </div>
      <Footer school={school} footerClass={t.footer} />
    </div>
  );
}

// ─── Layout 3: modern (name left / photo right, 2-col details grid) ─────────
function ModernCard({ holder, school, signatureUrl, t, sessionLabel }: CardProps) {
  return (
    <div className={ROOT}>
      <div className={cn("relative shrink-0 overflow-hidden px-3 py-3 text-white", t.header)}>
        <Rings />
        <div className="relative flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Masthead school={school} />
            <span className="mt-1 inline-block rounded bg-white/15 px-1.5 py-0.5 text-[6.5px] font-semibold">{holder.role} · {sessionLabel}</span>
          </div>
          <Crest school={school} tile={t.crestTile} />
        </div>
      </div>
      <div className="flex items-end justify-between gap-2 px-3 pt-3">
        <div className="min-w-0 pb-1">
          <p className="truncate text-[14px] font-extrabold text-slate-900">{holder.name}</p>
          <div className="mt-0.5">
            <Chip text={holder.affiliation} className={t.chip} />
          </div>
        </div>
        <div className={cn("shrink-0 rounded-xl p-[3px] shadow-sm ring-1", t.photoWrap)}>
          <PhotoFrame src={holder.photo} name={holder.name} className="w-[56px] rounded-lg" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-3 px-3 pt-2">
        <GridItem label={holder.identifierLabel} value={holder.identifier} />
        {holder.guardianOrDesignation && <GridItem label={holder.guardianLabel ?? "Guardian"} value={holder.guardianOrDesignation} />}
        {holder.phone && <GridItem label="Phone" value={holder.phone} />}
        {holder.bloodGroup && <GridItem label="Blood" value={holder.bloodGroup} valueClass={t.blood} />}
        <GridItem label="Valid Till" value={holder.validTill} />
      </div>
      <div className="mt-2 flex items-end justify-between px-3">
        <QrBlock holder={holder} schoolName={school?.name} size="size-11" />
        <SignBlock signatureUrl={signatureUrl} />
      </div>
      <Footer school={school} footerClass={t.footer} />
    </div>
  );
}

// ─── Layout 4: sidebar (vertical coloured rail with the QR) ─────────────────
function SidebarCard({ holder, school, signatureUrl, t, sessionLabel }: CardProps) {
  return (
    <div className={ROOT}>
      <div className="flex">
        <div className={cn("relative flex w-[34%] shrink-0 flex-col items-center gap-2 overflow-hidden px-2 py-3 text-white", t.header)}>
          <Rings />
          <Crest school={school} tile={t.crestTile} size="size-10" />
          <p className="relative text-center text-[7px] font-bold uppercase leading-tight tracking-[0.15em]">
            {holder.role}
            <br />
            ID Card
          </p>
          <div className="relative mt-auto flex flex-col items-center gap-0.5">
            <div className="rounded bg-white p-1">
              <QrCode value={idCardPayload(holder, school?.name)} className="size-10" />
            </div>
            <span className="text-[5px] uppercase tracking-wide opacity-80">{sessionLabel}</span>
          </div>
        </div>
        <div className="min-w-0 flex-1 px-3 py-3">
          <Masthead school={school} />
          <div className="mt-2 flex items-center gap-2">
            <div className={cn("shrink-0 rounded-lg p-[2px] shadow-sm ring-1", t.photoWrap)}>
              <PhotoFrame src={holder.photo} name={holder.name} className="w-[46px] rounded-md" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-bold text-slate-900">{holder.name}</p>
              <div className="mt-0.5">
                <Chip text={holder.affiliation} className={t.chip} />
              </div>
            </div>
          </div>
          <div className="mt-2">
            <DetailRows holder={holder} bloodClass={t.blood} />
          </div>
          <div className="mt-2 flex justify-end">
            <SignBlock signatureUrl={signatureUrl} />
          </div>
        </div>
      </div>
      <Footer school={school} footerClass={t.footer} />
    </div>
  );
}

// ─── Layout 5: split (formal — centred crest, photo left / details right) ───
function SplitCard({ holder, school, signatureUrl, t, sessionLabel }: CardProps) {
  return (
    <div className={ROOT}>
      <div className={cn("relative shrink-0 overflow-hidden px-3 py-2.5 text-center text-white", t.header)}>
        <Rings />
        <div className="relative flex flex-col items-center gap-1">
          <Crest school={school} tile={t.crestTile} />
          <Masthead school={school} className="text-center" />
        </div>
      </div>
      <div className={cn("flex items-center justify-between px-3 py-1 text-white", t.footer)}>
        <span className="text-[7.5px] font-bold uppercase tracking-[0.18em]">{holder.role} Identity Card</span>
        <span className="rounded bg-white/15 px-1.5 py-0.5 text-[6.5px] font-semibold">{sessionLabel}</span>
      </div>
      <div className="flex gap-3 px-3 pt-3">
        <div className={cn("h-fit shrink-0 rounded-xl p-[3px] shadow-sm ring-1", t.photoWrap)}>
          <PhotoFrame src={holder.photo} name={holder.name} className="w-[58px] rounded-lg" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-bold text-slate-900">{holder.name}</p>
          <div className="mt-0.5">
            <Chip text={holder.affiliation} className={t.chip} />
          </div>
          <div className="mt-1">
            <DetailRows holder={holder} bloodClass={t.blood} />
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-end justify-between px-3">
        <QrBlock holder={holder} schoolName={school?.name} />
        <SignBlock signatureUrl={signatureUrl} />
      </div>
      <Footer school={school} footerClass={t.footer} />
    </div>
  );
}

// ─── Layout 6: minimal (flat, airy, neutral) ────────────────────────────────
function MinimalCard({ holder, school, signatureUrl, t, sessionLabel }: CardProps) {
  return (
    <div className={ROOT}>
      <div className={cn("h-1.5 shrink-0", t.header)} />
      <div className="flex flex-col items-center gap-1 px-4 pt-3 text-center text-slate-900">
        <Crest school={school} tile="bg-slate-100 ring-slate-200" size="size-8" icon="size-4 text-slate-700" />
        <Masthead school={school} />
      </div>
      <div className="flex flex-col items-center gap-1 px-4 pt-3">
        <div className={cn("rounded-xl p-[3px] ring-1", t.photoWrap)}>
          <PhotoFrame src={holder.photo} name={holder.name} className="w-[60px] rounded-lg" />
        </div>
        <p className="text-[14px] font-bold text-slate-900">{holder.name}</p>
        <p className="text-[8px] font-semibold uppercase tracking-wide text-slate-500">
          {holder.affiliation} · {holder.role} · {sessionLabel}
        </p>
      </div>
      <div className="px-5 pt-3">
        <DetailRows holder={holder} bloodClass={t.blood} />
      </div>
      <div className="mt-2 flex items-end justify-between px-5 pb-3">
        <QrBlock holder={holder} schoolName={school?.name} size="size-10" />
        <SignBlock signatureUrl={signatureUrl} />
      </div>
      <div className="mt-auto border-t border-slate-100 px-4 py-1.5 text-center text-[6.5px] text-slate-400">
        If found, return to {school?.name || "the school"}
        {school?.addressLine ? `, ${school.addressLine}` : ""}
      </div>
    </div>
  );
}

/**
 * School ID card at portrait CR80 proportions (54 × 85.6 mm). Each template
 * renders a structurally different layout (not just a recolour) and shows the
 * real school logo when the profile has one. Colours are fixed per template so a
 * printed card looks identical regardless of the operator's light/dark theme.
 */
export function IdCard({
  holder,
  signatureUrl,
  school,
  template = ID_CARD_TEMPLATES[0],
  sessionLabel = academicYear().label,
}: {
  holder: IdCardHolder;
  signatureUrl?: string;
  school?: SchoolIdentity;
  template?: IdCardTemplate;
  sessionLabel?: string;
}) {
  const props: CardProps = { holder, school, signatureUrl, t: template, sessionLabel };
  switch (template.layout) {
    case "banner":
      return <BannerCard {...props} />;
    case "modern":
      return <ModernCard {...props} />;
    case "sidebar":
      return <SidebarCard {...props} />;
    case "split":
      return <SplitCard {...props} />;
    case "minimal":
      return <MinimalCard {...props} />;
    default:
      return <CrestCard {...props} />;
  }
}

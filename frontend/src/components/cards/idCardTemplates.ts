/**
 * ID-card visual templates. Each is a set of FIXED colour classes (printed cards
 * must look identical in light/dark), applied by the IdCard component. Class
 * strings are written literally here so Tailwind picks them up.
 *
 * `strip` is kept dark on every template so the year badge (bg-white/15) stays
 * legible; variety comes from the header, accents, photo frame and footer.
 */
export interface IdCardTemplate {
  id: string;
  name: string;
  /** Header band background (the swatch preview uses this too). */
  header: string;
  /** Logo tile inside the header. */
  crestTile: string;
  /** Role/identity strip background + text (kept dark). */
  strip: string;
  /** Affiliation chip under the name: text + bg + ring. */
  chip: string;
  /** Photo frame wrapper: gradient bg + ring. */
  photoWrap: string;
  /** Blood-group value colour. */
  blood: string;
  /** "If found" footer band background. */
  footer: string;
  /** Centered masthead (logo above name) vs left-aligned. */
  center?: boolean;
}

export const ID_CARD_TEMPLATES: IdCardTemplate[] = [
  {
    id: "indigo",
    name: "Classic Indigo",
    header: "bg-linear-to-br from-indigo-600 via-indigo-600 to-violet-600",
    crestTile: "bg-white/20 ring-white/40",
    strip: "bg-slate-900 text-white",
    chip: "bg-indigo-50 text-indigo-600 ring-indigo-100",
    photoWrap: "bg-linear-to-br from-indigo-100 to-violet-100 ring-indigo-200",
    blood: "text-rose-600",
    footer: "bg-linear-to-r from-slate-900 to-slate-800",
  },
  {
    id: "emerald",
    name: "Emerald",
    header: "bg-linear-to-br from-emerald-600 via-emerald-600 to-teal-600",
    crestTile: "bg-white/20 ring-white/40",
    strip: "bg-emerald-950 text-white",
    chip: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    photoWrap: "bg-linear-to-br from-emerald-100 to-teal-100 ring-emerald-200",
    blood: "text-rose-600",
    footer: "bg-linear-to-r from-emerald-950 to-teal-900",
    center: true,
  },
  {
    id: "sunset",
    name: "Sunset",
    header: "bg-linear-to-br from-orange-500 via-rose-500 to-pink-600",
    crestTile: "bg-white/20 ring-white/40",
    strip: "bg-rose-950 text-white",
    chip: "bg-rose-50 text-rose-600 ring-rose-100",
    photoWrap: "bg-linear-to-br from-orange-100 to-rose-100 ring-rose-200",
    blood: "text-rose-700",
    footer: "bg-linear-to-r from-rose-950 to-orange-900",
  },
  {
    id: "navy-gold",
    name: "Navy & Gold",
    header: "bg-linear-to-br from-blue-950 via-blue-900 to-slate-900",
    crestTile: "bg-amber-400/20 ring-amber-300/50",
    strip: "bg-slate-900 text-white",
    chip: "bg-amber-50 text-amber-700 ring-amber-200",
    photoWrap: "bg-linear-to-br from-amber-100 to-yellow-100 ring-amber-200",
    blood: "text-rose-600",
    footer: "bg-linear-to-r from-blue-950 to-slate-900",
    center: true,
  },
  {
    id: "ocean",
    name: "Ocean Teal",
    header: "bg-linear-to-br from-cyan-600 via-sky-600 to-blue-600",
    crestTile: "bg-white/20 ring-white/40",
    strip: "bg-sky-950 text-white",
    chip: "bg-sky-50 text-sky-700 ring-sky-100",
    photoWrap: "bg-linear-to-br from-cyan-100 to-sky-100 ring-sky-200",
    blood: "text-rose-600",
    footer: "bg-linear-to-r from-sky-950 to-cyan-900",
  },
  {
    id: "mono",
    name: "Minimal Mono",
    header: "bg-linear-to-br from-slate-700 via-slate-800 to-slate-900",
    crestTile: "bg-white/15 ring-white/30",
    strip: "bg-slate-900 text-white",
    chip: "bg-slate-100 text-slate-700 ring-slate-200",
    photoWrap: "bg-linear-to-br from-slate-100 to-slate-200 ring-slate-300",
    blood: "text-rose-600",
    footer: "bg-slate-900",
    center: true,
  },
];

export const DEFAULT_TEMPLATE_ID = ID_CARD_TEMPLATES[0].id;

export function getTemplate(id: string | undefined): IdCardTemplate {
  return ID_CARD_TEMPLATES.find((t) => t.id === id) ?? ID_CARD_TEMPLATES[0];
}

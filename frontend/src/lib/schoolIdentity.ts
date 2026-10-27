"use client";

import { useEffect, useMemo, useState } from "react";
import { getMySchool, type SchoolProfile } from "@/lib/api/schools";
import { effectiveScheme, DEFAULT_GRADING_SCHEME, type GradingScheme } from "@/lib/grading";

/**
 * The tenant's identity as printed on official documents (report cards, ID
 * cards, admit cards, receipts, certificates, payslips). Derived from the live
 * school profile so every document carries the REAL school — never a hardcoded
 * placeholder. All fields have safe, generic fallbacks so a missing profile
 * degrades to neutral text rather than another school's name.
 */
export interface SchoolIdentity {
  name: string;
  /** Composed one-line address, e.g. "Mayur Vihar, New Delhi". Empty if unknown. */
  addressLine: string;
  /** Board/affiliation line, e.g. "CBSE Affiliation No. 2730123". Empty if unset. */
  affiliation: string;
  phone: string;
  website: string;
  logo: string;
  /** Brand name shown in the app shell (falls back to the school name). */
  displayName: string;
  /** White-label: show the school's own brand and hide "SchoolDeck". */
  whiteLabel: boolean;
  /** The school's grade bands, for grades printed on report cards. */
  gradingScheme: GradingScheme;
}

export const FALLBACK_SCHOOL_IDENTITY: SchoolIdentity = {
  name: "Your School",
  addressLine: "",
  affiliation: "",
  phone: "",
  website: "",
  logo: "",
  displayName: "",
  whiteLabel: false,
  gradingScheme: DEFAULT_GRADING_SCHEME,
};

/** Pure: compose a SchoolIdentity from a (possibly null) profile. */
export function schoolIdentity(p: SchoolProfile | null | undefined): SchoolIdentity {
  if (!p) return FALLBACK_SCHOOL_IDENTITY;
  const addressLine = [p.address, p.city, p.state]
    .map((s) => (s ?? "").trim())
    .filter(Boolean)
    .join(", ");
  return {
    name: p.name?.trim() || FALLBACK_SCHOOL_IDENTITY.name,
    addressLine,
    affiliation: (p.affiliation ?? "").trim(),
    phone: (p.phone ?? "").trim(),
    website: (p.website ?? "").trim(),
    logo: (p.logo ?? "").trim(),
    displayName: (p.displayName ?? "").trim(),
    whiteLabel: Boolean(p.whiteLabel),
    gradingScheme: effectiveScheme(p.gradingScheme),
  };
}

/**
 * Loads the signed-in school's identity once, for document headers. A single
 * fetch per page — pass the result down to every card rather than letting each
 * card fetch (a bulk ID-card / admit-card page renders many at once).
 */
export function useSchoolIdentity(): { identity: SchoolIdentity; profile: SchoolProfile | null; loading: boolean } {
  const [profile, setProfile] = useState<SchoolProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getMySchool()
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .catch(() => {
        /* non-critical: fall back to neutral identity */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Memoised so the identity reference is stable across renders (only changes
  // when the profile loads) — consumers can safely use it in deps / pass it down.
  const identity = useMemo(() => schoolIdentity(profile), [profile]);
  return { identity, profile, loading };
}

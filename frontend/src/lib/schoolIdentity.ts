"use client";

import { useEffect, useMemo, useState } from "react";
import { getMySchool, type SchoolProfile } from "@/lib/api/schools";

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
}

export const FALLBACK_SCHOOL_IDENTITY: SchoolIdentity = {
  name: "Your School",
  addressLine: "",
  affiliation: "",
  phone: "",
  website: "",
  logo: "",
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

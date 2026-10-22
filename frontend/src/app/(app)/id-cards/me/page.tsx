"use client";

import { useEffect, useState } from "react";
import { IdCard as IdCardIcon, Printer } from "lucide-react";
import {
  Button, Card, CardContent, EmptyState, PageHeader, Skeleton,
} from "@/components/ui";
import { IdCard, IdCardBack, type IdCardHolder } from "@/components/cards/IdCard";
import { ID_CARD_TEMPLATES, getTemplate } from "@/components/cards/idCardTemplates";
import { getMyTeacher } from "@/lib/api/teachers";
import { getMySchool } from "@/lib/api/schools";
import { schoolIdentity, FALLBACK_SCHOOL_IDENTITY, type SchoolIdentity } from "@/lib/schoolIdentity";
import { academicYear } from "@/lib/dates";
import { useAuthStore } from "@/store";
import { cn } from "@/lib/utils";
import { teacherName, type Teacher } from "@/types/teacher";

const ACADEMIC = academicYear();
// A teacher's own self-service pick — a NEW key, kept separate from the office
// bulk page's "teacherIdCardTemplate" so a staff member's personal choice never
// overwrites (or is overwritten by) the operator's print-sheet design.
const TEMPLATE_STORAGE_KEY = "myIdCardTemplate";

/**
 * Maps a teacher record onto the ID-card holder shape, photo included.
 * Copied verbatim from the office Teacher ID Cards page so both render an
 * identical card for the same teacher.
 */
function toHolder(t: Teacher): IdCardHolder {
  return {
    id: t.id,
    name: teacherName(t),
    role: "Teacher",
    identifier: t.employeeId,
    identifierLabel: "Emp. ID",
    affiliation: t.department,
    dob: t.dateOfBirth,
    phone: t.phone,
    guardianOrDesignation: t.qualification,
    guardianLabel: "Qualification",
    validTill: ACADEMIC.validTill,
    photo: t.avatar || undefined,
    address: t.address,
  };
}

export default function MyIdCardPage() {
  // Used only to personalise the "not linked yet" notice with the login email.
  const user = useAuthStore((s) => s.user);

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);

  // Live school profile → the QR's school name and the card's signature image.
  const [signatureUrl, setSignatureUrl] = useState("");
  const [identity, setIdentity] = useState<SchoolIdentity>(FALLBACK_SCHOOL_IDENTITY);

  // Load the teacher's OWN record plus the school profile together. allSettled so
  // a missing/neutral school profile never blocks the card from rendering.
  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([getMyTeacher(), getMySchool()])
      .then(([mine, school]) => {
        if (cancelled) return;
        if (mine.status === "fulfilled") setTeacher(mine.value);
        if (school.status === "fulfilled" && school.value) {
          setSignatureUrl(school.value.signatureUrl || "");
          setIdentity(schoolIdentity(school.value));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Chosen card design, remembered per teacher. Default first; restored from
  // localStorage post-mount (avoids any SSR/hydration mismatch) — mirrors the
  // office page.
  const [templateId, setTemplateId] = useState(ID_CARD_TEMPLATES[0].id);
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(TEMPLATE_STORAGE_KEY);
    } catch {
      saved = null;
    }
    if (!saved || !ID_CARD_TEMPLATES.some((t) => t.id === saved)) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTemplateId(saved);
  }, []);
  const template = getTemplate(templateId);
  const chooseTemplate = (id: string) => {
    setTemplateId(id);
    try {
      localStorage.setItem(TEMPLATE_STORAGE_KEY, id);
    } catch {
      /* ignore — a remembered template is a convenience, not required */
    }
  };

  // Which face to show (and therefore print). The back works for a teacher
  // holder too, so a simple toggle lets staff print either side.
  const [showBack, setShowBack] = useState(false);

  // Only the `.print-sheet` (the card) survives @media print; the browser's
  // print dialog doubles as the "download as PDF" path.
  const handlePrint = () => window.print();

  return (
    <div className="flex flex-col gap-5">
      <div className="print-hide flex flex-col gap-5">
        <PageHeader
          title="My ID Card"
          description="View, choose a design, and print your staff ID card."
          actions={
            teacher ? (
              <Button onClick={handlePrint}>
                <Printer className="size-4" />
                Download / Print
              </Button>
            ) : undefined
          }
        />

        {teacher && (
          <>
            {/* Card design picker — persisted to localStorage under myIdCardTemplate. */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs font-medium text-muted">Design</span>
              {ID_CARD_TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => chooseTemplate(t.id)}
                  aria-pressed={templateId === t.id}
                  title={t.name}
                  className={cn(
                    "focus-ring flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                    templateId === t.id
                      ? "border-primary bg-primary-soft text-primary-text"
                      : "border-border text-muted hover:border-border-strong hover:text-text"
                  )}
                >
                  <span className={cn("size-4 rounded-full ring-1 ring-black/10", t.header)} aria-hidden />
                  {t.name}
                </button>
              ))}
            </div>

            {/* Front / back face toggle. */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-xs font-medium text-muted">Side</span>
              <Button
                variant={showBack ? "outline" : "primary"}
                size="sm"
                onClick={() => setShowBack(false)}
                aria-pressed={!showBack}
              >
                Front
              </Button>
              <Button
                variant={showBack ? "primary" : "outline"}
                size="sm"
                onClick={() => setShowBack(true)}
                aria-pressed={showBack}
              >
                Back
              </Button>
            </div>
          </>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center">
          <Skeleton className="h-[480px] w-full max-w-75 rounded-2xl" />
        </div>
      ) : !teacher ? (
        <Card className="print-hide">
          <EmptyState
            icon={<IdCardIcon className="size-5" />}
            title="Your teacher profile isn't linked yet"
            description={`Ask your school admin to add you under Teachers with this email${
              user?.email ? ` (${user.email})` : ""
            }. Once linked, your staff ID card will appear here.`}
          />
        </Card>
      ) : (
        <div className="print-sheet flex flex-col items-center gap-3">
          {showBack ? (
            <IdCardBack
              holder={toHolder(teacher)}
              signatureUrl={signatureUrl}
              school={identity}
              template={template}
              sessionLabel={ACADEMIC.label}
            />
          ) : (
            <IdCard
              holder={toHolder(teacher)}
              signatureUrl={signatureUrl}
              school={identity}
              template={template}
              sessionLabel={ACADEMIC.label}
            />
          )}
        </div>
      )}

      <CardContent className="print-hide px-0 text-xs text-subtle">
        Your card renders at portrait CR80 size (54 × 85.6 mm). The photo, employee ID and other details
        come from your teacher record — ask the school office to update them if anything looks wrong. Each
        card carries a scannable QR encoding your employee ID and name.
      </CardContent>
    </div>
  );
}

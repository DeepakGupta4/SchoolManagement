"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckSquare, IdCard as IdCardIcon, Printer, Search, Square, Users } from "lucide-react";
import {
  Badge, Button, Card, CardContent, EmptyState, Input, PageHeader, Select, Skeleton, StatCard, useToast,
} from "@/components/ui";
import { IdCard, type IdCardHolder } from "@/components/cards/IdCard";
import { ID_CARD_TEMPLATES, getTemplate } from "@/components/cards/idCardTemplates";
import { useAsyncList } from "@/hooks/useAsyncList";
import { fetchAllTeachers, DEPARTMENT_OPTIONS } from "@/lib/api/teachers";
import { getMySchool } from "@/lib/api/schools";
import { schoolIdentity, FALLBACK_SCHOOL_IDENTITY, type SchoolIdentity } from "@/lib/schoolIdentity";
import { academicYear } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { teacherName, type Teacher } from "@/types/teacher";

const ACADEMIC = academicYear();
// Separate from the student key so staff and student cards can use different designs.
const TEMPLATE_STORAGE_KEY = "teacherIdCardTemplate";

/** Maps a teacher record onto the ID-card holder shape, photo included. */
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

export default function TeacherIdCardsPage() {
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  // Stat-card quick filter for photo status, applied client-side to the cards.
  const [photo, setPhoto] = useState<"all" | "with" | "without">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Live school profile → the QR's school name and each card's signature image.
  // Read once here so a signature uploaded in Settings shows on every card.
  const [signatureUrl, setSignatureUrl] = useState("");
  const [identity, setIdentity] = useState<SchoolIdentity>(FALLBACK_SCHOOL_IDENTITY);
  useEffect(() => {
    let cancelled = false;
    getMySchool()
      .then((s) => {
        if (cancelled || !s) return;
        setSignatureUrl(s.signatureUrl || "");
        setIdentity(schoolIdentity(s));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Chosen card design, remembered per operator. Default first; restored from
  // localStorage post-mount (avoids any SSR/hydration mismatch).
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

  // The COMPLETE staff set (all pages) so a large school is never truncated —
  // ID cards are printed for everyone, not a capped page. A photo added on the
  // teacher form appears here automatically.
  const fetcher = useCallback(() => fetchAllTeachers({ search }), [search]);
  const { items: allTeachers, loading } = useAsyncList<Teacher>(fetcher);

  // `department` isn't a fetchAllTeachers query param, so narrow it client-side.
  const teachers = useMemo(
    () => (department ? allTeachers.filter((t) => t.department === department) : allTeachers),
    [allTeachers, department]
  );

  // Photo quick-filter drives the displayed cards; stat counts stay on `teachers`.
  const displayed = useMemo(() => {
    if (photo === "with") return teachers.filter((t) => t.avatar);
    if (photo === "without") return teachers.filter((t) => !t.avatar);
    return teachers;
  }, [teachers, photo]);

  const cards = useMemo(() => displayed.map(toHolder), [displayed]);
  const withPhoto = useMemo(() => teachers.filter((t) => t.avatar).length, [teachers]);

  // Group staff by department (alphabetical), each department's staff sorted by
  // name, so the sheet prints department-wise.
  const groups = useMemo(() => {
    const map = new Map<string, Teacher[]>();
    for (const t of displayed) {
      const key = t.department || "Unassigned";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => teacherName(a).localeCompare(teacherName(b)));
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [displayed]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      // Set is mutable, so it must be cloned before mutating or React sees no change.
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allVisibleSelected = cards.length > 0 && cards.every((c) => selected.has(c.id));

  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) cards.forEach((c) => next.delete(c.id));
      else cards.forEach((c) => next.add(c.id));
      return next;
    });

  const printCount = selected.size > 0 ? selected.size : cards.length;

  const handlePrint = () => {
    if (printCount === 0) {
      toast({ title: "Nothing to print", description: "No cards match the current filters.", variant: "warning" });
      return;
    }
    toast({
      title: `Preparing ${printCount} card${printCount > 1 ? "s" : ""}`,
      description: "Your browser's print dialog will open.",
    });
    // Let the toast paint before the print dialog blocks the main thread.
    setTimeout(() => window.print(), 250);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="print-hide flex flex-col gap-5">
        <PageHeader
          title="Teacher ID Cards"
          description="Generate, preview and print staff identity cards."
          actions={
            <Button onClick={handlePrint}>
              <Printer className="size-4" />
              Print {selected.size > 0 ? `${selected.size} selected` : "all shown"}
            </Button>
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total staff"
            value={teachers.length}
            icon={Users}
            tone="indigo"
            active={!search && !department && photo === "all"}
            onClick={() => {
              setSearch("");
              setDepartment("");
              setPhoto("all");
            }}
          />
          <StatCard
            label="With photo"
            value={withPhoto}
            icon={IdCardIcon}
            tone="emerald"
            active={photo === "with"}
            onClick={() => setPhoto(photo === "with" ? "all" : "with")}
          />
          <StatCard
            label="Photo pending"
            value={teachers.length - withPhoto}
            icon={Printer}
            tone="amber"
            active={photo === "without"}
            onClick={() => setPhoto(photo === "without" ? "all" : "without")}
          />
          <StatCard label="Selected" value={selected.size} icon={CheckSquare} tone="violet" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-60 flex-1">
            <Input
              type="search"
              placeholder="Search by name or employee ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="size-4" />}
              aria-label="Search teachers"
            />
          </div>
          <div className="w-52">
            <Select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="All departments"
              options={DEPARTMENT_OPTIONS.map((d) => ({ label: d, value: d }))}
              aria-label="Filter by department"
            />
          </div>
          <Button variant="outline" onClick={toggleAll} disabled={cards.length === 0}>
            {allVisibleSelected ? <Square className="size-4" /> : <CheckSquare className="size-4" />}
            {allVisibleSelected ? "Clear selection" : "Select all"}
          </Button>
        </div>

        {/* Card design picker — staff cards are single-sided (no reverse face). */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-medium text-muted">Template</span>
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
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-80 w-full max-w-75" />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <Card className="print-hide">
          <EmptyState
            icon={<IdCardIcon className="size-5" />}
            title="No staff found"
            description="Try clearing the search or department filter."
          />
        </Card>
      ) : (
        <div className="print-sheet flex flex-col gap-8">
          {groups.map(([dept, group]) => (
            <section key={dept}>
              {/* Department heading */}
              <div className="mb-3 flex items-center gap-2 border-b border-border pb-2">
                <h3 className="text-sm font-semibold text-text">{dept}</h3>
                <Badge variant="info">{group.length} card{group.length === 1 ? "" : "s"}</Badge>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {group.map((t) => {
                  const holder = toHolder(t);
                  const isSelected = selected.has(holder.id);
                  const dimmed = selected.size > 0 && !isSelected;
                  return (
                    <div key={holder.id} className={dimmed ? "print-hide" : undefined}>
                      <button
                        onClick={() => toggle(holder.id)}
                        aria-pressed={isSelected}
                        aria-label={`Select ID card for ${holder.name}`}
                        className="focus-ring print-hide mx-auto mb-2 flex w-full max-w-75 items-center gap-2 rounded-md px-1 text-left text-xs text-muted transition-colors hover:text-text"
                      >
                        {isSelected ? (
                          <CheckSquare className="size-4 text-primary" />
                        ) : (
                          <Square className="size-4" />
                        )}
                        <span className="truncate">{holder.name}</span>
                        {t.avatar && (
                          <span className="ml-auto shrink-0 rounded-full bg-success-soft px-1.5 py-0.5 text-[10px] font-medium text-success-text">
                            Photo
                          </span>
                        )}
                      </button>
                      <div className="flex flex-col items-center gap-3">
                        <IdCard
                          holder={holder}
                          signatureUrl={signatureUrl}
                          school={identity}
                          template={template}
                          sessionLabel={ACADEMIC.label}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <CardContent className="print-hide px-0 text-xs text-subtle">
        Cards render at portrait CR80 size (54 × 85.6 mm). Add a staff photo from the teacher form and it
        appears here automatically. Each card carries a scannable QR encoding the employee ID and name.
      </CardContent>
    </div>
  );
}

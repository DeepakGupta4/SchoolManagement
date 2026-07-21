"use client";

import { useMemo, useState } from "react";
import { CheckSquare, FileText, Printer, Search, Square, TriangleAlert, Users } from "lucide-react";
import {
  Badge, Button, Card, EmptyState, Input, PageHeader, Select, StatCard, useToast,
} from "@/components/ui";
import { AdmitCard, type AdmitCardData, type AdmitCardSubject } from "@/components/cards/AdmitCard";

const CLASSES = ["Class 9", "Class 10"];
const SECTIONS = ["A", "B", "C"];
const EXAMS = ["Mid-Term Examination 2025-26", "Final Examination 2025-26"];
const FIRST = ["Aarav", "Ananya", "Vivaan", "Diya", "Ishaan", "Saanvi", "Kabir", "Myra", "Arjun", "Kiara", "Rohan", "Tara"];
const LAST = ["Sharma", "Verma", "Patel", "Gupta", "Singh", "Reddy", "Nair", "Iyer"];
const FATHER = ["Rajesh", "Manoj", "Sanjay", "Alok", "Naveen", "Vijay"];

const SCHEDULE: AdmitCardSubject[] = [
  { subject: "English", date: "02 Mar 2026", day: "Monday", timing: "10:00 – 13:00", room: "A-101" },
  { subject: "Hindi", date: "04 Mar 2026", day: "Wednesday", timing: "10:00 – 13:00", room: "A-101" },
  { subject: "Mathematics", date: "06 Mar 2026", day: "Friday", timing: "10:00 – 13:00", room: "A-102" },
  { subject: "Science", date: "09 Mar 2026", day: "Monday", timing: "10:00 – 13:00", room: "A-102" },
  { subject: "Social Science", date: "11 Mar 2026", day: "Wednesday", timing: "10:00 – 13:00", room: "A-103" },
  { subject: "Computer Applications", date: "13 Mar 2026", day: "Friday", timing: "10:00 – 12:00", room: "Lab-2" },
];

function pick<T>(arr: T[], seed: number) {
  return arr[seed % arr.length];
}

/** `feeCleared` gates eligibility — schools withhold admit cards over unpaid fees. */
const candidates: (AdmitCardData & { feeCleared: boolean })[] = Array.from({ length: 15 }, (_, i) => {
  const first = FIRST[i % FIRST.length];
  const last = pick(LAST, i * 3 + 1);
  const className = pick(CLASSES, i * 2 + 1);
  const section = pick(SECTIONS, i * 5 + 2);

  return {
    id: `adm_${String(i + 1).padStart(3, "0")}`,
    studentName: `${first} ${last}`,
    rollNo: String(i + 1).padStart(2, "0"),
    admissionNo: `ADM${2024001 + i}`,
    className,
    section,
    examName: pick(EXAMS, i),
    session: "2025-26",
    centreCode: "DL-0731",
    centreName: "Springdale School, Mayur Vihar",
    fatherName: `${pick(FATHER, i * 4 + 1)} ${last}`,
    subjects: SCHEDULE,
    feeCleared: i % 5 !== 0,
  };
});

export default function AdmitCardsPage() {
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [className, setClassName] = useState("");
  const [exam, setExam] = useState(EXAMS[0]);
  const [onlyEligible, setOnlyEligible] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return candidates.filter((c) => {
      if (className && c.className !== className) return false;
      if (onlyEligible && !c.feeCleared) return false;
      if (!q) return true;
      return (
        c.studentName.toLowerCase().includes(q) ||
        c.admissionNo.toLowerCase().includes(q) ||
        c.rollNo.includes(q)
      );
    });
  }, [search, className, onlyEligible]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      // Set is mutable, so it must be cloned before mutating or React sees no change.
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allVisibleSelected = filtered.length > 0 && filtered.every((c) => selected.has(c.id));

  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) filtered.forEach((c) => next.delete(c.id));
      else filtered.forEach((c) => next.add(c.id));
      return next;
    });

  const printCount = selected.size > 0 ? selected.size : filtered.length;
  const blockedCount = candidates.filter((c) => !c.feeCleared).length;

  const handlePrint = () => {
    if (printCount === 0) {
      toast({ title: "Nothing to print", description: "No candidates match the current filters.", variant: "warning" });
      return;
    }
    toast({
      title: `Preparing ${printCount} admit card${printCount > 1 ? "s" : ""}`,
      description: "Your browser's print dialog will open.",
    });
    setTimeout(() => window.print(), 250);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="print-hide flex flex-col gap-5">
        <PageHeader
          title="Admit Cards"
          description="Generate and print examination admit cards."
          actions={
            <Button onClick={handlePrint}>
              <Printer className="size-4" />
              Print {selected.size > 0 ? `${selected.size} selected` : "all shown"}
            </Button>
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total candidates" value={candidates.length} icon={Users} tone="indigo" />
          <StatCard
            label="Eligible"
            value={candidates.length - blockedCount}
            icon={FileText}
            tone="emerald"
            sub="Fees cleared"
          />
          <StatCard
            label="Withheld"
            value={blockedCount}
            icon={TriangleAlert}
            tone="rose"
            sub="Pending fees"
          />
          <StatCard label="Selected" value={selected.size} icon={CheckSquare} tone="violet" />
        </div>

        {blockedCount > 0 && (
          <Card className="border-warning">
            <div className="flex items-start gap-3 px-5 py-4">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" />
              <p className="text-sm text-muted">
                <span className="font-medium text-text">{blockedCount} students</span> have pending fees and are
                withheld from admit-card generation. Turn off &ldquo;Eligible only&rdquo; to review them.
              </p>
            </div>
          </Card>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-60 flex-1">
            <Input
              type="search"
              placeholder="Search by name, roll no. or admission no.…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="size-4" />}
              aria-label="Search candidates"
            />
          </div>
          <div className="w-64">
            <Select
              value={exam}
              onChange={(e) => setExam(e.target.value)}
              options={EXAMS.map((x) => ({ label: x, value: x }))}
              aria-label="Select examination"
            />
          </div>
          <div className="w-40">
            <Select
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="All classes"
              options={CLASSES.map((c) => ({ label: c, value: c }))}
              aria-label="Filter by class"
            />
          </div>
          <Button
            variant={onlyEligible ? "primary" : "outline"}
            onClick={() => setOnlyEligible((v) => !v)}
            aria-pressed={onlyEligible}
          >
            Eligible only
          </Button>
          <Button variant="outline" onClick={toggleAll} disabled={filtered.length === 0}>
            {allVisibleSelected ? <Square className="size-4" /> : <CheckSquare className="size-4" />}
            {allVisibleSelected ? "Clear selection" : "Select all"}
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="print-hide">
          <EmptyState
            icon={<FileText className="size-5" />}
            title="No candidates found"
            description="Try clearing the filters or turning off “Eligible only”."
          />
        </Card>
      ) : (
        <div className="print-sheet grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => {
            const isSelected = selected.has(c.id);
            const dimmed = selected.size > 0 && !isSelected;
            return (
              <div key={c.id} className={dimmed ? "print-hide" : undefined}>
                <button
                  onClick={() => toggle(c.id)}
                  aria-pressed={isSelected}
                  aria-label={`Select admit card for ${c.studentName}`}
                  className="focus-ring print-hide mb-2 flex w-full items-center gap-2 rounded-md px-1 text-left text-xs text-muted transition-colors hover:text-text"
                >
                  {isSelected ? (
                    <CheckSquare className="size-4 text-primary" />
                  ) : (
                    <Square className="size-4" />
                  )}
                  <span className="truncate">
                    {c.studentName} · Roll {c.rollNo}
                  </span>
                  {!c.feeCleared && (
                    <Badge variant="danger" className="ml-auto shrink-0">
                      Fees due
                    </Badge>
                  )}
                </button>
                <AdmitCard data={{ ...c, examName: exam }} />
              </div>
            );
          })}
        </div>
      )}

      <p className="print-hide text-xs text-subtle">
        Admit cards render at A5 portrait (148 × 210 mm). The QR block is a visual placeholder — it is not yet scannable.
      </p>
    </div>
  );
}

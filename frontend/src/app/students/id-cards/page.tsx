"use client";

import { useMemo, useState } from "react";
import { CheckSquare, IdCard as IdCardIcon, Printer, Search, Square, Users } from "lucide-react";
import {
  Button, Card, CardContent, EmptyState, Input, PageHeader, Select, StatCard, useToast,
} from "@/components/ui";
import { IdCard, type IdCardHolder } from "@/components/cards/IdCard";

const CLASSES = ["Class 6", "Class 7", "Class 8", "Class 9", "Class 10"];
const SECTIONS = ["A", "B", "C"];
const BLOOD = ["A+", "B+", "O+", "AB+", "A-", "O-"];
const FIRST = ["Aarav", "Ananya", "Vivaan", "Diya", "Ishaan", "Saanvi", "Kabir", "Myra", "Arjun", "Kiara", "Rohan", "Tara", "Advik", "Anika", "Reyansh", "Neha", "Karan", "Priya"];
const LAST = ["Sharma", "Verma", "Patel", "Gupta", "Singh", "Reddy", "Nair", "Iyer", "Joshi", "Mehta"];
const GUARDIAN = ["Rajesh", "Sunita", "Manoj", "Rekha", "Sanjay", "Geeta"];

/** Stable pseudo-random seed so the roster doesn't reshuffle between renders. */
function pick<T>(arr: T[], seed: number) {
  return arr[seed % arr.length];
}

const students: (IdCardHolder & { className: string; section: string; printed: boolean })[] =
  Array.from({ length: 18 }, (_, i) => {
    const first = FIRST[i % FIRST.length];
    const last = pick(LAST, i * 3 + 1);
    const className = pick(CLASSES, i * 5 + 2);
    const section = pick(SECTIONS, i * 7 + 1);

    return {
      id: `stu_${String(i + 1).padStart(3, "0")}`,
      name: `${first} ${last}`,
      role: "Student",
      identifier: `ADM${2024001 + i}`,
      identifierLabel: "Adm. No.",
      affiliation: `${className} · Section ${section}`,
      bloodGroup: pick(BLOOD, i * 2 + 3),
      phone: `9${810000000 + i * 137911}`,
      guardianOrDesignation: `${pick(GUARDIAN, i * 4 + 1)} ${last}`,
      guardianLabel: "Guardian",
      validTill: "31 Mar 2026",
      className,
      section,
      printed: i % 3 === 0,
    };
  });

export default function StudentIdCardsPage() {
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [className, setClassName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      if (className && s.className !== className) return false;
      if (!q) return true;
      return s.name.toLowerCase().includes(q) || s.identifier.toLowerCase().includes(q);
    });
  }, [search, className]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      // Set is mutable, so it must be cloned before mutating or React sees no change.
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allVisibleSelected = filtered.length > 0 && filtered.every((s) => selected.has(s.id));

  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) filtered.forEach((s) => next.delete(s.id));
      else filtered.forEach((s) => next.add(s.id));
      return next;
    });

  const printTargets = selected.size > 0 ? filtered.filter((s) => selected.has(s.id)) : filtered;

  const handlePrint = () => {
    if (printTargets.length === 0) {
      toast({ title: "Nothing to print", description: "No cards match the current filters.", variant: "warning" });
      return;
    }
    toast({
      title: `Preparing ${printTargets.length} card${printTargets.length > 1 ? "s" : ""}`,
      description: "Your browser's print dialog will open.",
    });
    // Let the toast paint before the print dialog blocks the main thread.
    setTimeout(() => window.print(), 250);
  };

  const printedCount = students.filter((s) => s.printed).length;

  return (
    <div className="flex flex-col gap-5">
      <div className="print-hide flex flex-col gap-5">
        <PageHeader
          title="Student ID Cards"
          description="Generate, preview and print PVC identity cards."
          actions={
            <Button onClick={handlePrint}>
              <Printer className="size-4" />
              Print {selected.size > 0 ? `${selected.size} selected` : "all shown"}
            </Button>
          }
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total students" value={students.length} icon={Users} tone="indigo" />
          <StatCard label="Cards printed" value={printedCount} icon={IdCardIcon} tone="emerald" />
          <StatCard label="Pending print" value={students.length - printedCount} icon={Printer} tone="amber" />
          <StatCard label="Selected" value={selected.size} icon={CheckSquare} tone="violet" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-60 flex-1">
            <Input
              type="search"
              placeholder="Search by name or admission no.…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search className="size-4" />}
              aria-label="Search students"
            />
          </div>
          <div className="w-44">
            <Select
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="All classes"
              options={CLASSES.map((c) => ({ label: c, value: c }))}
              aria-label="Filter by class"
            />
          </div>
          <Button variant="outline" onClick={toggleAll} disabled={filtered.length === 0}>
            {allVisibleSelected ? <Square className="size-4" /> : <CheckSquare className="size-4" />}
            {allVisibleSelected ? "Clear selection" : "Select all"}
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="print-hide">
          <EmptyState
            icon={<IdCardIcon className="size-5" />}
            title="No students found"
            description="Try clearing the search or class filter."
          />
        </Card>
      ) : (
        <div className="print-sheet grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => {
            const isSelected = selected.has(s.id);
            const dimmed = selected.size > 0 && !isSelected;
            return (
              <div key={s.id} className={dimmed ? "print-hide" : undefined}>
                <button
                  onClick={() => toggle(s.id)}
                  aria-pressed={isSelected}
                  aria-label={`Select ID card for ${s.name}`}
                  className="focus-ring print-hide mb-2 flex w-full items-center gap-2 rounded-md px-1 text-left text-xs text-muted transition-colors hover:text-text"
                >
                  {isSelected ? (
                    <CheckSquare className="size-4 text-primary" />
                  ) : (
                    <Square className="size-4" />
                  )}
                  <span className="truncate">{s.name}</span>
                  {s.printed && (
                    <span className="ml-auto shrink-0 rounded-full bg-success-soft px-1.5 py-0.5 text-[10px] font-medium text-success-text">
                      Printed
                    </span>
                  )}
                </button>
                <IdCard holder={s} />
              </div>
            );
          })}
        </div>
      )}

      <CardContent className="print-hide px-0 text-xs text-subtle">
        Cards render at CR80 size (85.6 × 54 mm). The QR block is a visual placeholder — it is not yet scannable.
      </CardContent>
    </div>
  );
}

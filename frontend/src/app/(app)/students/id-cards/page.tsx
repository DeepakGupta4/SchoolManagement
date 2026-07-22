"use client";

import { useCallback, useMemo, useState } from "react";
import { CheckSquare, IdCard as IdCardIcon, Printer, Search, Square, Users } from "lucide-react";
import {
  Button, Card, CardContent, EmptyState, Input, PageHeader, Select, Skeleton, StatCard, useToast,
} from "@/components/ui";
import { IdCard, type IdCardHolder } from "@/components/cards/IdCard";
import { useAsyncList } from "@/hooks/useAsyncList";
import { listStudents, CLASS_OPTIONS } from "@/lib/api/students";
import { fullName, type Student } from "@/types/student";

/** Maps a student record onto the ID-card holder shape, photo included. */
function toHolder(s: Student): IdCardHolder {
  return {
    id: s.id,
    name: fullName(s),
    role: "Student",
    identifier: s.admissionNo,
    identifierLabel: "Adm. No.",
    affiliation: `${s.className} · Section ${s.section}`,
    bloodGroup: s.bloodGroup,
    phone: s.phone,
    guardianOrDesignation: s.guardian.name,
    guardianLabel: s.guardian.relation,
    validTill: "31 Mar 2026",
    photo: s.avatar || undefined,
    address: s.address,
  };
}

export default function StudentIdCardsPage() {
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [className, setClassName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Sourced from the real students API, so a photo added on the student form
  // appears here on the card without any extra wiring.
  const fetcher = useCallback(() => listStudents({ search, className }), [search, className]);
  const { items: students, loading } = useAsyncList<Student>(fetcher);

  const cards = useMemo(() => students.map(toHolder), [students]);
  const withPhoto = useMemo(() => students.filter((s) => s.avatar).length, [students]);

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
          <StatCard label="With photo" value={withPhoto} icon={IdCardIcon} tone="emerald" />
          <StatCard label="Photo pending" value={students.length - withPhoto} icon={Printer} tone="amber" />
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
              options={CLASS_OPTIONS.map((c) => ({ label: c, value: c }))}
              aria-label="Filter by class"
            />
          </div>
          <Button variant="outline" onClick={toggleAll} disabled={cards.length === 0}>
            {allVisibleSelected ? <Square className="size-4" /> : <CheckSquare className="size-4" />}
            {allVisibleSelected ? "Clear selection" : "Select all"}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[0.631/1] w-full" />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <Card className="print-hide">
          <EmptyState
            icon={<IdCardIcon className="size-5" />}
            title="No students found"
            description="Try clearing the search or class filter."
          />
        </Card>
      ) : (
        <div className="print-sheet grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((holder) => {
            const isSelected = selected.has(holder.id);
            const dimmed = selected.size > 0 && !isSelected;
            const hasPhoto = students.find((s) => s.id === holder.id)?.avatar;
            return (
              <div key={holder.id} className={dimmed ? "print-hide" : undefined}>
                <button
                  onClick={() => toggle(holder.id)}
                  aria-pressed={isSelected}
                  aria-label={`Select ID card for ${holder.name}`}
                  className="focus-ring print-hide mb-2 flex w-full items-center gap-2 rounded-md px-1 text-left text-xs text-muted transition-colors hover:text-text"
                >
                  {isSelected ? (
                    <CheckSquare className="size-4 text-primary" />
                  ) : (
                    <Square className="size-4" />
                  )}
                  <span className="truncate">{holder.name}</span>
                  {hasPhoto && (
                    <span className="ml-auto shrink-0 rounded-full bg-success-soft px-1.5 py-0.5 text-[10px] font-medium text-success-text">
                      Photo
                    </span>
                  )}
                </button>
                <IdCard holder={holder} />
              </div>
            );
          })}
        </div>
      )}

      <CardContent className="print-hide px-0 text-xs text-subtle">
        Cards render at portrait CR80 size (54 × 85.6 mm). Add a student photo from the student form and it
        appears here automatically. The QR block is a visual placeholder — it is not yet scannable.
      </CardContent>
    </div>
  );
}

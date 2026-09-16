"use client";

import { useCallback, useMemo, useState } from "react";
import { CheckSquare, IdCard as IdCardIcon, Printer, Search, Square, Users } from "lucide-react";
import {
  Button, Card, EmptyState, Input, PageHeader, Select, Skeleton, StatCard, useToast,
} from "@/components/ui";
import { IdCard, type IdCardHolder } from "@/components/cards/IdCard";
import { useAsyncList } from "@/hooks/useAsyncList";
import { listTeachers, DEPARTMENT_OPTIONS } from "@/lib/api/teachers";
import { teacherName, type Teacher } from "@/types/teacher";

/** Maps a teacher record onto the ID-card holder shape, photo included. */
function toHolder(t: Teacher): IdCardHolder {
  return {
    id: t.id,
    name: teacherName(t),
    role: "Teacher",
    identifier: t.employeeId,
    identifierLabel: "Emp. ID",
    affiliation: t.department,
    phone: t.phone,
    guardianOrDesignation: t.qualification,
    guardianLabel: "Qualification",
    validTill: "31 Mar 2027",
    photo: t.avatar || undefined,
    address: t.address,
  };
}

export default function TeacherIdCardsPage() {
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Sourced from the real teachers API, so a photo added on the teacher form
  // appears here on the card without any extra wiring.
  const fetcher = useCallback(() => listTeachers({ search }), [search]);
  const { items: allTeachers, loading } = useAsyncList<Teacher>(fetcher);

  // `department` isn't a listTeachers query param, so narrow it client-side.
  const teachers = useMemo(
    () => (department ? allTeachers.filter((t) => t.department === department) : allTeachers),
    [allTeachers, department]
  );

  const cards = useMemo(() => teachers.map(toHolder), [teachers]);
  const withPhoto = useMemo(() => teachers.filter((t) => t.avatar).length, [teachers]);

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
          <StatCard label="Total staff" value={teachers.length} icon={Users} tone="indigo" />
          <StatCard label="With photo" value={withPhoto} icon={IdCardIcon} tone="emerald" />
          <StatCard label="Photo pending" value={teachers.length - withPhoto} icon={Printer} tone="amber" />
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
            title="No staff found"
            description="Try clearing the search or department filter."
          />
        </Card>
      ) : (
        <div className="print-sheet grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map((holder) => {
            const isSelected = selected.has(holder.id);
            const dimmed = selected.size > 0 && !isSelected;
            const hasPhoto = teachers.find((t) => t.id === holder.id)?.avatar;
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

      <p className="print-hide text-xs text-subtle">
        Cards render at CR80 size (85.6 × 54 mm). The QR block is a visual placeholder — it is not yet scannable.
      </p>
    </div>
  );
}

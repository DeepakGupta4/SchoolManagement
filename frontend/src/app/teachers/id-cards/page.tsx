"use client";

import { useMemo, useState } from "react";
import { CheckSquare, IdCard as IdCardIcon, Printer, Search, Square, Users } from "lucide-react";
import {
  Button, Card, EmptyState, Input, PageHeader, Select, StatCard, useToast,
} from "@/components/ui";
import { IdCard, type IdCardHolder } from "@/components/cards/IdCard";

const DEPARTMENTS = ["Science", "Mathematics", "Languages", "Social Studies", "Computer Science", "Sports"];
const DESIGNATIONS = ["PGT", "TGT", "PRT", "HOD", "Lab Assistant"];
const BLOOD = ["A+", "B+", "O+", "AB+", "A-", "O-"];
const FIRST = ["Priya", "Rahul", "Anita", "Suresh", "Kavita", "Amit", "Deepa", "Vikram", "Sunita", "Manoj", "Rekha", "Sanjay", "Nisha", "Alok"];
const LAST = ["Sharma", "Verma", "Patel", "Kumar", "Singh", "Joshi", "Nair", "Gupta", "Iyer", "Mehta"];

function pick<T>(arr: T[], seed: number) {
  return arr[seed % arr.length];
}

const teachers: (IdCardHolder & { department: string; printed: boolean })[] = Array.from(
  { length: 14 },
  (_, i) => {
    const first = FIRST[i % FIRST.length];
    const last = pick(LAST, i * 3 + 2);
    const department = pick(DEPARTMENTS, i * 5 + 1);

    return {
      id: `tch_${String(i + 1).padStart(3, "0")}`,
      name: `${first} ${last}`,
      role: "Teacher",
      identifier: `EMP${1001 + i}`,
      identifierLabel: "Emp. ID",
      affiliation: department,
      bloodGroup: pick(BLOOD, i * 2 + 1),
      phone: `9${820000000 + i * 219731}`,
      guardianOrDesignation: pick(DESIGNATIONS, i * 3 + 1),
      guardianLabel: "Designation",
      validTill: "31 Mar 2027",
      department,
      printed: i % 4 !== 0,
    };
  }
);

export default function TeacherIdCardsPage() {
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return teachers.filter((t) => {
      if (department && t.department !== department) return false;
      if (!q) return true;
      return t.name.toLowerCase().includes(q) || t.identifier.toLowerCase().includes(q);
    });
  }, [search, department]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      // Set is mutable, so it must be cloned before mutating or React sees no change.
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allVisibleSelected = filtered.length > 0 && filtered.every((t) => selected.has(t.id));

  const toggleAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) filtered.forEach((t) => next.delete(t.id));
      else filtered.forEach((t) => next.add(t.id));
      return next;
    });

  const printCount = selected.size > 0 ? selected.size : filtered.length;

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

  const printedCount = teachers.filter((t) => t.printed).length;

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
          <StatCard label="Cards printed" value={printedCount} icon={IdCardIcon} tone="emerald" />
          <StatCard label="Pending print" value={teachers.length - printedCount} icon={Printer} tone="amber" />
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
              options={DEPARTMENTS.map((d) => ({ label: d, value: d }))}
              aria-label="Filter by department"
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
            title="No staff found"
            description="Try clearing the search or department filter."
          />
        </Card>
      ) : (
        <div className="print-sheet grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((t) => {
            const isSelected = selected.has(t.id);
            const dimmed = selected.size > 0 && !isSelected;
            return (
              <div key={t.id} className={dimmed ? "print-hide" : undefined}>
                <button
                  onClick={() => toggle(t.id)}
                  aria-pressed={isSelected}
                  aria-label={`Select ID card for ${t.name}`}
                  className="focus-ring print-hide mb-2 flex w-full items-center gap-2 rounded-md px-1 text-left text-xs text-muted transition-colors hover:text-text"
                >
                  {isSelected ? (
                    <CheckSquare className="size-4 text-primary" />
                  ) : (
                    <Square className="size-4" />
                  )}
                  <span className="truncate">{t.name}</span>
                  {t.printed && (
                    <span className="ml-auto shrink-0 rounded-full bg-success-soft px-1.5 py-0.5 text-[10px] font-medium text-success-text">
                      Printed
                    </span>
                  )}
                </button>
                <IdCard holder={t} />
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

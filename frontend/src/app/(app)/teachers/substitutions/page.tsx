"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell, CalendarDays, CheckCircle2, ClipboardList, Clock, Plus,
} from "lucide-react";
import {
  Badge, Button, Card, CardContent, ConfirmDialog, EmptyState, Input, PageHeader,
  Select, StatCard, Table, useToast, type Column, type SelectOption,
} from "@/components/ui";
import { useAsyncList } from "@/hooks/useAsyncList";
import { fetchAllTeachers } from "@/lib/api/teachers";
import { timetableApi, type TimetableEntry } from "@/lib/api/timetable";
import { substitutionsApi, type Substitution } from "@/lib/api/substitutions";
import { TODAY_ISO, weekdayName } from "@/lib/dates";
import { teacherName, type Teacher } from "@/types/teacher";

// Sanity bounds for the date picker (match the backend's accepted range).
const DATE_MIN = "2000-01-01";
const DATE_MAX = `${Number(TODAY_ISO.slice(0, 4)) + 1}-12-31`;

/** One period that needs covering — from the timetable or added manually. */
interface CoverSlot {
  key: string;
  period: number;
  time: string;
  className: string;
  subject: string;
  room: string;
  manual: boolean;
}

const slotKey = (period: number, className: string) => `${period}|${className}`;

export default function SubstitutionsPage() {
  const { toast } = useToast();

  // Complete staff list — drives both the "absent" picker and the substitute
  // options, so nobody is missing because of the 200-row page cap.
  const teacherFetcher = useCallback(() => fetchAllTeachers(), []);
  const { items: teachers } = useAsyncList<Teacher>(teacherFetcher);

  const [date, setDate] = useState(TODAY_ISO);
  const weekday = useMemo(() => weekdayName(date), [date]);
  const [absentName, setAbsentName] = useState("");
  const absentTeacher = useMemo(
    () => teachers.find((t) => teacherName(t) === absentName),
    [teachers, absentName]
  );

  const [absentEntries, setAbsentEntries] = useState<TimetableEntry[]>([]);
  const [dayTimetable, setDayTimetable] = useState<TimetableEntry[]>([]);
  const [subs, setSubs] = useState<Substitution[]>([]);
  const [manual, setManual] = useState<CoverSlot[]>([]);
  const [pick, setPick] = useState<Record<string, string>>({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingLog, setLoadingLog] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [toRemove, setToRemove] = useState<Substitution | null>(null);
  const [removing, setRemoving] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((k) => k + 1);

  // Reset the per-day working state whenever the day or teacher changes — a
  // substitute pick or a manually added period only makes sense in its context.
  const changeDate = (v: string) => {
    setDate(v);
    // Don't clear absentEntries here: the timetable is weekly, so when the new
    // date falls on the same weekday the fetch effect won't re-run — clearing
    // would leave the grid wrongly empty. A weekday change re-fetches anyway.
    setManual([]);
    setPick({});
  };
  const changeTeacher = (v: string) => {
    setAbsentName(v);
    setAbsentEntries([]);
    setManual([]);
    setPick({});
  };

  // The selected date's cover arrangements (all teachers) + that weekday's full
  // timetable (used to tell which teachers are already busy in each period).
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingLog(true);
    Promise.all([
      substitutionsApi.list({ date, limit: 500 }),
      weekday ? timetableApi.list({ day: weekday, limit: 500 }) : Promise.resolve([] as TimetableEntry[]),
    ])
      .then(([subRows, dayRows]) => {
        if (cancelled) return;
        setSubs(subRows);
        setDayTimetable(dayRows);
      })
      .catch(() => {
        if (cancelled) return;
        setSubs([]);
        setDayTimetable([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingLog(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date, weekday, reloadKey]);

  // The absent teacher's periods for that weekday, pulled from the timetable.
  useEffect(() => {
    if (!absentName || !weekday) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingSlots(true);
    timetableApi
      .list({ teacher: absentName, limit: 500 })
      .then((rows) => {
        if (cancelled) return;
        const wd = weekday.toLowerCase();
        setAbsentEntries(
          rows
            .filter((r) => (r.day || "").toLowerCase() === wd)
            .sort((a, b) => a.period - b.period)
        );
      })
      .catch(() => {
        if (!cancelled) setAbsentEntries([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [absentName, weekday, reloadKey]);

  // Teachers already occupied in a given period (their own class, or an existing
  // cover) — so the substitute picker can flag who's free.
  const busyByPeriod = useMemo(() => {
    const m = new Map<number, Set<string>>();
    const add = (period: number, name: string) => {
      if (!name) return;
      if (!m.has(period)) m.set(period, new Set());
      m.get(period)!.add(name);
    };
    for (const r of dayTimetable) add(r.period, r.teacher);
    for (const s of subs) if (s.status === "assigned") add(s.period, s.substituteTeacher);
    return m;
  }, [dayTimetable, subs]);

  // Assigned cover for each slot of the selected day, keyed by period+class.
  const subBySlot = useMemo(() => {
    const m = new Map<string, Substitution>();
    for (const s of subs) if (s.status === "assigned") m.set(slotKey(s.period, s.className), s);
    return m;
  }, [subs]);

  // All periods needing cover = the teacher's timetable periods + manual ones.
  const slots = useMemo<CoverSlot[]>(() => {
    const fromTimetable = absentEntries.map((e) => ({
      key: slotKey(e.period, e.className),
      period: e.period,
      time: e.time,
      className: e.className,
      subject: e.subject,
      room: e.room,
      manual: false,
    }));
    return [...fromTimetable, ...manual];
  }, [absentEntries, manual]);

  const toCover = slots.length;
  const covered = useMemo(
    () => slots.filter((s) => subBySlot.has(s.key)).length,
    [slots, subBySlot]
  );
  const pending = toCover - covered;
  const coversThisDay = useMemo(() => subs.filter((s) => s.status === "assigned").length, [subs]);

  const currentPick = (slot: CoverSlot) =>
    pick[slot.key] ?? subBySlot.get(slot.key)?.substituteTeacher ?? "";

  // Substitute options for a period — free teachers first, busy ones flagged.
  const substituteOptions = (period: number): SelectOption[] => {
    const busy = busyByPeriod.get(period) ?? new Set<string>();
    return teachers
      .filter((t) => teacherName(t) !== absentName)
      .map((t) => ({ name: teacherName(t), busy: busy.has(teacherName(t)) }))
      .sort((a, b) => Number(a.busy) - Number(b.busy) || a.name.localeCompare(b.name))
      .map((t) => ({ label: `${t.name}${t.busy ? " — busy" : " — free"}`, value: t.name }));
  };

  async function assign(slot: CoverSlot) {
    const name = currentPick(slot);
    if (!name) {
      toast({ title: "Pick a substitute", description: "Choose a teacher to cover this period.", variant: "warning" });
      return;
    }
    const sub = teachers.find((t) => teacherName(t) === name);
    // Reuse any existing record for this slot (even a cancelled one) so a slot
    // never accumulates duplicates.
    const existing = subs.find((s) => slotKey(s.period, s.className) === slot.key);
    const payload = {
      date,
      day: weekday,
      period: slot.period,
      time: slot.time,
      className: slot.className,
      subject: slot.subject,
      room: slot.room,
      absentTeacher: absentName,
      absentEmpId: absentTeacher?.employeeId ?? "",
      substituteTeacher: name,
      substituteEmpId: sub?.employeeId ?? "",
      substituteEmail: sub?.email ?? "",
      status: "assigned" as const,
      note: "",
    };
    try {
      setSavingKey(slot.key);
      if (existing) await substitutionsApi.update(existing.id, payload);
      else await substitutionsApi.create(payload);
      toast({
        title: `Assigned to ${name}`,
        description: sub?.email ? "They've been notified in-app." : "Saved. (No login on file, so no in-app alert.)",
        variant: "success",
      });
      reload();
    } catch {
      toast({ title: "Couldn't save", description: "Please try again.", variant: "error" });
    } finally {
      setSavingKey(null);
    }
  }

  async function cancel(s: Substitution) {
    try {
      setSavingKey(s.id);
      await substitutionsApi.update(s.id, { status: "cancelled" });
      toast({ title: "Cover cancelled", description: `${s.substituteTeacher} was notified.`, variant: "success" });
      reload();
    } catch {
      toast({ title: "Couldn't cancel", description: "Please try again.", variant: "error" });
    } finally {
      setSavingKey(null);
    }
  }

  async function remove() {
    if (!toRemove) return;
    try {
      setRemoving(true);
      await substitutionsApi.remove(toRemove.id);
      toast({ title: "Removed", variant: "success" });
      setToRemove(null);
      reload();
    } catch {
      toast({ title: "Couldn't remove", description: "Please try again.", variant: "error" });
    } finally {
      setRemoving(false);
    }
  }

  /* ----------------------------- manual period ----------------------------- */
  const [showManual, setShowManual] = useState(false);
  const [mPeriod, setMPeriod] = useState("1");
  const [mTime, setMTime] = useState("");
  const [mClass, setMClass] = useState("");
  const [mSubject, setMSubject] = useState("");
  const [mRoom, setMRoom] = useState("");

  const addManual = () => {
    const period = Number(mPeriod);
    const className = mClass.trim();
    const subject = mSubject.trim();
    if (!period || period < 1) {
      toast({ title: "Enter a period number", variant: "warning" });
      return;
    }
    if (!className || !subject) {
      toast({ title: "Class and subject are required", variant: "warning" });
      return;
    }
    const key = slotKey(period, className);
    if (slots.some((s) => s.key === key)) {
      toast({ title: "Already in the list", description: "That period and class is already shown.", variant: "warning" });
      return;
    }
    setManual((prev) => [
      ...prev,
      { key, period, time: mTime.trim(), className, subject, room: mRoom.trim(), manual: true },
    ]);
    setMTime("");
    setMClass("");
    setMSubject("");
    setMRoom("");
  };

  /* -------------------------------- columns -------------------------------- */
  const slotColumns: Column<CoverSlot>[] = [
    {
      key: "period",
      header: "Period",
      render: (s) => (
        <div>
          <div className="font-semibold text-text">P{s.period}</div>
          {s.time && <div className="text-xs text-muted">{s.time}</div>}
        </div>
      ),
    },
    {
      key: "class",
      header: "Class · Subject",
      render: (s) => (
        <div>
          <div className="flex items-center gap-2 text-text">
            {s.className || "—"}
            {s.manual && <Badge variant="outline">manual</Badge>}
          </div>
          <div className="text-xs text-muted">
            {[s.subject, s.room].filter(Boolean).join(" · ") || "—"}
          </div>
        </div>
      ),
    },
    {
      key: "substitute",
      header: "Substitute",
      render: (s) => (
        <div className="w-56">
          <Select
            options={substituteOptions(s.period)}
            value={currentPick(s)}
            onChange={(e) => setPick((p) => ({ ...p, [s.key]: e.target.value }))}
            placeholder="Choose a teacher"
            aria-label={`Substitute for period ${s.period}`}
          />
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (s) =>
        subBySlot.has(s.key) ? (
          <Badge variant="success">Covered</Badge>
        ) : (
          <Badge variant="warning">Pending</Badge>
        ),
    },
    {
      key: "action",
      header: "",
      align: "right",
      render: (s) => {
        const existing = subBySlot.get(s.key);
        const chosen = currentPick(s);
        const changed = !!chosen && chosen !== existing?.substituteTeacher;
        return (
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              onClick={() => assign(s)}
              disabled={savingKey === s.key || !chosen || (!!existing && !changed)}
            >
              {existing ? "Update" : "Assign"}
            </Button>
            {existing && (
              <Button size="sm" variant="ghost" onClick={() => cancel(existing)} disabled={savingKey === existing.id}>
                Cancel
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const logColumns: Column<Substitution>[] = [
    {
      key: "period",
      header: "Period",
      render: (s) => (
        <span className="font-medium text-text">
          P{s.period}
          {s.time ? ` · ${s.time}` : ""}
        </span>
      ),
    },
    { key: "className", header: "Class", render: (s) => s.className || "—" },
    {
      key: "subject",
      header: "Subject",
      render: (s) => (
        <div>
          <div className="text-text">{s.subject || "—"}</div>
          {s.room && <div className="text-xs text-muted">{s.room}</div>}
        </div>
      ),
    },
    { key: "absentTeacher", header: "Absent", render: (s) => s.absentTeacher },
    { key: "substituteTeacher", header: "Substitute", render: (s) => s.substituteTeacher },
    {
      key: "status",
      header: "Status",
      render: (s) =>
        s.status === "assigned" ? (
          <Badge variant="success">Assigned</Badge>
        ) : (
          <Badge variant="default">Cancelled</Badge>
        ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (s) => (
        <div className="flex justify-end gap-2">
          {s.status === "assigned" && (
            <Button size="sm" variant="ghost" onClick={() => cancel(s)} disabled={savingKey === s.id}>
              Cancel
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => setToRemove(s)}>
            Remove
          </Button>
        </div>
      ),
    },
  ];

  const teacherOptions: SelectOption[] = teachers
    .map((t) => ({ label: `${teacherName(t)} · ${t.department}`, value: teacherName(t) }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Substitutions"
        description="Arrange cover for an absent teacher's periods and notify the substitute."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Periods to cover" value={toCover} icon={ClipboardList} tone="indigo" />
        <StatCard label="Covered" value={covered} icon={CheckCircle2} tone="emerald" />
        <StatCard label="Pending" value={pending} icon={Clock} tone="amber" />
        <StatCard label="Covers this day" value={coversThisDay} icon={Bell} tone="violet" />
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Date"
              type="date"
              value={date}
              min={DATE_MIN}
              max={DATE_MAX}
              onChange={(e) => changeDate(e.target.value)}
              hint={weekday ? weekday : "Pick a valid date"}
            />
            <Select
              label="Absent teacher"
              value={absentName}
              onChange={(e) => changeTeacher(e.target.value)}
              placeholder="Select the teacher who's away"
              options={teacherOptions}
            />
          </div>
        </CardContent>
      </Card>

      {/* Periods that need covering for the selected teacher */}
      {!absentName ? (
        <Card>
          <EmptyState
            icon={<CalendarDays className="size-5" />}
            title="Pick an absent teacher"
            description="Choose a date and the teacher who's away to see their periods for that day."
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-text">
              {absentName}&rsquo;s periods · {weekday || "—"}
            </h2>
            <Button variant="outline" size="sm" onClick={() => setShowManual((v) => !v)}>
              <Plus className="size-4" />
              Add a period manually
            </Button>
          </div>

          {showManual && (
            <Card>
              <CardContent className="py-4">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  <Input label="Period" type="number" min={1} value={mPeriod} onChange={(e) => setMPeriod(e.target.value)} />
                  <Input label="Time" placeholder="9:00 - 9:45" value={mTime} onChange={(e) => setMTime(e.target.value)} />
                  <Input label="Class" placeholder="Class 9 - A" value={mClass} onChange={(e) => setMClass(e.target.value)} />
                  <Input label="Subject" placeholder="Maths" value={mSubject} onChange={(e) => setMSubject(e.target.value)} />
                  <Input label="Room" placeholder="R-204" value={mRoom} onChange={(e) => setMRoom(e.target.value)} />
                </div>
                <div className="mt-3 flex justify-end">
                  <Button size="sm" onClick={addManual}>
                    <Plus className="size-4" />
                    Add period
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Table
            columns={slotColumns}
            rows={slots}
            rowKey={(s) => s.key}
            loading={loadingSlots}
            emptyTitle="No periods on the timetable"
            emptyDescription={
              weekday
                ? `${absentName} has no periods set for ${weekday}. Add one manually above if needed.`
                : "Pick a valid date first."
            }
          />
        </div>
      )}

      {/* The day's full cover log */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-text">
          Cover arrangements · {weekday ? `${weekday}, ` : ""}
          {date}
        </h2>
        <Table
          columns={logColumns}
          rows={subs}
          rowKey={(s) => s.id}
          loading={loadingLog}
          pageSize={8}
          emptyTitle="No cover arranged yet"
          emptyDescription="Assignments you make for this day appear here."
        />
      </div>

      <ConfirmDialog
        open={!!toRemove}
        onOpenChange={(o) => !o && setToRemove(null)}
        title="Remove this cover?"
        description={
          toRemove
            ? `Delete the record of ${toRemove.substituteTeacher} covering ${toRemove.absentTeacher}'s period ${toRemove.period}? This can't be undone.`
            : ""
        }
        destructive
        confirmLabel="Remove"
        loading={removing}
        onConfirm={remove}
      />
    </div>
  );
}

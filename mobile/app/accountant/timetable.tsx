import { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Screen, ScreenHeader, AppText, Card, Loading, Select, Chips, TimetableGrid, type ChipOption } from "@/components";
import { getTimetable, type TimetableEntry } from "@/api/teacher";
import { listClasses, type SchoolClass } from "@/api/classes";
import { classSortKey } from "@/lib/classOrder";
import { ApiError } from "@/api/client";
import { colors, spacing } from "@/theme";

/** View-only school timetable — pick a class (+ section), see the week grid. */
export default function AccountantTimetable() {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [className, setClassName] = useState("");
  const [section, setSection] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tt, cl] = await Promise.all([
        getTimetable().catch(() => [] as TimetableEntry[]),
        listClasses().catch(() => [] as SchoolClass[]),
      ]);
      setEntries(tt);
      setClasses(cl);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load the timetable.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const classOptions = useMemo<ChipOption[]>(() => {
    const set = new Set<string>();
    classes.forEach((c) => c.name && set.add(c.name));
    entries.forEach((e) => e.className && set.add(e.className));
    return [...set].sort((a, b) => classSortKey(a) - classSortKey(b) || a.localeCompare(b)).map((c) => ({ label: c, value: c }));
  }, [classes, entries]);

  useEffect(() => {
    if (classOptions.length && !classOptions.some((o) => o.value === className)) setClassName(classOptions[0].value);
  }, [classOptions, className]);

  const sectionOptions = useMemo<ChipOption[]>(() => {
    const set = new Set<string>(classes.find((c) => c.name === className)?.sections ?? []);
    entries.forEach((e) => {
      if (e.className === className && e.section) set.add(e.section);
    });
    return [...set].sort().map((s) => ({ label: `Sec ${s}`, value: s }));
  }, [classes, className, entries]);

  useEffect(() => {
    if (sectionOptions.length && !sectionOptions.some((o) => o.value === section)) setSection(sectionOptions[0].value);
  }, [sectionOptions, section]);

  if (loading && entries.length === 0) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading timetable…" />
      </Screen>
    );
  }

  return (
    <Screen style={{ gap: spacing.md }} onRefresh={load}>
      <ScreenHeader title="Timetable" back />

      {error ? (
        <Card>
          <AppText variant="muted">{error}</AppText>
        </Card>
      ) : classOptions.length === 0 ? (
        <Card>
          <AppText variant="muted">No timetable has been set up yet.</AppText>
        </Card>
      ) : (
        <>
          <Select label="Class" value={className} options={classOptions} onChange={setClassName} />
          {sectionOptions.length > 1 ? <Chips options={sectionOptions} value={section} onChange={setSection} /> : null}
          <TimetableGrid entries={entries} className={className} section={section} />
          <AppText variant="small" style={styles.hint}>
            View only · scroll sideways for the full week
          </AppText>
        </>
      )}
    </Screen>
  );
}

const styles = { hint: { color: colors.subtle, textAlign: "center" as const } };

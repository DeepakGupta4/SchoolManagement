import { useCallback, useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen, ScreenHeader, AppText, Card, Loading, Select, Chips, type ChipOption } from "@/components";
import { getTimetable, type TimetableEntry } from "@/api/teacher";
import { listClasses, type SchoolClass } from "@/api/classes";
import { classSortKey } from "@/lib/classOrder";
import { ApiError } from "@/api/client";
import { colors, radius, spacing, fontSize, fontWeight } from "@/theme";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT: Record<string, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
};

// The same period layout the web timetable uses (breaks at 4 & 7).
type Period = { id: number; time: string; isBreak?: boolean; label?: string };
const PERIODS: Period[] = [
  { id: 1, time: "8:00 – 8:45" },
  { id: 2, time: "8:45 – 9:30" },
  { id: 3, time: "9:30 – 10:15" },
  { id: 4, time: "10:15 – 10:30", isBreak: true, label: "Short Break" },
  { id: 5, time: "10:30 – 11:15" },
  { id: 6, time: "11:15 – 12:00" },
  { id: 7, time: "12:00 – 12:45", isBreak: true, label: "Lunch Break" },
  { id: 8, time: "12:45 – 1:30" },
  { id: 9, time: "1:30 – 2:15" },
  { id: 10, time: "2:15 – 3:00" },
];

// P1, P2… skipping breaks, so the numbering stays sequential (matches the web).
const PERIOD_LABEL: Record<number, string> = (() => {
  const m: Record<number, string> = {};
  let n = 0;
  for (const p of PERIODS) if (!p.isBreak) m[p.id] = `P${(n += 1)}`;
  return m;
})();

// A rotating, theme-safe palette so a subject always gets the same colour.
const TONES = [
  { bg: colors.primarySoft, fg: colors.primaryText },
  { bg: colors.infoSoft, fg: colors.infoText },
  { bg: colors.successSoft, fg: colors.successText },
  { bg: colors.warningSoft, fg: colors.warningText },
  { bg: colors.dangerSoft, fg: colors.dangerText },
];
function toneFor(subject: string) {
  let h = 0;
  for (let i = 0; i < subject.length; i++) h = (h * 31 + subject.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
}

const TIME_W = 58;
const DAY_W = 112;

/** View-only school timetable — the same class × period × day grid as the web. */
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
        getTimetable().catch(() => [] as TimetableEntry[]), // no teacher → whole school
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
    if (classOptions.length && !classOptions.some((o) => o.value === className)) {
      setClassName(classOptions[0].value);
    }
  }, [classOptions, className]);

  // Sections of the chosen class (from config + whatever the entries carry).
  const sectionOptions = useMemo<ChipOption[]>(() => {
    const set = new Set<string>(classes.find((c) => c.name === className)?.sections ?? []);
    entries.forEach((e) => {
      if (e.className === className && e.section) set.add(e.section);
    });
    return [...set].sort().map((s) => ({ label: `Sec ${s}`, value: s }));
  }, [classes, className, entries]);

  useEffect(() => {
    if (sectionOptions.length && !sectionOptions.some((o) => o.value === section)) {
      setSection(sectionOptions[0].value);
    }
  }, [sectionOptions, section]);

  // grid[day][periodId] = entry, for the selected class + section (a section-less
  // entry shows under any section so nothing is hidden).
  const grid = useMemo(() => {
    const g: Record<string, Record<number, TimetableEntry>> = {};
    for (const e of entries) {
      if (e.className !== className) continue;
      if (section && e.section && e.section !== section) continue;
      (g[e.day] ??= {})[e.period] = e;
    }
    return g;
  }, [entries, className, section]);

  const todayName = useMemo(() => new Date().toLocaleDateString("en-US", { weekday: "long" }), []);
  const hasAny = useMemo(() => Object.keys(grid).length > 0, [grid]);

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

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.grid}>
            <View>
              {/* Header: Time + weekdays */}
              <View style={styles.row}>
                <View style={[styles.timeCell, styles.headCell]}>
                  <Ionicons name="time-outline" size={13} color={colors.muted} />
                </View>
                {DAYS.map((d) => {
                  const today = d === todayName;
                  return (
                    <View key={d} style={[styles.dayCell, styles.headCell, today && styles.todayHead]}>
                      <AppText variant="small" style={[styles.headText, today && styles.todayHeadText]}>
                        {DAY_SHORT[d]}
                      </AppText>
                    </View>
                  );
                })}
              </View>

              {/* One row per period (breaks span the week) */}
              {PERIODS.map((p) =>
                p.isBreak ? (
                  <View key={p.id} style={styles.row}>
                    <View style={[styles.timeCell, styles.breakCell]}>
                      <AppText style={styles.breakTime}>{p.time}</AppText>
                    </View>
                    <View style={[styles.breakSpan, { width: DAY_W * DAYS.length }]}>
                      <AppText variant="small" style={styles.breakLabel}>
                        ☕ {p.label}
                      </AppText>
                    </View>
                  </View>
                ) : (
                  <View key={p.id} style={styles.row}>
                    <View style={styles.timeCell}>
                      <AppText style={styles.pLabel}>{PERIOD_LABEL[p.id]}</AppText>
                      <AppText style={styles.pTime}>{p.time}</AppText>
                    </View>
                    {DAYS.map((d) => {
                      const e = grid[d]?.[p.id];
                      const today = d === todayName;
                      return (
                        <View key={d} style={[styles.dayCell, today && styles.todayCol]}>
                          {e ? (
                            <View style={[styles.slot, { backgroundColor: toneFor(e.subject).bg }]}>
                              <AppText style={[styles.slotSubject, { color: toneFor(e.subject).fg }]} numberOfLines={2}>
                                {e.subject}
                              </AppText>
                              {e.teacher ? (
                                <AppText style={styles.slotMeta} numberOfLines={1}>
                                  {e.teacher}
                                </AppText>
                              ) : null}
                              {e.room ? (
                                <AppText style={styles.slotMeta} numberOfLines={1}>
                                  Room {e.room}
                                </AppText>
                              ) : null}
                            </View>
                          ) : (
                            <AppText style={styles.empty}>—</AppText>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )
              )}
            </View>
          </ScrollView>

          {!hasAny ? (
            <Card>
              <AppText variant="muted">No periods set for {className} yet.</AppText>
            </Card>
          ) : null}
          <AppText variant="small" style={styles.hint}>
            View only · scroll sideways for the full week
          </AppText>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, overflow: "hidden" },
  row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: colors.border },

  timeCell: {
    width: TIME_W,
    paddingVertical: spacing.sm,
    paddingHorizontal: 6,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  dayCell: {
    width: DAY_W,
    minHeight: 60,
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  headCell: { minHeight: 0, paddingVertical: spacing.sm, backgroundColor: colors.surfaceAlt },
  headText: { color: colors.text, fontWeight: fontWeight.semibold },
  todayHead: { backgroundColor: colors.primarySoft },
  todayHeadText: { color: colors.primaryText },
  todayCol: { backgroundColor: colors.primarySoft + "55" },

  pLabel: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, color: colors.muted },
  pTime: { fontSize: 9, color: colors.subtle, marginTop: 2, textAlign: "center" },

  slot: { width: "100%", borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 5 },
  slotSubject: { fontSize: 11, fontWeight: fontWeight.bold, lineHeight: 14 },
  slotMeta: { fontSize: 9, color: colors.muted, marginTop: 1 },
  empty: { color: colors.subtle, fontSize: fontSize.sm },

  breakCell: {},
  breakTime: { fontSize: 9, color: colors.subtle, textAlign: "center" },
  breakSpan: { justifyContent: "center", alignItems: "center", paddingVertical: spacing.sm, backgroundColor: colors.surfaceAlt },
  breakLabel: { color: colors.muted, fontWeight: fontWeight.semibold },

  hint: { color: colors.subtle, textAlign: "center" },
});

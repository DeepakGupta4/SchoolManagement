import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Screen, ScreenHeader, AppText, Card, Loading, Chips, type ChipOption } from "@/components";
import { getTimetable, type TimetableEntry } from "@/api/teacher";
import { listClasses, type SchoolClass } from "@/api/classes";
import { ApiError } from "@/api/client";
import { colors, radius, spacing } from "@/theme";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/** View-only school timetable for the accountant — pick a class, see its week. */
export default function AccountantTimetable() {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [className, setClassName] = useState("");
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
    return [...set].sort().map((c) => ({ label: c, value: c }));
  }, [classes, entries]);

  useEffect(() => {
    if (classOptions.length && !classOptions.some((o) => o.value === className)) {
      setClassName(classOptions[0].value);
    }
  }, [classOptions, className]);

  const forClass = useMemo(() => entries.filter((e) => e.className === className), [entries, className]);

  if (loading && entries.length === 0) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading timetable…" />
      </Screen>
    );
  }

  return (
    <Screen style={{ gap: spacing.md }}>
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
          <Chips options={classOptions} value={className} onChange={setClassName} />

          {DAYS.map((day) => {
            const periods = forClass.filter((e) => e.day === day).sort((a, b) => a.period - b.period);
            if (!periods.length) return null;
            return (
              <Card key={day}>
                <AppText variant="heading">{day}</AppText>
                <View style={styles.list}>
                  {periods.map((p) => (
                    <View key={p.id} style={styles.row}>
                      <View style={styles.period}>
                        <AppText variant="small" style={{ color: colors.primaryText }}>
                          P{p.period}
                        </AppText>
                      </View>
                      <View style={styles.flex}>
                        <AppText>{p.subject}</AppText>
                        <AppText variant="muted">
                          {[p.section ? `Sec ${p.section}` : "", p.teacher, p.room].filter(Boolean).join(" · ") || "—"}
                        </AppText>
                      </View>
                    </View>
                  ))}
                </View>
              </Card>
            );
          })}

          {forClass.length === 0 ? (
            <Card>
              <AppText variant="muted">No periods set for {className} yet.</AppText>
            </Card>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm, marginTop: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  flex: { flex: 1 },
  period: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
});

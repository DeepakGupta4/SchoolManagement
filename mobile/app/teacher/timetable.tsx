import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Screen, ScreenHeader, AppText, Card, Loading } from "@/components";
import { getMyTeacher, getTimetable, teacherName, isTaughtBy, type TimetableEntry } from "@/api/teacher";
import { colors, radius, spacing } from "@/theme";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function TeacherTimetable() {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const t = await getMyTeacher();
        if (!alive) return;
        const nm = teacherName(t);
        setName(nm);
        const tt = nm ? await getTimetable(nm) : []; // server-scoped to this teacher
        if (alive) setEntries(tt);
      } catch {
        /* ignore */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Only this teacher's periods — same match rule as the Home dashboard.
  const mine = useMemo(() => entries.filter((e) => isTaughtBy(e, name)), [entries, name]);

  if (loading) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading timetable…" />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScreenHeader title="My Timetable" back />
      {mine.length === 0 ? (
        <AppText variant="muted">No periods assigned to you yet.</AppText>
      ) : (
        DAYS.map((day) => {
          const periods = mine.filter((e) => e.day === day).sort((a, b) => a.period - b.period);
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
                        {p.className}
                        {p.section ? ` · ${p.section}` : ""}
                        {p.room ? ` · ${p.room}` : ""}
                      </AppText>
                    </View>
                  </View>
                ))}
              </View>
            </Card>
          );
        })
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

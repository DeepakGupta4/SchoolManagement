import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Screen, AppText, Card, Loading } from "@/components";
import { getMyTeacher, getTimetable, teacherName, type TimetableEntry } from "@/api/teacher";
import { colors, radius, spacing } from "@/theme";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function TeacherTimetable() {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all([getMyTeacher(), getTimetable()])
      .then(([t, tt]) => {
        if (!alive) return;
        setName(teacherName(t));
        setEntries(tt);
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  // Only this teacher's periods (timetable stores the teacher by name).
  const mine = useMemo(() => entries.filter((e) => e.teacher === name), [entries, name]);

  if (loading) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading timetable…" />
      </Screen>
    );
  }

  return (
    <Screen>
      <AppText variant="title">My Timetable</AppText>
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

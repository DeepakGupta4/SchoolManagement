import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Screen, AppText, Card, StatCard, Loading } from "@/components";
import { getMyTeacher, teacherName, type Teacher } from "@/api/teacher";
import { useAuth } from "@/store/auth";
import { colors, radius, spacing } from "@/theme";

export default function TeacherHome() {
  const user = useAuth((s) => s.user);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    getMyTeacher()
      .then((t) => alive && setTeacher(t))
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  if (loading) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading your dashboard…" />
      </Screen>
    );
  }

  const name = teacherName(teacher) || user?.name || "Teacher";
  const classes = teacher?.classes ?? [];
  const subjects = teacher?.subjects ?? [];
  const classTeacherOf =
    teacher?.isClassTeacher && teacher.classTeacherOf
      ? `${teacher.classTeacherOf}${teacher.classTeacherSection ? ` - ${teacher.classTeacherSection}` : ""}`
      : null;

  return (
    <Screen>
      <View style={styles.hero}>
        <AppText variant="muted">Welcome back,</AppText>
        <AppText variant="title">{name} 👋</AppText>
        {classTeacherOf ? <AppText variant="muted">Class teacher · {classTeacherOf}</AppText> : null}
      </View>

      <View style={styles.statRow}>
        <StatCard label="My classes" value={classes.length} icon="school-outline" tone="primary" />
        <StatCard label="My subjects" value={subjects.length} icon="book-outline" tone="info" />
      </View>

      <Card>
        <AppText variant="heading">My classes</AppText>
        <View style={styles.chips}>
          {classes.length ? (
            classes.map((c) => (
              <View key={c} style={styles.chip}>
                <AppText variant="small">{c}</AppText>
              </View>
            ))
          ) : (
            <AppText variant="muted">No classes assigned yet.</AppText>
          )}
        </View>
      </Card>

      <Card>
        <AppText variant="heading">My subjects</AppText>
        <View style={styles.chips}>
          {subjects.length ? (
            subjects.map((s) => (
              <View key={s} style={styles.chip}>
                <AppText variant="small">{s}</AppText>
              </View>
            ))
          ) : (
            <AppText variant="muted">No subjects assigned yet.</AppText>
          )}
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: spacing.xs },
  statRow: { flexDirection: "row", gap: spacing.md },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm },
  chip: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});

import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen, AppText, Card, StatCard, Loading } from "@/components";
import { getMyTeacher, teacherName, type Teacher } from "@/api/teacher";
import { useAuth } from "@/store/auth";
import { colors, radius, spacing } from "@/theme";

export default function TeacherHome() {
  const router = useRouter();
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

      {/* Daily first action for a class teacher. */}
      {classTeacherOf ? (
        <Pressable onPress={() => router.push("/teacher/attendance")}>
          <Card style={styles.cta}>
            <View style={styles.ctaIcon}>
              <Ionicons name="checkbox-outline" size={22} color={colors.onPrimary} />
            </View>
            <View style={styles.flex}>
              <AppText variant="heading" style={styles.ctaTitle}>
                Take today&apos;s attendance
              </AppText>
              <AppText variant="muted">{classTeacherOf}</AppText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.subtle} />
          </Card>
        </Pressable>
      ) : null}

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
  flex: { flex: 1 },
  cta: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  ctaIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaTitle: { fontSize: 15 },
  statRow: { flexDirection: "row", gap: spacing.md },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.sm },
  chip: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});

import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Screen, AppText, Card, Button, Loading } from "@/components";
import { getStudentMe, getStudentReport, type StudentMe, type StudentReport } from "@/api/portal";
import { ApiError } from "@/api/client";
import { colors, radius, spacing, fontWeight } from "@/theme";

/** Student home: profile + attendance/performance/fee + today's classes + report card. */
export default function StudentHome() {
  const router = useRouter();
  const [me, setMe] = useState<StudentMe | null>(null);
  const [report, setReport] = useState<StudentReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [m, r] = await Promise.all([getStudentMe(), getStudentReport().catch(() => null)]);
      setMe(m);
      setReport(r);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load your dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading…" />
      </Screen>
    );
  }

  if (!me) {
    return (
      <Screen style={{ gap: spacing.md }}>
        <AppText variant="title">Hi there 👋</AppText>
        <Card>
          <AppText variant="muted">
            {error ?? "No student record is linked to your account. Ask the office to check your email."}
          </AppText>
        </Card>
        <Button title="Track the school bus" onPress={() => router.push("/track")} />
      </Screen>
    );
  }

  const { profile, stats, todaysPeriods } = me;

  return (
    <Screen style={{ gap: spacing.md }}>
      <View>
        <AppText variant="muted">Welcome back,</AppText>
        <AppText variant="title">{profile.name} 👋</AppText>
        <AppText variant="muted">
          {profile.className}
          {profile.section ? ` · ${profile.section}` : ""}
          {profile.rollNo ? ` · Roll ${profile.rollNo}` : ""}
        </AppText>
      </View>

      <View style={styles.tiles}>
        <Tile label="Attendance" value={`${stats.attendancePercent}%`} tone={colors.success} />
        <Tile label="Performance" value={`${stats.performancePercent}%`} tone={colors.primary} />
        <Tile
          label="Fee due"
          value={stats.feeDue > 0 ? `₹${stats.feeDue}` : "₹0"}
          tone={stats.feeDue > 0 ? colors.danger : colors.success}
        />
      </View>

      <Button title="Track the school bus" variant="outline" onPress={() => router.push("/track")} />

      <AppText variant="heading">Today's classes</AppText>
      {todaysPeriods.length === 0 ? (
        <AppText variant="muted">No classes scheduled today.</AppText>
      ) : (
        todaysPeriods.map((p) => (
          <Card key={p.period} style={styles.row}>
            <View style={styles.badge}>
              <AppText variant="small" style={styles.badgeText}>
                P{p.period}
              </AppText>
            </View>
            <View style={styles.flex}>
              <AppText variant="heading" style={styles.rowTitle}>
                {p.subject || "—"}
              </AppText>
              <AppText variant="muted">
                {[p.time, p.teacher, p.room ? `Room ${p.room}` : ""].filter(Boolean).join(" · ") || "—"}
              </AppText>
            </View>
          </Card>
        ))
      )}

      <AppText variant="heading">
        My report card{report && report.gpa ? ` · GPA ${report.gpa}` : ""}
      </AppText>
      {!report || report.subjects.length === 0 ? (
        <AppText variant="muted">No marks published yet.</AppText>
      ) : (
        report.subjects.map((s) => (
          <Card key={s.subject} style={styles.row}>
            <View style={styles.flex}>
              <AppText variant="heading" style={styles.rowTitle}>
                {s.subject}
              </AppText>
              <AppText variant="muted">
                {s.marks}/{s.maxMarks} · {s.percent}%
              </AppText>
            </View>
            <View style={styles.grade}>
              <AppText variant="small" style={styles.gradeText}>
                {s.grade}
              </AppText>
            </View>
          </Card>
        ))
      )}
    </Screen>
  );
}

function Tile({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <Card style={styles.tile}>
      <AppText variant="small">{label}</AppText>
      <AppText style={[styles.tileValue, { color: tone }]}>{value}</AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  tiles: { flexDirection: "row", gap: spacing.sm },
  tile: { flex: 1, gap: 4, padding: spacing.md },
  tileValue: { fontSize: 21, fontWeight: fontWeight.bold },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  rowTitle: { fontSize: 15 },
  badge: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: colors.primaryText, fontWeight: fontWeight.bold },
  grade: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  gradeText: { color: colors.primaryText, fontWeight: fontWeight.bold },
});

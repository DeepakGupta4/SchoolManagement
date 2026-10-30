import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { AppText, Card, DashboardScreen, HeroAction, NoticeCard } from "@/components";
import { getStudentMe, getStudentReport, type StudentMe, type StudentReport } from "@/api/portal";
import { ApiError } from "@/api/client";
import { useAuth } from "@/store/auth";
import { colors, radius, spacing, fontWeight, fontSize } from "@/theme";

/** Student home: profile + attendance/performance/fee + today's classes + report card. */
export default function StudentHome() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const [me, setMe] = useState<StudentMe | null>(null);
  const [report, setReport] = useState<StudentReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
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

  const name = me?.profile.name || user?.name || "Student";
  const meta = me
    ? [me.profile.className, me.profile.section, me.profile.rollNo ? `Roll ${me.profile.rollNo}` : ""]
        .filter(Boolean)
        .join(" · ")
    : undefined;
  const bus = (
    <HeroAction icon="bus-outline" onPress={() => router.push("/track")} accessibilityLabel="Track the school bus" />
  );

  return (
    <DashboardScreen
      name={name}
      avatarUri={me?.profile.avatar || undefined}
      meta={meta}
      rightSlot={bus}
      loading={loading && !me}
    >
      {!me ? (
        <NoticeCard
          error={error}
          emptyText="No student record is linked to your account. Ask the office to check your email."
          onRetry={load}
        />
      ) : (
        <>
          <View style={styles.statRow}>
            <StatMini label="Attendance" value={`${me.stats.attendancePercent}%`} tone={colors.successText} />
            <StatMini label="Performance" value={`${me.stats.performancePercent}%`} tone={colors.primaryText} />
            <StatMini
              label="Fee due"
              value={me.stats.feeDue > 0 ? `₹${me.stats.feeDue}` : "₹0"}
              tone={me.stats.feeDue > 0 ? colors.dangerText : colors.successText}
            />
          </View>

          <Card style={styles.block}>
            <AppText variant="heading">Today&apos;s classes</AppText>
            {me.todaysPeriods.length === 0 ? (
              <AppText variant="muted">No classes scheduled today.</AppText>
            ) : (
              me.todaysPeriods.map((p) => (
                <View key={p.period} style={styles.row}>
                  <View style={styles.periodNo}>
                    <AppText style={styles.periodNoText}>P{p.period}</AppText>
                  </View>
                  <View style={styles.flex}>
                    <AppText variant="heading" style={styles.rowTitle}>
                      {p.subject || "—"}
                    </AppText>
                    <AppText variant="muted">
                      {[p.time, p.teacher, p.room ? `Room ${p.room}` : ""].filter(Boolean).join(" · ") || "—"}
                    </AppText>
                  </View>
                </View>
              ))
            )}
          </Card>

          <Card style={styles.block}>
            <AppText variant="heading">My report card{report?.gpa ? ` · GPA ${report.gpa}` : ""}</AppText>
            {!report || report.subjects.length === 0 ? (
              <AppText variant="muted">No marks published yet.</AppText>
            ) : (
              report.subjects.map((s, i) => (
                <View key={`${s.subject}-${i}`} style={styles.row}>
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
                </View>
              ))
            )}
          </Card>
        </>
      )}
    </DashboardScreen>
  );
}

function StatMini({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <Card style={styles.stat}>
      <AppText style={[styles.statValue, { color: tone }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </AppText>
      <AppText style={styles.statLabel} numberOfLines={1}>
        {label}
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  block: { gap: spacing.sm },

  statRow: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  stat: { flex: 1, gap: 4, padding: spacing.md },
  statValue: { fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  statLabel: { fontSize: fontSize.xs, color: colors.muted },

  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  rowTitle: { fontSize: fontSize.md },
  periodNo: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  periodNoText: { color: colors.primaryText, fontWeight: fontWeight.bold, fontSize: fontSize.sm },
  grade: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  gradeText: { color: colors.primaryText, fontWeight: fontWeight.bold },
});

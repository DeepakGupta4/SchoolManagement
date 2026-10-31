import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen, ScreenHeader, AppText, Card, StatCard, Loading, PagedList } from "@/components";
import { getStaffMe, type StaffMe, type StaffAttendanceStatus } from "@/api/portal";
import { ApiError } from "@/api/client";
import { prettyDate } from "@/lib/date";
import { colors, radius, spacing, fontWeight, fontSize } from "@/theme";

// Each status → its soft background + readable text + icon.
const STATUS_META: Record<StaffAttendanceStatus, { bg: string; fg: string; icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  present: { bg: colors.successSoft, fg: colors.successText, icon: "checkmark-circle", label: "Present" },
  absent: { bg: colors.dangerSoft, fg: colors.dangerText, icon: "close-circle", label: "Absent" },
  late: { bg: colors.warningSoft, fg: colors.warningText, icon: "time", label: "Late" },
  "half-day": { bg: colors.infoSoft, fg: colors.infoText, icon: "contrast", label: "Half day" },
  leave: { bg: colors.surfaceAlt, fg: colors.muted, icon: "cafe", label: "Leave" },
};

/** The driver's OWN attendance — summary + recent days (read-only, office marks it). */
export default function DriverAttendance() {
  const [me, setMe] = useState<StaffMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setMe(await getStaffMe());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load your attendance.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const att = me?.attendance;

  if (loading && !me) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading your attendance…" />
      </Screen>
    );
  }

  const hasData = !!att && att.marked > 0;

  return (
    <Screen scroll={false} style={{ gap: spacing.md }}>
      <ScreenHeader title="My Attendance" back />

      {error ? (
        <Card>
          <AppText variant="muted">{error}</AppText>
        </Card>
      ) : !hasData ? (
        <Card style={styles.empty}>
          <Ionicons name="checkbox-outline" size={28} color={colors.muted} />
          <AppText variant="heading">No attendance yet</AppText>
          <AppText variant="muted" style={styles.emptyText}>
            Your daily attendance appears here once the office starts marking it. (If you were just marked,
            pull to refresh.)
          </AppText>
        </Card>
      ) : (
        <PagedList
          data={att!.recent}
          keyExtractor={(r) => (r as { date: string }).date}
          refreshing={loading}
          onRefresh={load}
          contentContainerStyle={{ gap: spacing.md }}
          ListHeaderComponent={
            <View style={{ gap: spacing.md }}>
              {/* Headline percent */}
              <Card style={styles.hero}>
                <AppText style={styles.heroPct}>{att!.percent}%</AppText>
                <AppText variant="muted">
                  attendance · {att!.present + att!.late + att!.halfDay}/{att!.marked} days present
                </AppText>
              </Card>

              <View style={styles.statRow}>
                <StatCard label="Present" value={att!.present} icon="checkmark-circle-outline" tone="success" />
                <StatCard label="Absent" value={att!.absent} icon="close-circle-outline" tone="danger" />
              </View>
              <View style={styles.statRow}>
                <StatCard label="Late" value={att!.late} icon="time-outline" tone="warning" />
                <StatCard label="Half day" value={att!.halfDay} icon="contrast-outline" tone="info" />
                <StatCard label="Leave" value={att!.leave} icon="cafe-outline" tone="primary" />
              </View>

              <AppText variant="heading">Recent days</AppText>
            </View>
          }
          renderItem={({ item }) => {
            const r = item as { date: string; status: StaffAttendanceStatus };
            const m = STATUS_META[r.status] ?? STATUS_META.present;
            return (
              <Card style={styles.row}>
                <View style={[styles.rowIcon, { backgroundColor: m.bg }]}>
                  <Ionicons name={m.icon} size={18} color={m.fg} />
                </View>
                <AppText style={styles.flex}>{prettyDate(r.date)}</AppText>
                <View style={[styles.badge, { backgroundColor: m.bg }]}>
                  <AppText variant="small" style={{ color: m.fg, fontWeight: fontWeight.semibold }}>
                    {m.label}
                  </AppText>
                </View>
              </Card>
            );
          }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  empty: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xl },
  emptyText: { textAlign: "center" },

  hero: { alignItems: "center", gap: 2, paddingVertical: spacing.lg },
  heroPct: { fontSize: 40, fontWeight: fontWeight.bold, color: colors.primary },

  statRow: { flexDirection: "row", gap: spacing.md },

  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  rowIcon: { width: 36, height: 36, borderRadius: radius.md, alignItems: "center", justifyContent: "center" },
  badge: { borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
});

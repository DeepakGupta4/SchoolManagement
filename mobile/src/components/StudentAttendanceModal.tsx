import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "./AppText";
import { Avatar } from "./Avatar";
import { Loading } from "./Loading";
import { getStudentAttendance, type StudentAttendance } from "@/api/attendance";
import { ApiError } from "@/api/client";
import { prettyDate } from "@/lib/date";
import { colors, radius, spacing, fontSize, fontWeight, shadow } from "@/theme";

/** The five counts shown as tiles — colours match the roll-call legend. */
const TILES = [
  { key: "present", label: "Present", color: colors.success },
  { key: "absent", label: "Absent", color: colors.danger },
  { key: "late", label: "Late", color: colors.warning },
  { key: "halfDay", label: "Half-day", color: colors.info },
  { key: "leave", label: "Leave", color: colors.subtle },
] as const;

const STATUS_COLOR: Record<string, string> = {
  present: colors.success,
  absent: colors.danger,
  late: colors.warning,
  "half-day": colors.info,
  leave: colors.subtle,
};

type Props = {
  studentId: string | null; // null = closed
  name: string;
  avatarUri?: string;
  onClose: () => void;
};

/** Tap-a-student popup: that student's present/absent/… tally + recent history. */
export function StudentAttendanceModal({ studentId, name, avatarUri, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<StudentAttendance | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;
    let alive = true;
    setLoading(true);
    setData(null);
    setError(null);
    getStudentAttendance(studentId)
      .then((d) => alive && setData(d))
      .catch((e) => {
        if (!alive) return;
        if (e instanceof ApiError && e.status === 404) {
          setError("Attendance history isn't available on the server yet — please try again after the next update.");
        } else {
          setError(e instanceof ApiError ? e.message : "Could not load attendance.");
        }
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [studentId]);

  const s = data?.summary;

  return (
    <Modal visible={!!studentId} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.header}>
            <Avatar name={name} uri={avatarUri} size={48} />
            <View style={styles.headerText}>
              <AppText variant="heading" numberOfLines={1}>
                {name}
              </AppText>
              {data ? (
                <AppText variant="muted" numberOfLines={1}>
                  Class {data.student.className}
                  {data.student.section ? ` · ${data.student.section}` : ""}
                  {data.student.rollNo ? ` · Roll ${data.student.rollNo}` : ""}
                </AppText>
              ) : null}
            </View>
            <Pressable onPress={onClose} hitSlop={8} style={styles.close} accessibilityLabel="Close">
              <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>

          {loading ? (
            <Loading label="Loading attendance…" />
          ) : error ? (
            <AppText variant="muted" style={styles.msg}>
              {error}
            </AppText>
          ) : s ? (
            <>
              <View style={styles.percentRow}>
                <AppText style={styles.percent}>{s.percent}%</AppText>
                <AppText variant="muted">
                  attendance · {s.total} day{s.total === 1 ? "" : "s"} recorded
                </AppText>
              </View>

              <View style={styles.tiles}>
                {TILES.map((t) => (
                  <View key={t.key} style={styles.tile}>
                    <AppText style={[styles.tileCount, { color: t.color }]}>{s[t.key]}</AppText>
                    <AppText style={styles.tileLabel}>{t.label}</AppText>
                  </View>
                ))}
              </View>

              {data!.records.length > 0 ? (
                <>
                  <AppText variant="muted" style={styles.recentLabel}>
                    Recent
                  </AppText>
                  <ScrollView style={styles.recent} showsVerticalScrollIndicator={false}>
                    {data!.records.slice(0, 15).map((r, i) => (
                      <View key={`${r.date}-${i}`} style={styles.recentRow}>
                        <View style={[styles.dot, { backgroundColor: STATUS_COLOR[r.status] ?? colors.subtle }]} />
                        <AppText style={styles.recentDate}>{prettyDate(r.date)}</AppText>
                        <AppText style={[styles.recentStatus, { color: STATUS_COLOR[r.status] ?? colors.muted }]}>
                          {r.status}
                        </AppText>
                      </View>
                    ))}
                  </ScrollView>
                </>
              ) : (
                <AppText variant="muted" style={styles.msg}>
                  No attendance recorded yet.
                </AppText>
              )}
            </>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.scrim, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow.lg,
  },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  headerText: { flex: 1, gap: 2 },
  close: { padding: spacing.xs },
  msg: { paddingVertical: spacing.sm },

  percentRow: { alignItems: "center", gap: 2 },
  percent: { fontSize: 40, fontWeight: fontWeight.bold, color: colors.primary },

  tiles: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  tile: {
    flexGrow: 1,
    flexBasis: "30%",
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
  },
  tileCount: { fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  tileLabel: { fontSize: fontSize.xs, color: colors.muted },

  recentLabel: { fontWeight: fontWeight.semibold },
  recent: { maxHeight: 180 },
  recentRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  recentDate: { flex: 1, color: colors.text, fontSize: fontSize.sm },
  recentStatus: { fontSize: fontSize.xs, textTransform: "capitalize", fontWeight: fontWeight.medium },
});

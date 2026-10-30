import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen, AppText, Card, Loading } from "@/components";
import { getChild, type ChildDetail } from "@/api/portal";
import { ApiError } from "@/api/client";
import { colors, radius, spacing, fontWeight } from "@/theme";

/** One child in detail — stats + subject-wise report card. */
export default function Child() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [data, setData] = useState<ChildDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!id) {
        setError("No child selected.");
        setLoading(false);
        return;
      }
      try {
        const d = await getChild(id);
        if (alive) setData(d);
      } catch (e) {
        if (alive) setError(e instanceof ApiError ? e.message : "Could not load this child.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  if (loading) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading…" />
      </Screen>
    );
  }

  if (!data) {
    return (
      <Screen style={{ gap: spacing.md }}>
        <BackRow onBack={() => router.back()} title="Child" />
        <Card>
          <AppText variant="muted">{error ?? "Not found."}</AppText>
        </Card>
      </Screen>
    );
  }

  const { profile, stats, subjects } = data;

  return (
    <Screen style={{ gap: spacing.md }}>
      <BackRow onBack={() => router.back()} title={profile.name} />
      <AppText variant="muted">
        {profile.className}
        {profile.section ? ` · ${profile.section}` : ""}
        {profile.rollNo ? ` · Roll ${profile.rollNo}` : ""}
      </AppText>

      <View style={styles.tiles}>
        <Tile label="Attendance" value={`${stats.attendancePercent}%`} tone={colors.success} />
        <Tile label="Performance" value={`${stats.performancePercent}%`} tone={colors.primary} />
      </View>
      <View style={styles.tiles}>
        <Tile
          label="Fee due"
          value={stats.feeDue > 0 ? `₹${stats.feeDue}` : "₹0"}
          tone={stats.feeDue > 0 ? colors.danger : colors.success}
        />
        <Tile label="GPA" value={String(stats.gpa)} tone={colors.primary} />
      </View>

      <AppText variant="heading">Report card</AppText>
      {subjects.length === 0 ? (
        <AppText variant="muted">No marks published yet.</AppText>
      ) : (
        subjects.map((s) => (
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

function BackRow({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <View style={styles.backRow}>
      <Pressable onPress={onBack} hitSlop={10}>
        <Ionicons name="chevron-back" size={26} color={colors.text} />
      </Pressable>
      <AppText variant="title" style={styles.flex}>
        {title}
      </AppText>
    </View>
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
  backRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  tiles: { flexDirection: "row", gap: spacing.sm },
  tile: { flex: 1, gap: 4, padding: spacing.md },
  tileValue: { fontSize: 21, fontWeight: fontWeight.bold },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  rowTitle: { fontSize: 15 },
  grade: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  gradeText: { color: colors.primaryText, fontWeight: fontWeight.bold },
});

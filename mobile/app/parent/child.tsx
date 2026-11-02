import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen, ScreenHeader, AppText, Card, Button, Loading } from "@/components";
import { getChild, type ChildDetail } from "@/api/portal";
import { ApiError } from "@/api/client";
import { colors, radius, spacing, fontWeight } from "@/theme";

/** One child in detail — stats, report card, and links to their class
 *  timetable + homework. */
export default function Child() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [data, setData] = useState<ChildDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setError("No child selected.");
      setLoading(false);
      return;
    }
    setError(null);
    try {
      setData(await getChild(id));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load this child.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !data) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading…" />
      </Screen>
    );
  }

  if (!data) {
    return (
      <Screen style={{ gap: spacing.md }}>
        <ScreenHeader title="Child" back />
        <Card>
          <AppText variant="muted">{error ?? "Not found."}</AppText>
        </Card>
      </Screen>
    );
  }

  const { profile, stats, subjects } = data;

  return (
    <Screen style={{ gap: spacing.md }} onRefresh={load}>
      <View>
        <ScreenHeader title={profile.name} back />
        <AppText variant="muted">
          {profile.className}
          {profile.section ? ` · ${profile.section}` : ""}
          {profile.rollNo ? ` · Roll ${profile.rollNo}` : ""}
        </AppText>
      </View>

      <View style={styles.tiles}>
        <Tile label="Attendance" value={`${stats.attendancePercent}%`} tone={colors.successText} />
        <Tile label="Performance" value={`${stats.performancePercent}%`} tone={colors.primaryText} />
      </View>
      <View style={styles.tiles}>
        <Tile label="Fee due" value={stats.feeDue > 0 ? `₹${stats.feeDue}` : "₹0"} tone={stats.feeDue > 0 ? colors.dangerText : colors.successText} />
        <Tile label="GPA" value={String(stats.gpa)} tone={colors.primaryText} />
      </View>

      {/* Quick links to this child's class */}
      <View style={styles.tiles}>
        <Button
          title="Timetable"
          variant="outline"
          style={styles.flex}
          onPress={() =>
            router.push({
              pathname: "/parent/timetable",
              params: { class: profile.className, section: profile.section, name: profile.name },
            })
          }
        />
        <Button
          title="Homework"
          variant="outline"
          style={styles.flex}
          onPress={() =>
            router.push({ pathname: "/parent/homework", params: { class: profile.className, name: profile.name } })
          }
        />
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

function Tile({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <Card style={styles.tile}>
      <AppText variant="muted" numberOfLines={1}>
        {label}
      </AppText>
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
  grade: { backgroundColor: colors.primarySoft, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  gradeText: { color: colors.primaryText, fontWeight: fontWeight.bold },
});

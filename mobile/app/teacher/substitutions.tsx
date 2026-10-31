import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Screen, ScreenHeader, AppText, Card, Loading, PagedList } from "@/components";
import { getMyTeacher } from "@/api/teacher";
import { listSubstitutions, type Substitution } from "@/api/substitutions";
import { ApiError } from "@/api/client";
import { prettyDate } from "@/lib/date";
import { colors, radius, spacing, fontWeight } from "@/theme";

/** A teacher's own cover duties — read-only (office assigns them). */
export default function Substitutions() {
  const [rows, setRows] = useState<Substitution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // No server email scope on /substitutions — filter to my own by email.
      const [t, subs] = await Promise.all([getMyTeacher(), listSubstitutions()]);
      const myEmail = (t.email ?? "").toLowerCase();
      setRows(
        subs
          .filter((s) => s.status === "assigned" && (s.substituteEmail ?? "").toLowerCase() === myEmail)
          .sort((a, b) => a.date.localeCompare(b.date))
      );
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load your cover duties.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading && rows.length === 0) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading cover duties…" />
      </Screen>
    );
  }

  return (
    <Screen scroll={false} style={{ gap: spacing.md }}>
      <View>
        <ScreenHeader title="My Cover Duties" back />
        <AppText variant="muted">Classes you've been assigned to cover.</AppText>
      </View>

      {error ? (
        <Card>
          <AppText style={{ color: colors.dangerText }}>{error}</AppText>
        </Card>
      ) : (
        <PagedList
          data={rows}
          keyExtractor={(s) => s.id}
          pageSize={15}
          refreshing={loading}
          onRefresh={load}
          emptyText="No cover duties assigned to you. 🎉"
          renderItem={({ item: s }) => (
            <Card style={styles.item}>
              <View style={styles.dateCol}>
                <AppText variant="small" style={styles.dateText}>
                  {prettyDate(s.date)}
                </AppText>
                {s.day ? <AppText variant="small">{s.day}</AppText> : null}
              </View>
              <View style={styles.flex}>
                <AppText variant="heading" style={styles.title}>
                  {s.className}
                  {s.subject ? ` · ${s.subject}` : ""}
                </AppText>
                <AppText variant="muted">
                  Period {s.period}
                  {s.time ? ` · ${s.time}` : ""}
                  {s.room ? ` · Room ${s.room}` : ""}
                </AppText>
                {s.absentTeacher ? <AppText variant="small">Covering {s.absentTeacher}</AppText> : null}
                {s.note ? <AppText variant="small" style={{ color: colors.muted }}>{s.note}</AppText> : null}
              </View>
            </Card>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  item: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  dateCol: {
    width: 72,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  dateText: { color: colors.primaryText, fontWeight: fontWeight.bold },
  title: { fontSize: 15 },
});

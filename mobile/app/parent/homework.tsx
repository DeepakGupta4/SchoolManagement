import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen, ScreenHeader, AppText, Card, Loading, TextField, PagedList } from "@/components";
import { listHomework, type Homework } from "@/api/homework";
import { ApiError } from "@/api/client";
import { colors, radius, spacing } from "@/theme";

/** Read-only homework for a child's class (parent view). */
export default function ParentHomework() {
  const { class: klass, name } = useLocalSearchParams<{ class?: string; name?: string }>();
  const className = typeof klass === "string" ? klass : "";
  const [rows, setRows] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(
    async (opts?: { refresh?: boolean }) => {
      if (opts?.refresh) setRefreshing(true);
      setError(null);
      try {
        setRows(await listHomework(className || undefined));
      } catch (e) {
        setError(e instanceof ApiError ? e.message : "Could not load homework.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [className]
  );

  useEffect(() => {
    load();
  }, [load]);

  const q = search.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      rows.filter((h) => !q || [h.title, h.subject, h.teacher].some((f) => (f ?? "").toLowerCase().includes(q))),
    [rows, q]
  );

  if (loading && rows.length === 0) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading homework…" />
      </Screen>
    );
  }

  return (
    <Screen scroll={false} style={{ gap: spacing.md }}>
      <View>
        <ScreenHeader title="Homework" back />
        {className ? <AppText variant="muted">{typeof name === "string" ? `${name} · ` : ""}{className}</AppText> : null}
      </View>

      {error ? (
        <Card>
          <AppText variant="muted">{error}</AppText>
        </Card>
      ) : (
        <PagedList
          data={filtered}
          resetKey={q}
          keyExtractor={(h) => (h as Homework).id ?? (h as Homework).title}
          refreshing={refreshing}
          onRefresh={() => load({ refresh: true })}
          emptyText={q ? "No matches." : "No homework posted for this class yet."}
          ListHeaderComponent={
            rows.length > 0 ? (
              <TextField label="" value={search} onChangeText={setSearch} placeholder="Search homework…" autoCapitalize="none" />
            ) : null
          }
          renderItem={({ item }) => {
            const h = item as Homework;
            return (
              <Card style={styles.row}>
                <View style={styles.icon}>
                  <Ionicons name="document-text-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.flex}>
                  <AppText variant="heading" style={styles.title} numberOfLines={2}>
                    {h.title}
                  </AppText>
                  <AppText variant="muted" numberOfLines={1}>
                    {[h.subject, h.due ? `Due ${h.due}` : "", h.teacher].filter(Boolean).join(" · ") || "—"}
                  </AppText>
                  {h.description ? (
                    <AppText variant="small" style={styles.desc} numberOfLines={3}>
                      {h.description}
                    </AppText>
                  ) : null}
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
  row: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  icon: { width: 38, height: 38, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 15 },
  desc: { color: colors.muted, marginTop: 2 },
});

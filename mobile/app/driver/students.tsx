import { useCallback, useMemo, useState } from "react";
import { Linking, Pressable, StyleSheet, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen, ScreenHeader, AppText, Card, Avatar, Loading, TextField, PagedList } from "@/components";
import { listMyRouteStudents, type RouteStudent } from "@/api/transport";
import { ApiError } from "@/api/client";
import { colors, radius, spacing, fontWeight } from "@/theme";

/** The pupils riding the driver's own route(s) — pickup list with a one-tap guardian call. */
export default function DriverStudents() {
  const [rows, setRows] = useState<RouteStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async (opts?: { refresh?: boolean }) => {
    if (opts?.refresh) setRefreshing(true);
    setError(null);
    try {
      setRows(await listMyRouteStudents());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load your students.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const q = search.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      rows.filter(
        (s) => !q || s.name.toLowerCase().includes(q) || s.pickupPoint.toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q)
      ),
    [rows, q]
  );

  if (loading && rows.length === 0) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading your students…" />
      </Screen>
    );
  }

  return (
    <Screen scroll={false} style={{ gap: spacing.md }}>
      <ScreenHeader title="My Students" back />

      {error ? (
        <Card>
          <AppText variant="muted">{error}</AppText>
        </Card>
      ) : (
        <PagedList
          data={filtered}
          resetKey={q}
          keyExtractor={(s) => (s as RouteStudent).id}
          refreshing={refreshing}
          onRefresh={() => load({ refresh: true })}
          emptyText={
            q
              ? "No matches."
              : "No students are assigned to your route yet. The office links riders to a route by its code."
          }
          ListHeaderComponent={
            rows.length > 0 ? (
              <View style={styles.header}>
                <AppText variant="muted">
                  {rows.length} student{rows.length === 1 ? "" : "s"} on your route
                </AppText>
                <TextField label="" value={search} onChangeText={setSearch} placeholder="Search name, stop or roll…" autoCapitalize="none" />
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const s = item as RouteStudent;
            return (
              <Card style={styles.row}>
                <Avatar name={s.name} uri={s.avatar} size={44} />
                <View style={styles.flex}>
                  <AppText variant="heading" style={styles.name} numberOfLines={1}>
                    {s.name}
                  </AppText>
                  <AppText variant="muted" numberOfLines={1}>
                    {[s.className, s.section].filter(Boolean).join(" · ")}
                    {s.rollNo ? ` · Roll ${s.rollNo}` : ""}
                  </AppText>
                  {s.pickupPoint ? (
                    <View style={styles.pickup}>
                      <Ionicons name="location-outline" size={13} color={colors.primary} />
                      <AppText variant="small" style={styles.pickupText} numberOfLines={1}>
                        {s.pickupPoint}
                      </AppText>
                    </View>
                  ) : null}
                </View>
                {s.guardianPhone ? (
                  <Pressable
                    onPress={() => Linking.openURL(`tel:${s.guardianPhone}`)}
                    style={styles.callBtn}
                    accessibilityLabel={`Call ${s.name}'s guardian`}
                  >
                    <Ionicons name="call" size={18} color={colors.onPrimary} />
                  </Pressable>
                ) : null}
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
  header: { gap: spacing.sm, marginBottom: spacing.md },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  name: { fontSize: 15 },
  pickup: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  pickupText: { color: colors.primaryText, flexShrink: 1 },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
});

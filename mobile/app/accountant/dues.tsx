import { useCallback, useMemo, useState } from "react";
import { Linking, Pressable, StyleSheet, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen, ScreenHeader, AppText, Card, Button, Avatar, Loading, TextField, PagedList } from "@/components";
import { listFeeAccounts, accountBalance, inr, type FeeAccount } from "@/api/finance";
import { ApiError } from "@/api/client";
import { colors, radius, spacing, fontWeight, fontSize } from "@/theme";

/** Students with outstanding fees — the accountant's defaulter list (read-only
 *  + one-tap guardian call). Collection itself stays on the web fee desk. */
export default function Dues() {
  const [rows, setRows] = useState<FeeAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async (opts?: { refresh?: boolean }) => {
    if (opts?.refresh) setRefreshing(true);
    setError(null);
    try {
      setRows(await listFeeAccounts());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load fee dues.");
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
  const dues = useMemo(() => {
    return rows
      .map((a) => ({ a, balance: accountBalance(a) }))
      .filter((x) => x.balance > 0)
      .filter(
        (x) =>
          !q ||
          (x.a.name ?? "").toLowerCase().includes(q) ||
          (x.a.className ?? "").toLowerCase().includes(q) ||
          (x.a.rollNo ?? "").toLowerCase().includes(q)
      )
      .sort((p, r) => r.balance - p.balance);
  }, [rows, q]);

  const totalDue = useMemo(() => dues.reduce((s, x) => s + x.balance, 0), [dues]);

  if (loading && rows.length === 0) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading fee dues…" />
      </Screen>
    );
  }

  return (
    <Screen scroll={false} style={{ gap: spacing.md }}>
      <ScreenHeader title="Fee Dues" back />

      {error && rows.length === 0 ? (
        <Card style={styles.errCard}>
          <AppText variant="muted">{error}</AppText>
          <Button title="Try again" variant="outline" onPress={() => load()} />
        </Card>
      ) : (
        <PagedList
          data={dues}
          resetKey={q}
          keyExtractor={(x) => (x as { a: FeeAccount }).a.id}
          refreshing={refreshing}
          onRefresh={() => load({ refresh: true })}
          emptyText={q ? "No matches." : "No outstanding dues 🎉"}
          ListHeaderComponent={
            <View style={styles.header}>
              <AppText variant="muted">
                {dues.length} student{dues.length === 1 ? "" : "s"} · {inr(totalDue)} outstanding
              </AppText>
              <TextField label="" value={search} onChangeText={setSearch} placeholder="Search name, class or roll…" autoCapitalize="none" />
            </View>
          }
          renderItem={({ item }) => {
            const { a, balance } = item as { a: FeeAccount; balance: number };
            return (
              <Card style={styles.row}>
                <Avatar name={a.name} size={40} />
                <View style={styles.flex}>
                  <AppText variant="heading" style={styles.name} numberOfLines={1}>
                    {a.name}
                  </AppText>
                  <AppText variant="muted" numberOfLines={1}>
                    {[a.className, a.section].filter(Boolean).join(" · ")}
                    {a.rollNo ? ` · Roll ${a.rollNo}` : ""}
                  </AppText>
                  <AppText variant="small" style={styles.due}>
                    {inr(balance)} due
                  </AppText>
                </View>
                {a.guardianPhone ? (
                  <Pressable
                    onPress={() => Linking.openURL(`tel:${a.guardianPhone}`)}
                    style={styles.callBtn}
                    accessibilityLabel={`Call ${a.guardian || a.name}'s guardian`}
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
  errCard: { gap: spacing.md },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  name: { fontSize: 15 },
  due: { color: colors.warningText, fontWeight: fontWeight.bold, fontSize: fontSize.sm, marginTop: 2 },
  callBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.success, alignItems: "center", justifyContent: "center" },
});

import { useCallback, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen, ScreenHeader, AppText, Card, Button, Loading, Chips, TextField, PagedList, type ChipOption } from "@/components";
import { listPayments, inr, type Payment } from "@/api/finance";
import { ApiError } from "@/api/client";
import { prettyDate } from "@/lib/date";
import { colors, radius, spacing, fontWeight, fontSize } from "@/theme";

const FILTERS: ChipOption[] = [
  { label: "All", value: "all" },
  { label: "Paid", value: "paid" },
  { label: "Pending", value: "pending-clearance" },
  { label: "Bounced", value: "bounced" },
  { label: "Cancelled", value: "cancelled" },
];

const STATUS_TONE: Record<string, { bg: string; fg: string; label: string }> = {
  paid: { bg: colors.successSoft, fg: colors.successText, label: "Paid" },
  "pending-clearance": { bg: colors.warningSoft, fg: colors.warningText, label: "Pending" },
  bounced: { bg: colors.dangerSoft, fg: colors.dangerText, label: "Bounced" },
  cancelled: { bg: colors.surfaceAlt, fg: colors.muted, label: "Cancelled" },
};

/** Read-only payment register for the accountant: search + status filter. */
export default function Payments() {
  const [rows, setRows] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async (opts?: { refresh?: boolean }) => {
    if (opts?.refresh) setRefreshing(true);
    setError(null);
    try {
      setRows(await listPayments());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load payments.");
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
  const filtered = useMemo(() => {
    return [...rows]
      .filter((p) => (status === "all" ? true : p.status === status))
      .filter(
        (p) =>
          !q ||
          (p.studentName ?? "").toLowerCase().includes(q) ||
          (p.receiptNo ?? "").toLowerCase().includes(q) ||
          (p.className ?? "").toLowerCase().includes(q)
      )
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  }, [rows, status, q]);

  const total = useMemo(
    () => filtered.filter((p) => p.status === "paid" || p.status === "pending-clearance").reduce((s, p) => s + (p.amount || 0), 0),
    [filtered]
  );

  if (loading && rows.length === 0) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading payments…" />
      </Screen>
    );
  }

  return (
    <Screen scroll={false} style={{ gap: spacing.md }}>
      <ScreenHeader title="Payments" back />

      {error && rows.length === 0 ? (
        <Card style={styles.errCard}>
          <AppText variant="muted">{error}</AppText>
          <Button title="Try again" variant="outline" onPress={() => load()} />
        </Card>
      ) : (
        <PagedList
          data={filtered}
          resetKey={`${status}|${q}`}
          keyExtractor={(p) => (p as Payment).id}
          refreshing={refreshing}
          onRefresh={() => load({ refresh: true })}
          emptyText={q || status !== "all" ? "No matching payments." : "No payments recorded yet."}
          ListHeaderComponent={
            <View style={styles.header}>
              <AppText variant="muted">
                {filtered.length} receipt{filtered.length === 1 ? "" : "s"} · {inr(total)}
              </AppText>
              <TextField label="" value={search} onChangeText={setSearch} placeholder="Search name, receipt or class…" autoCapitalize="none" />
              <Chips options={FILTERS} value={status} onChange={setStatus} />
            </View>
          }
          renderItem={({ item }) => {
            const p = item as Payment;
            const tone = STATUS_TONE[p.status] ?? STATUS_TONE.paid;
            const voided = p.status === "cancelled" || p.status === "bounced";
            return (
              <Card style={styles.row}>
                <View style={styles.icon}>
                  <Ionicons name="receipt-outline" size={18} color={colors.primary} />
                </View>
                <View style={styles.flex}>
                  <AppText variant="heading" style={styles.name} numberOfLines={1}>
                    {p.studentName || "—"}
                  </AppText>
                  <AppText variant="muted" numberOfLines={1}>
                    {[p.receiptNo, p.className, p.method].filter(Boolean).join(" · ")}
                  </AppText>
                  <View style={[styles.badge, { backgroundColor: tone.bg }]}>
                    <AppText variant="small" style={{ color: tone.fg, fontWeight: fontWeight.semibold }}>
                      {tone.label}
                    </AppText>
                  </View>
                </View>
                <View style={styles.right}>
                  <AppText style={[styles.amount, voided && styles.voided]}>{inr(p.amount)}</AppText>
                  <AppText variant="small" style={styles.muted}>
                    {prettyDate(p.date)}
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
  muted: { color: colors.muted },
  header: { gap: spacing.sm, marginBottom: spacing.md },
  errCard: { gap: spacing.md },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  icon: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 15 },
  badge: { alignSelf: "flex-start", borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2, marginTop: 4 },
  right: { alignItems: "flex-end" },
  amount: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },
  voided: { color: colors.muted, textDecorationLine: "line-through" },
});

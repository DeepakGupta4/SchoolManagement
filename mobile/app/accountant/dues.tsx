import { useCallback, useMemo, useState } from "react";
import { Linking, Pressable, StyleSheet, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Screen,
  ScreenHeader,
  AppText,
  Card,
  Button,
  Avatar,
  Loading,
  Chips,
  TextField,
  PagedList,
  FeeDuesPreviewModal,
  type ChipOption,
} from "@/components";
import { listFeeAccounts, accountBalance, inr, type FeeAccount } from "@/api/finance";
import { listStudents, type Student } from "@/api/students";
import { ApiError } from "@/api/client";
import { colors, radius, spacing, fontWeight, fontSize } from "@/theme";

type DueRow = { a: FeeAccount; balance: number };

/** Students with outstanding fees — photo, class filter, search, tap for details.
 *  Collection itself stays on the web fee desk (this is read-only). */
export default function Dues() {
  const [rows, setRows] = useState<FeeAccount[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [previewId, setPreviewId] = useState<string | null>(null);

  const load = useCallback(async (opts?: { refresh?: boolean }) => {
    if (opts?.refresh) setRefreshing(true);
    setError(null);
    try {
      // Students ride alongside for the photo + full preview; best-effort so a
      // students-read hiccup never blanks the dues list.
      const [accts, studs] = await Promise.all([
        listFeeAccounts(),
        listStudents({ status: "active" }).catch(() => [] as Student[]),
      ]);
      setRows(accts);
      setStudents(studs);
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

  const studentById = useMemo(() => {
    const m: Record<string, Student> = {};
    for (const s of students) if (s.id) m[s.id] = s;
    return m;
  }, [students]);

  const owing = useMemo<DueRow[]>(
    () => rows.map((a) => ({ a, balance: accountBalance(a) })).filter((x) => x.balance > 0),
    [rows]
  );

  const classOptions = useMemo<ChipOption[]>(() => {
    const set = new Set<string>();
    owing.forEach((x) => x.a.className && set.add(x.a.className));
    return [{ label: "All classes", value: "all" }, ...[...set].sort().map((c) => ({ label: c, value: c }))];
  }, [owing]);

  const q = search.trim().toLowerCase();
  const dues = useMemo(
    () =>
      owing
        .filter((x) => classFilter === "all" || x.a.className === classFilter)
        .filter(
          (x) =>
            !q ||
            x.a.name.toLowerCase().includes(q) ||
            (x.a.className ?? "").toLowerCase().includes(q) ||
            (x.a.rollNo ?? "").toLowerCase().includes(q)
        )
        .sort((p, r) => r.balance - p.balance),
    [owing, classFilter, q]
  );

  const totalDue = useMemo(() => dues.reduce((s, x) => s + x.balance, 0), [dues]);

  const previewAccount = rows.find((a) => a.id === previewId) ?? null;
  const previewStudent = previewAccount ? studentById[previewAccount.studentId] ?? null : null;

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
          resetKey={`${classFilter}|${q}`}
          keyExtractor={(x) => (x as DueRow).a.id}
          refreshing={refreshing}
          onRefresh={() => load({ refresh: true })}
          emptyText={q || classFilter !== "all" ? "No matches." : "No outstanding dues 🎉"}
          ListHeaderComponent={
            <View style={styles.header}>
              <AppText variant="muted">
                {dues.length} student{dues.length === 1 ? "" : "s"} · {inr(totalDue)} outstanding
              </AppText>
              <TextField label="" value={search} onChangeText={setSearch} placeholder="Search name, class or roll…" autoCapitalize="none" />
              {classOptions.length > 2 ? <Chips options={classOptions} value={classFilter} onChange={setClassFilter} /> : null}
            </View>
          }
          renderItem={({ item }) => {
            const { a, balance } = item as DueRow;
            const st = studentById[a.studentId];
            const phone = a.guardianPhone || st?.guardian?.phone || "";
            return (
              <Pressable onPress={() => setPreviewId(a.id)} accessibilityRole="button">
                <Card style={styles.row}>
                  <Avatar name={a.name} uri={st?.avatar} size={44} />
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
                  {phone ? (
                    <Pressable
                      onPress={() => Linking.openURL(`tel:${phone}`)}
                      style={styles.callBtn}
                      accessibilityLabel={`Call ${a.guardian || a.name}'s guardian`}
                    >
                      <Ionicons name="call" size={18} color={colors.onPrimary} />
                    </Pressable>
                  ) : null}
                  <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                </Card>
              </Pressable>
            );
          }}
        />
      )}

      <FeeDuesPreviewModal account={previewAccount} student={previewStudent} onClose={() => setPreviewId(null)} />
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

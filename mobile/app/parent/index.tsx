import { useCallback, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen, AppText, Card, Button, Loading } from "@/components";
import { getChildren, type ChildSummary } from "@/api/portal";
import { ApiError } from "@/api/client";
import { colors, spacing, fontWeight } from "@/theme";

/** Parent home: their children, each tappable into a detailed report. */
export default function ParentHome() {
  const router = useRouter();
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setChildren(await getChildren());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load your children.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading && children.length === 0) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading…" />
      </Screen>
    );
  }

  return (
    <Screen style={{ gap: spacing.md }}>
      <AppText variant="title">My Children</AppText>
      <Button title="Track the school bus" variant="outline" onPress={() => router.push("/track")} />

      {error ? (
        <Card>
          <AppText style={{ color: colors.dangerText }}>{error}</AppText>
        </Card>
      ) : children.length === 0 ? (
        <AppText variant="muted">
          No children are linked to your account. Ask the office to add your email to your child's
          record.
        </AppText>
      ) : (
        children.map((c) => (
          <Pressable key={c.id} onPress={() => router.push({ pathname: "/parent/child", params: { id: c.id } })}>
            <Card style={styles.card}>
              <View style={styles.rowTop}>
                <View style={styles.avatar}>
                  <AppText style={styles.avatarText}>{(c.name || "?").slice(0, 1).toUpperCase()}</AppText>
                </View>
                <View style={styles.flex}>
                  <AppText variant="heading" style={styles.name}>
                    {c.name}
                  </AppText>
                  <AppText variant="muted">
                    {c.className}
                    {c.section ? ` · ${c.section}` : ""}
                    {c.rollNo ? ` · Roll ${c.rollNo}` : ""}
                  </AppText>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.subtle} />
              </View>
              <View style={styles.mini}>
                <Mini label="Attendance" value={`${c.attendancePercent}%`} />
                <Mini label="Performance" value={`${c.performancePercent}%`} />
                <Mini label="Fee due" value={c.feeDue > 0 ? `₹${c.feeDue}` : "₹0"} />
              </View>
            </Card>
          </Pressable>
        ))
      )}
    </Screen>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.flex}>
      <AppText variant="small">{label}</AppText>
      <AppText style={styles.miniValue}>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { gap: spacing.md },
  rowTop: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.primaryText, fontSize: 18, fontWeight: fontWeight.bold },
  name: { fontSize: 16 },
  mini: { flexDirection: "row", gap: spacing.sm },
  miniValue: { fontSize: 16, fontWeight: fontWeight.semibold, color: colors.text, marginTop: 2 },
});

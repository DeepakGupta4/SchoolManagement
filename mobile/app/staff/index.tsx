import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AppText, Card, DashboardScreen, HeroAction, NoticeCard } from "@/components";
import { getStaffMe, type StaffMe } from "@/api/portal";
import { ApiError } from "@/api/client";
import { useAuth } from "@/store/auth";
import { colors, radius, spacing, fontWeight, fontSize } from "@/theme";

const SOON: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: "calendar-clear-outline", label: "Leave requests" },
  { icon: "checkbox-outline", label: "My attendance" },
  { icon: "cash-outline", label: "Payslips" },
];

/** Staff home: identity + details (self-service grows from here). */
export default function StaffHome() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const [me, setMe] = useState<StaffMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setMe(await getStaffMe());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load your profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const name = me?.profile.name || user?.name || "Staff";
  const meta = me ? [me.profile.role, me.profile.dept].filter(Boolean).join(" · ") || undefined : undefined;
  const bus = (
    <HeroAction icon="bus-outline" onPress={() => router.push("/track")} accessibilityLabel="Track the school bus" />
  );

  return (
    <DashboardScreen name={name} avatarUri={me?.profile.avatar || undefined} meta={meta} rightSlot={bus} loading={loading && !me}>
      {!me ? (
        <NoticeCard
          error={error}
          emptyText="No staff record is linked to your account. Ask the office to check your email."
          onRetry={load}
        />
      ) : (
        <>
          <Card style={styles.block}>
            <AppText variant="heading">My details</AppText>
            <Row icon="id-card-outline" label="Employee ID" value={me.profile.employeeId || "—"} />
            <Row icon="business-outline" label="Department" value={me.profile.dept || "—"} />
            <Row icon="person-outline" label="Role" value={me.profile.role || "—"} />
          </Card>

          <Card style={styles.block}>
            <AppText variant="heading">Self-service</AppText>
            {SOON.map((s) => (
              <View key={s.label} style={styles.soonRow}>
                <View style={styles.rowIcon}>
                  <Ionicons name={s.icon} size={18} color={colors.subtle} />
                </View>
                <AppText variant="muted" style={styles.flex}>
                  {s.label}
                </AppText>
                <View style={styles.soonPill}>
                  <AppText style={styles.soonText}>Soon</AppText>
                </View>
              </View>
            ))}
          </Card>
        </>
      )}
    </DashboardScreen>
  );
}

function Row({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <AppText variant="muted" style={styles.flex}>
        {label}
      </AppText>
      <AppText style={styles.rowValue}>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  block: { gap: spacing.sm },

  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.xs },
  soonRow: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginTop: spacing.xs },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  rowValue: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  soonPill: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  soonText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.muted },
});

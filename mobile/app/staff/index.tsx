import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Screen, AppText, Card, Button, Loading } from "@/components";
import { getStaffMe, type StaffMe } from "@/api/portal";
import { ApiError } from "@/api/client";
import { colors, spacing, fontWeight } from "@/theme";

/** Staff home: identity + quick links (self-service grows from here). */
export default function StaffHome() {
  const router = useRouter();
  const [me, setMe] = useState<StaffMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
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

  if (loading) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading…" />
      </Screen>
    );
  }

  return (
    <Screen style={{ gap: spacing.md }}>
      <AppText variant="title">My Workspace</AppText>

      {me ? (
        <Card style={styles.profile}>
          <View style={styles.avatar}>
            <AppText style={styles.avatarText}>{(me.profile.name || "?").slice(0, 1).toUpperCase()}</AppText>
          </View>
          <View style={styles.flex}>
            <AppText variant="heading">{me.profile.name}</AppText>
            <AppText variant="muted">{[me.profile.role, me.profile.dept].filter(Boolean).join(" · ") || "Staff"}</AppText>
            {me.profile.employeeId ? <AppText variant="small">ID: {me.profile.employeeId}</AppText> : null}
          </View>
        </Card>
      ) : (
        <Card>
          <AppText variant="muted">
            {error ?? "No staff record is linked to your account. Ask the office to check your email."}
          </AppText>
        </Card>
      )}

      <Button title="Track the school bus" variant="outline" onPress={() => router.push("/track")} />
      <AppText variant="muted">More staff self-service (leave, attendance, payslips) is coming soon.</AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  profile: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.primaryText, fontSize: 20, fontWeight: fontWeight.bold },
});

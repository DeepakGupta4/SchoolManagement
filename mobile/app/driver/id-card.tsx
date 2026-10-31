import { useCallback, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen, ScreenHeader, AppText, Card, Loading } from "@/components";
import { getStaffMe, type StaffMe } from "@/api/portal";
import { getMySchool, type School } from "@/api/schools";
import { useAuth } from "@/store/auth";
import { ApiError } from "@/api/client";
import { colors, radius, spacing, fontSize, fontWeight } from "@/theme";

/** Up to two initials from a display name, for the avatar fallback. */
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "?";
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  const shown = value && value.trim() ? value : "—";
  return (
    <View style={styles.infoRow}>
      <AppText variant="label" style={styles.infoLabel}>
        {label}
      </AppText>
      <AppText style={styles.infoValue}>{shown}</AppText>
    </View>
  );
}

/** The driver's staff ID card (read-only), built from their own staff record. */
export default function DriverIdCard() {
  const user = useAuth((s) => s.user);
  const [me, setMe] = useState<StaffMe | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErrorMsg(null);
    try {
      const [staff, sch] = await Promise.all([getStaffMe(), getMySchool().catch(() => null)]);
      setMe(staff);
      setSchool(sch);
      if (!staff) setErrorMsg("No staff profile is linked to your account.");
    } catch (e) {
      setMe(null);
      setErrorMsg(e instanceof ApiError ? e.message : "Could not load your ID card.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading && !me) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading your ID card…" />
      </Screen>
    );
  }

  if (errorMsg || !me) {
    return (
      <Screen>
        <ScreenHeader title="My ID Card" back />
        <Card style={styles.emptyCard}>
          <Ionicons name="card-outline" size={28} color={colors.subtle} />
          <AppText variant="muted" style={styles.emptyText}>
            {errorMsg ?? "No staff profile is linked to your account."}
          </AppText>
        </Card>
      </Screen>
    );
  }

  const name = me.profile.name || user?.name || "Staff";
  const role = [me.profile.role || "Staff", me.profile.dept].filter(Boolean).join(" · ");
  const brand = school?.name || "SchoolDeck";
  const avatar = me.profile.avatar || user?.avatar || "";

  return (
    <Screen>
      <ScreenHeader title="My ID Card" back />

      <Card style={styles.card}>
        <View style={styles.strip}>
          <View style={styles.brandRow}>
            <Ionicons name="school" size={18} color={colors.onPrimary} />
            <AppText style={styles.brandText} numberOfLines={1}>
              {brand}
            </AppText>
          </View>
          <View style={styles.badge}>
            <AppText style={styles.badgeText}>STAFF ID</AppText>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.identity}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} resizeMode="cover" />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <AppText style={styles.avatarInitials}>{initialsOf(name)}</AppText>
              </View>
            )}
            <AppText variant="heading" style={styles.name} numberOfLines={2}>
              {name}
            </AppText>
            <AppText variant="muted">{role}</AppText>
          </View>

          <View style={styles.divider} />

          <View style={styles.rows}>
            <InfoRow label="Employee ID" value={me.profile.employeeId} />
            <InfoRow label="Department" value={me.profile.dept} />
            <InfoRow label="Role" value={me.profile.role} />
            <InfoRow label="Email" value={user?.email} />
            <InfoRow label="Status" value={me.profile.status} />
          </View>
        </View>
      </Card>

      <AppText variant="small" style={styles.note}>
        View only — contact the office to update your details.
      </AppText>
    </Screen>
  );
}

const AVATAR = 88;

const styles = StyleSheet.create({
  card: { padding: 0, overflow: "hidden" },
  strip: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  brandRow: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  brandText: { flex: 1, color: colors.onPrimary, fontSize: fontSize.md, fontWeight: fontWeight.bold },
  badge: { backgroundColor: colors.white, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  badgeText: { color: colors.primary, fontSize: fontSize.xs, fontWeight: fontWeight.bold, letterSpacing: 0.5 },
  body: { padding: spacing.lg, gap: spacing.lg },
  identity: { alignItems: "center", gap: spacing.xs, marginTop: spacing.sm },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: AVATAR / 2,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  avatarFallback: { alignItems: "center", justifyContent: "center", backgroundColor: colors.primarySoft },
  avatarInitials: { color: colors.primaryText, fontSize: fontSize.xxl, fontWeight: fontWeight.bold },
  name: { fontSize: fontSize.xl, textAlign: "center", marginTop: spacing.sm },
  divider: { height: 1, backgroundColor: colors.border },
  rows: { gap: spacing.md },
  infoRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  infoLabel: { width: 96 },
  infoValue: { flex: 1, fontSize: fontSize.sm, color: colors.text, fontWeight: fontWeight.medium },
  note: { textAlign: "center" },
  emptyCard: { alignItems: "center", gap: spacing.sm },
  emptyText: { textAlign: "center" },
});

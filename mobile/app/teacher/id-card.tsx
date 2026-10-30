import { useCallback, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen, AppText, Card, Loading } from "@/components";
import { getMyTeacher, teacherName, type Teacher } from "@/api/teacher";
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

/** One labelled detail line; shows an em dash when the value is blank. */
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

export default function IdCard() {
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Read-only: fetch the signed-in teacher's own record; refresh on focus.
  const load = useCallback(async () => {
    setErrorMsg(null);
    try {
      setTeacher(await getMyTeacher());
    } catch (e) {
      setTeacher(null);
      if (e instanceof ApiError && e.status === 404) {
        setErrorMsg("No teacher profile is linked to your account.");
      } else {
        setErrorMsg(e instanceof ApiError ? e.message : "Could not load your ID card.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Full-screen loader only on the first load (no flash when refocusing).
  if (loading && !teacher) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading your ID card…" />
      </Screen>
    );
  }

  if (errorMsg || !teacher) {
    return (
      <Screen>
        <AppText variant="title">My ID Card</AppText>
        <Card style={styles.emptyCard}>
          <Ionicons name="card-outline" size={28} color={colors.subtle} />
          <AppText variant="muted" style={styles.emptyText}>
            {errorMsg ?? "No teacher profile is linked to your account."}
          </AppText>
        </Card>
      </Screen>
    );
  }

  const name = teacherName(teacher) || "Teacher";
  const role = teacher.department ? `Teacher · ${teacher.department}` : "Teacher";
  const subjects = (teacher.subjects ?? []).filter(Boolean).join(", ");
  const classes = (teacher.classes ?? []).filter(Boolean).join(", ");
  const classTeacherOf = [teacher.classTeacherOf, teacher.classTeacherSection]
    .filter(Boolean)
    .join(" · ");

  return (
    <Screen>
      <AppText variant="title">My ID Card</AppText>

      <Card style={styles.card}>
        {/* Branded header strip. */}
        <View style={styles.strip}>
          <View style={styles.brand}>
            <Ionicons name="school" size={18} color={colors.onPrimary} />
            <AppText style={styles.brandText}>SchoolDeck</AppText>
          </View>
          <View style={styles.badge}>
            <AppText style={styles.badgeText}>STAFF ID</AppText>
          </View>
        </View>

        <View style={styles.body}>
          {/* Identity: avatar, name, role. */}
          <View style={styles.identity}>
            {teacher.avatar ? (
              <Image source={{ uri: teacher.avatar }} style={styles.avatar} resizeMode="cover" />
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

          {/* Details — never salary. */}
          <View style={styles.rows}>
            <InfoRow label="Employee ID" value={teacher.employeeId} />
            <InfoRow label="Email" value={teacher.email} />
            <InfoRow label="Phone" value={teacher.phone} />
            <InfoRow label="Subjects" value={subjects} />
            <InfoRow label="Classes" value={classes} />
            {teacher.isClassTeacher ? (
              <InfoRow label="Class teacher" value={classTeacherOf} />
            ) : null}
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
  // Zero padding + clip so the header strip fills the rounded top edge.
  card: { padding: 0, overflow: "hidden" },
  strip: {
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  brandText: { color: colors.onPrimary, fontSize: fontSize.md, fontWeight: fontWeight.bold },
  badge: {
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.5,
  },
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

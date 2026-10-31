import { useCallback, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AppText, Card, DashboardScreen, HeroAction, NoticeCard, Avatar } from "@/components";
import { getChildren, type ChildSummary } from "@/api/portal";
import { ApiError } from "@/api/client";
import { useAuth } from "@/store/auth";
import { colors, spacing, fontWeight, fontSize } from "@/theme";

/** Parent home: their children, each tappable into a detailed report. */
export default function ParentHome() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
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

  const meta = children.length ? `${children.length} ${children.length === 1 ? "child" : "children"}` : undefined;
  const headerActions = (
    <View style={{ flexDirection: "row", gap: spacing.sm }}>
      <HeroAction
        icon="sparkles-outline"
        onPress={() => router.push("/parent/assistant")}
        accessibilityLabel="AI assistant"
      />
      <HeroAction icon="bus-outline" onPress={() => router.push("/track")} accessibilityLabel="Track the school bus" />
    </View>
  );

  return (
    <DashboardScreen name={user?.name || "Parent"} meta={meta} rightSlot={headerActions} loading={loading && children.length === 0}>
      <AppText variant="heading">My children</AppText>

      {/* Keep cached children visible even if a background refetch fails. */}
      {children.length === 0 ? (
        <NoticeCard
          error={error}
          emptyText="No children are linked to your account. Ask the office to add your email to your child's record."
          onRetry={load}
        />
      ) : (
        children.map((c) => (
          <ChildCard
            key={c.id}
            child={c}
            onPress={() => router.push({ pathname: "/parent/child", params: { id: c.id } })}
          />
        ))
      )}
    </DashboardScreen>
  );
}

function ChildCard({ child: c, onPress }: { child: ChildSummary; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Open ${c.name}'s report`}>
      <Card style={styles.block}>
        <View style={styles.top}>
          <Avatar name={c.name} uri={c.avatar} size={46} />
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
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </View>
        <View style={styles.stats}>
          <Mini label="Attendance" value={`${c.attendancePercent}%`} tone={colors.successText} />
          <Mini label="Performance" value={`${c.performancePercent}%`} tone={colors.primaryText} />
          <Mini
            label="Fee due"
            value={c.feeDue > 0 ? `₹${c.feeDue}` : "₹0"}
            tone={c.feeDue > 0 ? colors.dangerText : colors.successText}
          />
        </View>
      </Card>
    </Pressable>
  );
}

function Mini({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <View style={styles.flex}>
      <AppText style={[styles.miniValue, { color: tone }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </AppText>
      <AppText style={styles.miniLabel} numberOfLines={1}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  block: { gap: spacing.md },

  top: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  name: { fontSize: fontSize.md },

  stats: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-start" },
  miniValue: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  miniLabel: { fontSize: fontSize.xs, color: colors.muted },
});

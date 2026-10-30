import { useCallback, useMemo, useState, type ReactNode } from "react";
import { Image, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { setStatusBarStyle } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "./AppText";
import { Card } from "./Card";
import { Button } from "./Button";
import { Loading } from "./Loading";
import { colors, radius, spacing, fontWeight, fontSize, gradients, shadow } from "@/theme";

/**
 * Role dashboard shell: a full-bleed gradient hero (time-aware greeting + name +
 * today's date) that extends behind the status bar, over a scrolling body.
 * Colours the status bar light on focus and restores it on blur.
 */
export function DashboardScreen({
  name,
  avatarUri,
  meta,
  rightSlot,
  loading,
  children,
}: {
  name: string;
  avatarUri?: string;
  meta?: string;
  rightSlot?: ReactNode;
  loading?: boolean;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const [imgFailed, setImgFailed] = useState(false);
  const initial = (name.trim()[0] || "?").toUpperCase();
  const showImg = !!avatarUri && !imgFailed;

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle("light");
      return () => setStatusBarStyle("dark");
    }, [])
  );

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  }, []);
  const date = useMemo(
    () => new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }),
    []
  );

  return (
    <View style={styles.root}>
      <View style={styles.heroWrap}>
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + spacing.md }]}
        >
          <View style={styles.heroTop}>
            <View style={styles.heroLeft}>
              {showImg ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImg} onError={() => setImgFailed(true)} />
              ) : (
                <View style={styles.avatar}>
                  <AppText style={styles.avatarText}>{initial}</AppText>
                </View>
              )}
              <View style={styles.flex}>
                <AppText style={styles.greeting}>{greeting},</AppText>
                <AppText style={styles.name} numberOfLines={1}>
                  {name}
                </AppText>
                {meta ? (
                  <AppText style={styles.meta} numberOfLines={1}>
                    {meta}
                  </AppText>
                ) : null}
              </View>
            </View>
            {rightSlot}
          </View>

          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={14} color={colors.onPrimary} />
            <AppText style={styles.dateText}>{date}</AppText>
          </View>
        </LinearGradient>
      </View>

      {loading ? (
        <View style={styles.bodyCenter}>
          <Loading label="Loading…" />
        </View>
      ) : (
        <ScrollView style={styles.flex} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      )}
    </View>
  );
}

/** Translucent circular action in the hero's top-right (e.g. alerts bell, track bus). */
export function HeroAction({
  icon,
  onPress,
  badge,
  accessibilityLabel,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  badge?: string | number;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={styles.heroBtn}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicons name={icon} size={22} color={colors.onPrimary} />
      {badge ? (
        <View style={styles.badge}>
          <AppText style={styles.badgeText}>{badge}</AppText>
        </View>
      ) : null}
    </Pressable>
  );
}

/** Consistent empty / error state for a dashboard body (danger + retry on error). */
export function NoticeCard({
  error,
  emptyText,
  onRetry,
}: {
  error?: string | null;
  emptyText: string;
  onRetry?: () => void;
}) {
  return (
    <Card style={styles.notice}>
      {error ? (
        <AppText style={styles.noticeError}>{error}</AppText>
      ) : (
        <AppText variant="muted">{emptyText}</AppText>
      )}
      {error && onRetry ? <Button title="Try again" variant="outline" onPress={onRetry} /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  body: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  bodyCenter: { flex: 1, alignItems: "center", justifyContent: "center" },

  heroWrap: {
    backgroundColor: colors.primaryDark,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    ...shadow.lg,
  },
  hero: {
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    overflow: "hidden",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  heroTop: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  heroLeft: { flex: 1, flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.onPrimaryGlass,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImg: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: colors.onPrimaryGlass },
  avatarText: { color: colors.onPrimary, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  greeting: { color: colors.onPrimary, fontSize: fontSize.sm },
  name: { color: colors.onPrimary, fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  meta: { color: colors.onPrimary, fontSize: fontSize.sm, opacity: 0.9 },

  heroBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.onPrimaryGlass,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: 5,
    right: 5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.danger,
    borderWidth: 1.5,
    borderColor: colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: colors.onPrimary, fontSize: 10, fontWeight: fontWeight.bold },

  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: colors.onPrimaryGlass,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  dateText: { color: colors.onPrimary, fontSize: fontSize.sm, fontWeight: fontWeight.medium },

  notice: { gap: spacing.md },
  noticeError: { color: colors.dangerText },
});

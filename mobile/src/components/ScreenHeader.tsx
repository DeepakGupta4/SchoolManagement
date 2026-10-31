import { useCallback, type ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { setStatusBarStyle } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "./AppText";
import { colors, radius, spacing } from "@/theme";

/**
 * Consistent inner-screen header: optional back button, title (+ subtitle) and an
 * optional right action. Also keeps the status bar dark on these light screens
 * (the dashboards flip it to light).
 */
export function ScreenHeader({
  title,
  subtitle,
  back,
  right,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
}) {
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle("dark");
    }, [])
  );

  return (
    <View style={styles.wrap}>
      {back ? (
        <Pressable
          onPress={() => router.back()}
          style={styles.back}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
      ) : null}
      <View style={styles.flex}>
        <AppText variant="title">{title}</AppText>
        {subtitle ? <AppText variant="muted">{subtitle}</AppText> : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  flex: { flex: 1 },
  back: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
});

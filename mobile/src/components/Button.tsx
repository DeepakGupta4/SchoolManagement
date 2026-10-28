import { ActivityIndicator, Pressable, StyleSheet, type ViewStyle } from "react-native";
import { AppText } from "./AppText";
import { colors, radius, spacing, fontWeight } from "@/theme";

type Variant = "primary" | "outline" | "ghost";

export function Button({
  title,
  onPress,
  variant = "primary",
  loading,
  disabled,
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const off = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [styles.base, styles[variant], off && styles.off, pressed && styles.pressed, style]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? colors.onPrimary : colors.primary} />
      ) : (
        <AppText style={[styles.text, variant === "primary" ? styles.textPrimary : styles.textOther]}>
          {title}
        </AppText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  primary: { backgroundColor: colors.primary },
  outline: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  ghost: { backgroundColor: "transparent" },
  off: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
  text: { fontWeight: fontWeight.semibold },
  textPrimary: { color: colors.onPrimary },
  textOther: { color: colors.primary },
});

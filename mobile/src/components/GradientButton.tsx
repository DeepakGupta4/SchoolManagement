import { ActivityIndicator, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "./AppText";
import { colors, radius, spacing, fontWeight, fontSize, gradients } from "@/theme";

/** Primary call-to-action: brand gradient + soft glow. Optional trailing icon. */
export function GradientButton({
  title,
  onPress,
  loading,
  disabled,
  icon,
  style,
}: {
  title: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: StyleProp<ViewStyle>;
}) {
  const off = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      style={({ pressed }) => [styles.wrap, off ? styles.off : pressed && styles.pressed, style]}
    >
      <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.grad}>
        {loading ? (
          <ActivityIndicator color={colors.onPrimary} />
        ) : (
          <View style={styles.row}>
            <AppText style={styles.text}>{title}</AppText>
            {icon ? <Ionicons name={icon} size={18} color={colors.onPrimary} /> : null}
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.md,
    // Opaque base (hidden under the gradient) so Android casts the elevation glow.
    backgroundColor: colors.primaryDark,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  pressed: { opacity: 0.9 },
  off: { opacity: 0.55 },
  grad: {
    height: 52,
    borderRadius: radius.md,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  text: { color: colors.onPrimary, fontWeight: fontWeight.bold, fontSize: fontSize.md },
});

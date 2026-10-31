import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "./AppText";
import { colors, radius, spacing, fontSize, fontWeight } from "@/theme";

/** Small pill "+ <label>" action — used in screen headers (top-right) and empty states. */
export function AddButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.pill} accessibilityRole="button" accessibilityLabel={label}>
      <Ionicons name="add" size={18} color={colors.onPrimary} />
      <AppText style={styles.text}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  text: { color: colors.onPrimary, fontWeight: fontWeight.semibold, fontSize: fontSize.sm },
});

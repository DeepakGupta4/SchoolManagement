import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "./AppText";
import { Card } from "./Card";
import { colors, spacing, fontSize, fontWeight } from "@/theme";

type Tone = "primary" | "success" | "warning" | "danger" | "info";

const toneColor: Record<Tone, string> = {
  primary: colors.primary,
  success: colors.success,
  warning: colors.warning,
  danger: colors.danger,
  info: colors.info,
};

export function StatCard({
  label,
  value,
  icon,
  tone = "primary",
  onPress,
}: {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  tone?: Tone;
  /** When set, the whole card is tappable (shows a chevron affordance). */
  onPress?: () => void;
}) {
  const content = (
    <>
      <View style={[styles.iconWrap, { backgroundColor: toneColor[tone] + "22" }]}>
        <Ionicons name={icon} size={18} color={toneColor[tone]} />
      </View>
      <AppText style={styles.value}>{value}</AppText>
      <AppText variant="muted">{label}</AppText>
      {onPress ? (
        <Ionicons name="chevron-forward" size={14} color={colors.subtle} style={styles.chev} />
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value}`}
      >
        <Card style={styles.card}>{content}</Card>
      </Pressable>
    );
  }

  return <Card style={[styles.wrap, styles.card]}>{content}</Card>;
}

const styles = StyleSheet.create({
  wrap: { flex: 1, minWidth: 140 },
  pressed: { opacity: 0.7 },
  card: { gap: spacing.xs },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  value: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  chev: { position: "absolute", top: spacing.md, right: spacing.md },
});

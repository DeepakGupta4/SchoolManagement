import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
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
}: {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  tone?: Tone;
}) {
  return (
    <Card style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: toneColor[tone] + "22" }]}>
        <Ionicons name={icon} size={18} color={toneColor[tone]} />
      </View>
      <AppText style={styles.value}>{value}</AppText>
      <AppText variant="muted">{label}</AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 140, gap: spacing.xs },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xs,
  },
  value: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
});

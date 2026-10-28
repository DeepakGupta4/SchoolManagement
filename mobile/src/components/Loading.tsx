import { ActivityIndicator, StyleSheet, View } from "react-native";
import { AppText } from "./AppText";
import { colors, spacing } from "@/theme";

export function Loading({ label }: { label?: string }) {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator color={colors.primary} />
      {label ? <AppText variant="muted">{label}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.sm, padding: spacing.xl },
});

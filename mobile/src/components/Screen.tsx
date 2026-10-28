import { type ReactNode } from "react";
import { ScrollView, StyleSheet, View, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "@/theme";

/** Safe-area page wrapper with consistent padding. `scroll` on by default. */
export function Screen({
  children,
  scroll = true,
  style,
}: {
  children: ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {scroll ? (
        <ScrollView contentContainerStyle={[styles.content, style]} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, style]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, gap: spacing.lg, flexGrow: 1 },
});

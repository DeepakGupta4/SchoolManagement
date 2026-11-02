import { useState, type ReactNode } from "react";
import { RefreshControl, ScrollView, StyleSheet, View, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "@/theme";

/** Safe-area page wrapper with consistent padding. `scroll` on by default.
 *  Pass `onRefresh` (async) to add pull-to-refresh — the spinner is managed here. */
export function Screen({
  children,
  scroll = true,
  style,
  onRefresh,
}: {
  children: ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  onRefresh?: () => void | Promise<void>;
}) {
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = onRefresh
    ? async () => {
        setRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
        }
      }
    : undefined;

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.content, style]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            handleRefresh ? (
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.primary} colors={[colors.primary]} />
            ) : undefined
          }
        >
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

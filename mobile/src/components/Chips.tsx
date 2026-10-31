import { Pressable, StyleSheet, View } from "react-native";
import { AppText } from "./AppText";
import { colors, radius, spacing, fontWeight, shadow } from "@/theme";

export interface ChipOption {
  label: string;
  value: string;
}

/**
 * A single-select chip row — the app's lightweight <Select> / tab bar.
 *
 * Lays out as a WRAPPING flex row (not a horizontal ScrollView): inside a
 * `scroll={false}` Screen a horizontal ScrollView has no intrinsic height and
 * flexbox stretches it to fill the column — the giant vertical "pills" bug.
 * A wrapping View hugs its content height, so it can never stretch.
 */
export function Chips({
  options,
  value,
  onChange,
}: {
  options: ChipOption[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.row}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[styles.chip, on && styles.on]}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
          >
            <AppText style={[styles.text, on && styles.textOn]} numberOfLines={1}>
              {o.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  on: { backgroundColor: colors.primary, borderColor: colors.primary, ...shadow.card },
  text: { color: colors.muted, fontWeight: fontWeight.medium, fontSize: 13 },
  textOn: { color: colors.onPrimary, fontWeight: fontWeight.semibold },
});

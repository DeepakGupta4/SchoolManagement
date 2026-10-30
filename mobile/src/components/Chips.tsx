import { ScrollView, Pressable, StyleSheet } from "react-native";
import { AppText } from "./AppText";
import { colors, radius, spacing, fontWeight } from "@/theme";

export interface ChipOption {
  label: string;
  value: string;
}

/** A horizontal single-select chip row — the app's lightweight <Select>. */
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
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable key={o.value} onPress={() => onChange(o.value)} style={[styles.chip, on && styles.on]}>
            <AppText style={[styles.text, on && styles.textOn]}>{o.label}</AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingVertical: 2 },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  on: { backgroundColor: colors.primary, borderColor: colors.primary },
  text: { color: colors.muted, fontWeight: fontWeight.medium, fontSize: 13 },
  textOn: { color: colors.onPrimary },
});

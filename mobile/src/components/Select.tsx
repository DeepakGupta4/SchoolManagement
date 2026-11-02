import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "./AppText";
import type { ChipOption } from "./Chips";
import { colors, radius, spacing, fontSize, fontWeight, shadow } from "@/theme";

/**
 * A dropdown selector — the boxed single-select the filters use (cleaner than a
 * long pill row when there are many options, e.g. classes). Tap to open a sheet
 * of options; the chosen one shows in the box.
 */
export function Select({
  value,
  options,
  onChange,
  label,
  placeholder = "Select…",
  disabled,
}: {
  value: string;
  options: ChipOption[];
  onChange: (v: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);

  return (
    <View style={styles.wrap}>
      {label ? (
        <AppText variant="label" style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <Pressable
        style={[styles.box, disabled && styles.boxOff]}
        onPress={() => !disabled && options.length > 0 && setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={label ? `${label}: ${current?.label ?? placeholder}` : current?.label ?? placeholder}
      >
        <AppText style={current ? styles.value : styles.placeholder} numberOfLines={1}>
          {current?.label ?? placeholder}
        </AppText>
        <Ionicons name="chevron-down" size={18} color={colors.muted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            {label ? (
              <AppText variant="label" style={styles.sheetTitle}>
                {label}
              </AppText>
            ) : null}
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {options.map((o) => {
                const on = o.value === value;
                return (
                  <Pressable
                    key={o.value}
                    style={styles.opt}
                    onPress={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                  >
                    <AppText style={[styles.optText, on && styles.optOn]} numberOfLines={1}>
                      {o.label}
                    </AppText>
                    {on ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  label: {},
  box: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  boxOff: { opacity: 0.5 },
  value: { flex: 1, color: colors.text, fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  placeholder: { flex: 1, color: colors.subtle, fontSize: fontSize.sm },

  overlay: { flex: 1, backgroundColor: colors.scrim, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  sheet: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "70%",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.sm,
    ...shadow.lg,
  },
  sheetTitle: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xs },
  list: { flexGrow: 0 },
  opt: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  optText: { flex: 1, color: colors.text, fontSize: fontSize.md },
  optOn: { color: colors.primaryText, fontWeight: fontWeight.semibold },
});

import { useState, type ReactNode } from "react";
import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "./AppText";
import { colors, radius, spacing, fontSize } from "@/theme";

/**
 * Labelled input. Pass `leftIcon`/`rightSlot` for an icon field (e.g. login);
 * without them it renders exactly like a plain input (used across the app).
 */
export function TextField({
  label,
  error,
  leftIcon,
  rightSlot,
  style,
  ...rest
}: TextInputProps & {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightSlot?: ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  const boxed = !!leftIcon || !!rightSlot;

  const input = (
    <TextInput
      placeholderTextColor={colors.subtle}
      {...rest}
      onFocus={(e) => {
        setFocused(true);
        rest.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        rest.onBlur?.(e);
      }}
      style={[
        boxed ? styles.inputBoxed : styles.input,
        !boxed && focused && styles.focused,
        !boxed && !!error && styles.errored,
        style,
      ]}
    />
  );

  return (
    <View style={styles.wrap}>
      {label ? <AppText variant="label">{label}</AppText> : null}
      {boxed ? (
        <View style={[styles.box, focused && styles.focused, !!error && styles.errored]}>
          {leftIcon ? <Ionicons name={leftIcon} size={18} color={focused ? colors.primary : colors.subtle} /> : null}
          {input}
          {rightSlot}
        </View>
      ) : (
        input
      )}
      {error ? <AppText style={styles.error}>{error}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  // Plain field — unchanged look, used everywhere else in the app.
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  focused: { borderColor: colors.primary },
  errored: { borderColor: colors.danger },
  error: { color: colors.dangerText, fontSize: fontSize.xs },
  // Icon field — border lives on the box so the icon sits inside it.
  box: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
  },
  inputBoxed: { flex: 1, minHeight: 50, fontSize: fontSize.md, color: colors.text, paddingVertical: 0 },
});

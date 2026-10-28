import { useState } from "react";
import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { AppText } from "./AppText";
import { colors, radius, spacing, fontSize } from "@/theme";

export function TextField({
  label,
  error,
  style,
  ...rest
}: TextInputProps & { label?: string; error?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      {label ? <AppText variant="label">{label}</AppText> : null}
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
        style={[styles.input, focused && styles.focused, !!error && styles.errored, style]}
      />
      {error ? <AppText style={styles.error}>{error}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
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
});

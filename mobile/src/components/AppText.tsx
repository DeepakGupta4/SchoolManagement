import { Text, StyleSheet, type TextProps } from "react-native";
import { colors, fontSize, fontWeight } from "@/theme";

type Variant = "title" | "heading" | "body" | "muted" | "label" | "small";

/** All typography goes through here so sizes/colours stay consistent. */
export function AppText({ variant = "body", style, ...rest }: TextProps & { variant?: Variant }) {
  return <Text {...rest} style={[styles[variant], style]} />;
}

const styles = StyleSheet.create({
  title: { fontSize: fontSize.xxl, fontWeight: fontWeight.bold, color: colors.text },
  heading: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.text },
  body: { fontSize: fontSize.md, color: colors.text },
  muted: { fontSize: fontSize.sm, color: colors.muted },
  label: { fontSize: fontSize.sm, fontWeight: fontWeight.medium, color: colors.muted },
  small: { fontSize: fontSize.xs, color: colors.subtle },
});

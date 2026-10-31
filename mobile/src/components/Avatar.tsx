import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { AppText } from "./AppText";
import { colors, fontWeight } from "@/theme";

/** Round avatar — the person's photo if it loads, else their initial. */
export function Avatar({
  name,
  uri,
  size = 48,
  tone = "brand",
}: {
  name?: string;
  uri?: string;
  size?: number;
  tone?: "brand" | "glass"; // "glass" = on a gradient hero, "brand" = on a light card
}) {
  const [failed, setFailed] = useState(false);
  const dim = { width: size, height: size, borderRadius: size / 2 };

  if (uri && !failed) {
    const ring = tone === "glass" ? { borderWidth: 2, borderColor: colors.onPrimaryGlass } : undefined;
    return <Image source={{ uri }} style={[dim, ring]} onError={() => setFailed(true)} />;
  }

  const bg = tone === "glass" ? colors.onPrimaryGlass : colors.primarySoft;
  const fg = tone === "glass" ? colors.onPrimary : colors.primaryText;
  return (
    <View style={[dim, styles.center, { backgroundColor: bg }]}>
      <AppText style={{ color: fg, fontSize: Math.round(size * 0.4), fontWeight: fontWeight.bold }}>
        {(name?.trim()[0] || "?").toUpperCase()}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: "center", justifyContent: "center" },
});

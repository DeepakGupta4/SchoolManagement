import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuth } from "@/store/auth";
import { colors } from "@/theme";

/** Root layout: restore the session once, then let routing take over. */
export default function RootLayout() {
  const hydrate = useAuth((s) => s.hydrate);
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
    </SafeAreaProvider>
  );
}

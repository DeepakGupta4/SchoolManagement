import { type ColorValue } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme";

export default function TeacherLayout() {
  const icon =
    (name: keyof typeof Ionicons.glyphMap) =>
    ({ color, size }: { color: ColorValue; size: number }) =>
      <Ionicons name={name} color={color} size={size} />;

  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subtle,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: icon("home-outline") }} />
      <Tabs.Screen name="students" options={{ title: "My Class", tabBarIcon: icon("people-outline") }} />
      <Tabs.Screen name="homework" options={{ title: "Homework", tabBarIcon: icon("document-text-outline") }} />
      <Tabs.Screen name="more" options={{ title: "More", tabBarIcon: icon("grid-outline") }} />

      {/* Alerts now lives in the Home header bell (+ the More menu), not a tab. */}
      <Tabs.Screen name="notifications" options={{ href: null }} />

      {/* Routable from Home / More, but not their own tabs. */}
      <Tabs.Screen name="timetable" options={{ href: null }} />
      <Tabs.Screen name="student-form" options={{ href: null }} />
      <Tabs.Screen name="attendance" options={{ href: null }} />
      <Tabs.Screen name="marks" options={{ href: null }} />
      <Tabs.Screen name="report-cards" options={{ href: null }} />
      <Tabs.Screen name="admit-cards" options={{ href: null }} />
      <Tabs.Screen name="teaching" options={{ href: null }} />
      <Tabs.Screen name="updates" options={{ href: null }} />
      <Tabs.Screen name="substitutions" options={{ href: null }} />
      <Tabs.Screen name="messages" options={{ href: null }} />
      <Tabs.Screen name="leave" options={{ href: null }} />
      <Tabs.Screen name="id-card" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
      <Tabs.Screen name="assistant" options={{ href: null }} />
    </Tabs>
  );
}

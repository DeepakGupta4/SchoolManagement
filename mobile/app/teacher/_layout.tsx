import { useEffect } from "react";
import { type ColorValue } from "react-native";
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useNotifications } from "@/store/notifications";
import { colors } from "@/theme";

export default function TeacherLayout() {
  const unread = useNotifications((s) => s.unread);
  const refresh = useNotifications((s) => s.refresh);

  // Prime the Alerts badge once the teacher is in.
  useEffect(() => {
    refresh();
  }, [refresh]);

  const icon =
    (name: keyof typeof Ionicons.glyphMap) =>
    ({ color, size }: { color: ColorValue; size: number }) =>
      <Ionicons name={name} color={color} size={size} />;

  return (
    <Tabs
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
      <Tabs.Screen
        name="notifications"
        options={{ title: "Alerts", tabBarIcon: icon("notifications-outline"), tabBarBadge: unread || undefined }}
      />
      <Tabs.Screen name="more" options={{ title: "More", tabBarIcon: icon("grid-outline") }} />

      {/* Routable from Home / More, but not their own tabs. */}
      <Tabs.Screen name="timetable" options={{ href: null }} />
      <Tabs.Screen name="student-form" options={{ href: null }} />
      <Tabs.Screen name="attendance" options={{ href: null }} />
      <Tabs.Screen name="marks" options={{ href: null }} />
      <Tabs.Screen name="report-cards" options={{ href: null }} />
      <Tabs.Screen name="teaching" options={{ href: null }} />
      <Tabs.Screen name="updates" options={{ href: null }} />
      <Tabs.Screen name="substitutions" options={{ href: null }} />
      <Tabs.Screen name="messages" options={{ href: null }} />
      <Tabs.Screen name="leave" options={{ href: null }} />
      <Tabs.Screen name="id-card" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}

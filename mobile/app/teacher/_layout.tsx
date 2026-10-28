import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme";

export default function TeacherLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.subtle,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Home", tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="timetable"
        options={{ title: "Timetable", tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="more"
        options={{ title: "More", tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" color={color} size={size} /> }}
      />
    </Tabs>
  );
}

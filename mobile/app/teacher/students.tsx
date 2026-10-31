import { useCallback, useState } from "react";
import { Linking, Pressable, StyleSheet, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen, ScreenHeader, AppText, Card, Button, TextField, Loading, PagedList } from "@/components";
import { getMyTeacher } from "@/api/teacher";
import { listStudents, studentFullName, type Student } from "@/api/students";
import { colors, radius, spacing, fontWeight, fontSize } from "@/theme";

export default function Students() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isClassTeacher, setIsClassTeacher] = useState(false);
  const [cls, setCls] = useState({ className: "", section: "" });
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const t = await getMyTeacher();
      const isCt = !!t.isClassTeacher && !!t.classTeacherOf;
      setIsClassTeacher(isCt);
      setCls({ className: t.classTeacherOf ?? "", section: t.classTeacherSection ?? "" });
      if (isCt) {
        const list = await listStudents({ className: t.classTeacherOf, section: t.classTeacherSection });
        setStudents([...list].sort((a, b) => (Number(a.rollNo) || 0) - (Number(b.rollNo) || 0)));
      }
    } catch {
      /* fail closed */
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload each time the tab regains focus (e.g. after adding/editing a student).
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const q = search.trim().toLowerCase();
  const filtered = students.filter(
    (s) =>
      !q ||
      studentFullName(s).toLowerCase().includes(q) ||
      (s.admissionNo || "").toLowerCase().includes(q) ||
      String(s.rollNo).includes(q)
  );

  if (loading && students.length === 0) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading your class…" />
      </Screen>
    );
  }

  if (!isClassTeacher) {
    return (
      <Screen>
        <ScreenHeader title="My Class" />
        <Card>
          <AppText variant="muted">
            You&apos;re not a class teacher, so there&apos;s no class roster to manage here.
          </AppText>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen scroll={false} style={{ gap: spacing.md }}>
      <ScreenHeader
        title="My Class"
        subtitle={`${cls.className}${cls.section ? ` · ${cls.section}` : ""} · ${students.length} students`}
      />

      <PagedList
        data={filtered}
        keyExtractor={(s) => s.id ?? s.admissionNo}
        pageSize={20}
        onRefresh={load}
        refreshing={loading}
        contentContainerStyle={{ gap: spacing.sm }}
        emptyText={q ? "No students match your search." : "No students yet. Tap “Add student”."}
        ListHeaderComponent={
          <TextField
            placeholder="Search name / admission / roll…"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            leftIcon="search-outline"
          />
        }
        renderItem={({ item }) => {
          const phone = item.guardian?.phone;
          return (
            <Pressable
              onPress={() => router.push({ pathname: "/teacher/student-form", params: { id: item.id } })}
              accessibilityRole="button"
              accessibilityLabel={`Open ${studentFullName(item)}`}
            >
              <Card style={styles.row}>
                <View style={styles.avatar}>
                  <AppText style={styles.avatarText}>{(studentFullName(item)[0] || "?").toUpperCase()}</AppText>
                </View>
                <View style={styles.flex}>
                  <AppText variant="heading" style={styles.name} numberOfLines={1}>
                    {studentFullName(item)}
                  </AppText>
                  <AppText variant="muted" numberOfLines={1}>
                    Roll {String(item.rollNo)} · {item.admissionNo}
                  </AppText>
                </View>
                {phone ? (
                  <Pressable
                    onPress={() => Linking.openURL(`tel:${phone}`)}
                    style={styles.call}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Call guardian"
                  >
                    <Ionicons name="call-outline" size={18} color={colors.primary} />
                  </Pressable>
                ) : null}
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
              </Card>
            </Pressable>
          );
        }}
      />

      <Button title="+ Add student" onPress={() => router.push("/teacher/student-form")} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  sep: { height: spacing.sm },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.primaryText, fontSize: fontSize.md, fontWeight: fontWeight.bold },
  name: { fontSize: fontSize.md },
  call: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: { alignItems: "center", gap: spacing.sm, paddingVertical: spacing.xl },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
});

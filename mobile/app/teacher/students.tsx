import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Screen, ScreenHeader, AppText, Card, Button, TextField, Loading } from "@/components";
import { getMyTeacher } from "@/api/teacher";
import { listStudents, studentFullName, type Student } from "@/api/students";
import { colors, radius, spacing } from "@/theme";

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
      if (isCt) setStudents(await listStudents({ className: t.classTeacherOf, section: t.classTeacherSection }));
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

      <TextField
        placeholder="Search name / admission / roll…"
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
      />

      <FlatList
        style={{ flex: 1 }}
        data={filtered}
        keyExtractor={(s) => s.id ?? s.admissionNo}
        onRefresh={load}
        refreshing={loading}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={<AppText variant="muted">No students yet. Tap “Add student”.</AppText>}
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push({ pathname: "/teacher/student-form", params: { id: item.id } })}>
            <Card style={styles.row}>
              <View style={styles.roll}>
                <AppText variant="small" style={{ color: colors.primaryText }}>
                  #{String(item.rollNo)}
                </AppText>
              </View>
              <View style={styles.flex}>
                <AppText variant="heading" style={styles.name}>
                  {studentFullName(item)}
                </AppText>
                <AppText variant="muted">
                  {item.admissionNo}
                  {item.guardian?.phone ? ` · ${item.guardian.phone}` : ""}
                </AppText>
              </View>
            </Card>
          </Pressable>
        )}
      />

      <Button title="+ Add student" onPress={() => router.push("/teacher/student-form")} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md },
  roll: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  flex: { flex: 1 },
  name: { fontSize: 15 },
});

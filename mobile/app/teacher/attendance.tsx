import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Screen, ScreenHeader, AppText, Card, Button, Loading } from "@/components";
import { getMyTeacher } from "@/api/teacher";
import { listStudents, studentFullName, type Student } from "@/api/students";
import {
  getSavedAttendance,
  saveAttendance,
  type AttendanceStatus,
  type AttendanceMark,
} from "@/api/attendance";
import { ApiError } from "@/api/client";
import { todayIso, addDays, isSundayIso, prettyDate } from "@/lib/date";
import { colors, radius, spacing, fontWeight, fontSize } from "@/theme";

// Single source for the status pills (label + colour), reused in the legend + rows.
const STATUSES: { key: AttendanceStatus; label: string; color: string }[] = [
  { key: "present", label: "P", color: colors.success },
  { key: "absent", label: "A", color: colors.danger },
  { key: "late", label: "L", color: colors.warning },
  { key: "half-day", label: "½", color: colors.info },
  { key: "leave", label: "Lv", color: colors.subtle },
];

export default function Attendance() {
  const [loading, setLoading] = useState(true);
  const [isClassTeacher, setIsClassTeacher] = useState(false);
  const [cls, setCls] = useState({ className: "", section: "" });
  const [roster, setRoster] = useState<Student[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, AttendanceStatus>>({});
  const [date, setDate] = useState(todayIso());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Teacher + roster: reload whenever the screen regains focus.
  const loadClass = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const t = await getMyTeacher();
      const isCt = !!t.isClassTeacher && !!t.classTeacherOf && !!t.classTeacherSection;
      setIsClassTeacher(isCt);
      setCls({ className: t.classTeacherOf ?? "", section: t.classTeacherSection ?? "" });
      if (!isCt) {
        setRoster([]);
        return;
      }
      const students = await listStudents({
        className: t.classTeacherOf,
        section: t.classTeacherSection,
        status: "active",
      });
      setRoster([...students].sort((a, b) => (Number(a.rollNo) || 0) - (Number(b.rollNo) || 0)));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load your class.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadClass();
    }, [loadClass])
  );

  // Saved marks for the chosen date → prefill; default everyone Present otherwise.
  useEffect(() => {
    if (!isClassTeacher || roster.length === 0) return;
    let alive = true;
    const fallback = () =>
      Object.fromEntries(roster.map((s) => [s.id!, "present" as AttendanceStatus]));
    getSavedAttendance(cls.className, cls.section, date)
      .then((saved) => {
        if (!alive) return;
        const savedMap = new Map(saved.map((s) => [String(s.studentId), s.status]));
        setStatusMap(
          Object.fromEntries(roster.map((s) => [s.id!, savedMap.get(String(s.id)) ?? "present"]))
        );
      })
      .catch(() => alive && setStatusMap(fallback()));
    return () => {
      alive = false;
    };
  }, [date, roster, isClassTeacher, cls.className, cls.section]);

  const counts = useMemo(() => {
    const c: Record<AttendanceStatus, number> = {
      present: 0,
      absent: 0,
      late: 0,
      "half-day": 0,
      leave: 0,
    };
    for (const s of roster) c[statusMap[s.id!] ?? "present"]++;
    return c;
  }, [roster, statusMap]);

  const sunday = isSundayIso(date);
  const atToday = date >= todayIso();

  const setStatus = (id: string, status: AttendanceStatus) =>
    setStatusMap((p) => ({ ...p, [id]: status }));
  const markAllPresent = () =>
    setStatusMap(Object.fromEntries(roster.map((s) => [s.id!, "present"])));

  const onSave = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    const records: AttendanceMark[] = roster.map((s) => ({
      studentId: s.id!,
      studentName: studentFullName(s),
      roll: Number(s.rollNo) || 0,
      status: statusMap[s.id!] ?? "present",
    }));
    try {
      const res = await saveAttendance({ className: cls.className, section: cls.section, date, records });
      setMessage(`Saved ${res.saved}${res.skipped ? ` · ${res.skipped} skipped` : ""} ✓`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not save attendance.");
    } finally {
      setSaving(false);
    }
  };

  if (loading && roster.length === 0) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading your class…" />
      </Screen>
    );
  }

  if (!isClassTeacher) {
    return (
      <Screen>
        <ScreenHeader title="Attendance" back />
        <Card>
          <AppText variant="muted">
            You&apos;re not a class teacher, so there&apos;s no roll-call to take here.
          </AppText>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen scroll={false} style={{ gap: spacing.md }}>
      <ScreenHeader
        title="Attendance"
        subtitle={`${cls.className}${cls.section ? ` · ${cls.section}` : ""} · ${roster.length} students`}
        back
      />

      {/* Date stepper — can't go past today (future dates are blocked server-side). */}
      <Card style={styles.dateRow}>
        <Pressable onPress={() => setDate(addDays(date, -1))} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </Pressable>
        <AppText variant="heading" style={styles.dateText}>
          {atToday ? "Today" : prettyDate(date)}
        </AppText>
        <Pressable onPress={() => !atToday && setDate(addDays(date, 1))} hitSlop={8} disabled={atToday}>
          <Ionicons name="chevron-forward" size={22} color={atToday ? colors.border : colors.primary} />
        </Pressable>
      </Card>

      {sunday ? (
        <Card style={styles.banner}>
          <AppText style={{ color: colors.warningText }}>
            Sunday is a weekly holiday — attendance isn&apos;t taken.
          </AppText>
        </Card>
      ) : (
        <View style={styles.summaryRow}>
          <AppText variant="muted">
            {counts.present} present · {counts.absent} absent
            {counts.late ? ` · ${counts.late} late` : ""}
          </AppText>
          <Button title="All present" variant="ghost" onPress={markAllPresent} />
        </View>
      )}

      <View style={styles.legend}>
        {STATUSES.map((s) => (
          <AppText key={s.key} style={styles.legendItem}>
            <AppText style={{ color: s.color, fontWeight: fontWeight.bold }}>{s.label}</AppText>{" "}
            {s.key === "half-day" ? "half" : s.key}
          </AppText>
        ))}
      </View>

      <FlatList
        style={{ flex: 1 }}
        data={roster}
        keyExtractor={(s) => s.id ?? s.admissionNo}
        onRefresh={loadClass}
        refreshing={loading}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={<AppText variant="muted">No active students in this class.</AppText>}
        renderItem={({ item }) => {
          const current = statusMap[item.id!] ?? "present";
          return (
            <Card style={styles.row}>
              <View style={styles.rollName}>
                <AppText variant="small" style={{ color: colors.primaryText }}>
                  #{String(item.rollNo)}
                </AppText>
                <AppText style={styles.name} numberOfLines={1}>
                  {studentFullName(item)}
                </AppText>
              </View>
              <View style={styles.pills}>
                {STATUSES.map((s) => {
                  const on = current === s.key;
                  return (
                    <Pressable
                      key={s.key}
                      onPress={() => setStatus(item.id!, s.key)}
                      style={[styles.pill, on && { backgroundColor: s.color, borderColor: s.color }]}
                    >
                      <AppText style={[styles.pillText, on && { color: colors.onPrimary }]}>
                        {s.label}
                      </AppText>
                    </Pressable>
                  );
                })}
              </View>
            </Card>
          );
        }}
      />

      {message ? <AppText style={{ color: colors.successText }}>{message}</AppText> : null}
      {error ? <AppText style={{ color: colors.dangerText }}>{error}</AppText> : null}
      <Button
        title={saving ? "Saving…" : "Save attendance"}
        onPress={onSave}
        loading={saving}
        disabled={sunday || roster.length === 0}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  dateRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.sm },
  dateText: { fontSize: 15 },
  banner: { backgroundColor: colors.warningSoft, borderColor: colors.warning, paddingVertical: spacing.sm },
  summaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  legendItem: { fontSize: fontSize.xs, color: colors.muted },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.md },
  rollName: { flex: 1, gap: 2 },
  name: { fontSize: 14, fontWeight: fontWeight.medium },
  pills: { flexDirection: "row", gap: 4 },
  pill: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  pillText: { fontSize: 13, color: colors.muted, fontWeight: fontWeight.semibold },
});

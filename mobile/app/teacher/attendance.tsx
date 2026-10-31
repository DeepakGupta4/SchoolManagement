import { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  Screen,
  ScreenHeader,
  AppText,
  Card,
  Button,
  Loading,
  Avatar,
  MonthCalendar,
  StudentAttendanceModal,
  PagedList,
} from "@/components";
import { useAuth } from "@/store/auth";
import { getMyTeacher } from "@/api/teacher";
import { listStudents, studentFullName, type Student } from "@/api/students";
import {
  getSavedAttendance,
  saveAttendance,
  type AttendanceStatus,
  type AttendanceMark,
} from "@/api/attendance";
import { listHolidays, type Holiday } from "@/api/updates";
import { ApiError } from "@/api/client";
import { todayIso, addDays, isSundayIso, fullDate, weekday } from "@/lib/date";
import { colors, radius, spacing, fontWeight, fontSize, shadow } from "@/theme";

// Single source for the status pills (label + colour), reused in the legend + rows.
const STATUSES: { key: AttendanceStatus; label: string; word: string; color: string }[] = [
  { key: "present", label: "P", word: "present", color: colors.success },
  { key: "absent", label: "A", word: "absent", color: colors.danger },
  { key: "late", label: "L", word: "late", color: colors.warning },
  { key: "half-day", label: "½", word: "half", color: colors.info },
  { key: "leave", label: "Lv", word: "leave", color: colors.subtle },
];

export default function Attendance() {
  const [loading, setLoading] = useState(true);
  const [isClassTeacher, setIsClassTeacher] = useState(false);
  const [cls, setCls] = useState({ className: "", section: "" });
  const [roster, setRoster] = useState<Student[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, AttendanceStatus>>({});
  const [date, setDate] = useState(todayIso());
  const [calOpen, setCalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [alreadyMarked, setAlreadyMarked] = useState(false);
  const [summaryFor, setSummaryFor] = useState<Student | null>(null);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const role = useAuth((s) => s.user?.role);

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
      // Alphabetical by name (no reliance on manually-entered roll numbers).
      setRoster([...students].sort((a, b) => studentFullName(a).localeCompare(studentFullName(b))));
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

  // Holidays — used to block marking on a closed day. Fetched once.
  useEffect(() => {
    listHolidays()
      .then(setHolidays)
      .catch(() => {});
  }, []);

  // Saved marks for the chosen date → prefill; default everyone Present otherwise.
  useEffect(() => {
    if (!isClassTeacher || roster.length === 0) return;
    let alive = true;
    const fallback = () => Object.fromEntries(roster.map((s) => [s.id!, "present" as AttendanceStatus]));
    getSavedAttendance(cls.className, cls.section, date)
      .then((saved) => {
        if (!alive) return;
        // Locked only when a real manual save exists — auto-absent rows (source
        // "auto") don't count, so a teacher's first real save is never blocked.
        setAlreadyMarked(saved.some((r) => r.source === "manual"));
        const savedMap = new Map(saved.map((s) => [String(s.studentId), s.status]));
        setStatusMap(Object.fromEntries(roster.map((s) => [s.id!, savedMap.get(String(s.id)) ?? "present"])));
      })
      .catch(() => {
        if (!alive) return;
        setAlreadyMarked(false);
        setStatusMap(fallback());
      });
    return () => {
      alive = false;
    };
  }, [date, roster, isClassTeacher, cls.className, cls.section]);

  const counts = useMemo(() => {
    const c: Record<AttendanceStatus, number> = { present: 0, absent: 0, late: 0, "half-day": 0, leave: 0 };
    for (const s of roster) c[statusMap[s.id!] ?? "present"]++;
    return c;
  }, [roster, statusMap]);

  const sunday = isSundayIso(date);
  const holidayForDate = holidays.find((h) => h.date === date) ?? null;
  const closed = sunday || !!holidayForDate;
  const atToday = date >= todayIso();
  // A submitted register is read-only for teachers — only office roles can change
  // it (and they do that on the web). Default to locked for any non-office role.
  const canOverwrite = role === "super_admin" || role === "school_admin" || role === "principal";
  const locked = alreadyMarked && !canOverwrite;

  const setStatus = (id: string, status: AttendanceStatus) =>
    setStatusMap((p) => ({ ...p, [id]: status }));
  const markAllPresent = () => setStatusMap(Object.fromEntries(roster.map((s) => [s.id!, "present"])));

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

      {/* Date selector — step a day with the arrows, or tap the date for a calendar. */}
      <Card style={styles.dateCard}>
        <Pressable onPress={() => setDate(addDays(date, -1))} hitSlop={8} style={styles.arrow}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </Pressable>
        <Pressable
          onPress={() => setCalOpen(true)}
          style={styles.dateCenter}
          accessibilityRole="button"
          accessibilityLabel="Pick a date"
        >
          <View style={styles.dateTitleRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.primary} />
            <AppText variant="heading" style={styles.dateTitle}>
              {atToday ? "Today" : weekday(date)}
            </AppText>
          </View>
          <AppText variant="muted">{fullDate(date)}</AppText>
        </Pressable>
        <Pressable
          onPress={() => !atToday && setDate(addDays(date, 1))}
          hitSlop={8}
          disabled={atToday}
          style={styles.arrow}
        >
          <Ionicons name="chevron-forward" size={22} color={atToday ? colors.border : colors.primary} />
        </Pressable>
      </Card>

      {closed ? (
        <Card style={styles.banner}>
          <AppText style={{ color: colors.warningText }}>
            {holidayForDate
              ? `School's closed — ${holidayForDate.name}. Attendance isn't taken.`
              : "Sunday is a weekly holiday — attendance isn't taken."}
          </AppText>
        </Card>
      ) : locked ? (
        <Card style={styles.lockBanner}>
          <Ionicons name="lock-closed" size={16} color={colors.successText} />
          <AppText style={{ color: colors.successText, flex: 1 }}>
            Attendance submitted. Only the office can change it now — tap a student to see their record.
          </AppText>
        </Card>
      ) : (
        <View style={styles.summaryRow}>
          <AppText variant="muted">
            {counts.present} present · {counts.absent} absent{counts.late ? ` · ${counts.late} late` : ""}
          </AppText>
          <Button title="All present" variant="ghost" onPress={markAllPresent} />
        </View>
      )}

      <View style={styles.legend}>
        {STATUSES.map((s) => (
          <AppText key={s.key} style={styles.legendItem}>
            <AppText style={{ color: s.color, fontWeight: fontWeight.bold }}>{s.label}</AppText> {s.word}
          </AppText>
        ))}
      </View>

      <PagedList
        data={roster}
        keyExtractor={(s) => s.id ?? s.admissionNo}
        onRefresh={loadClass}
        refreshing={loading}
        pageSize={20}
        contentContainerStyle={{ gap: spacing.sm }}
        emptyText="No active students in this class."
        renderItem={({ item, index }) => {
          const current = statusMap[item.id!] ?? "present";
          return (
            <Card style={styles.row}>
              <Pressable
                style={styles.rowTop}
                onPress={() => setSummaryFor(item)}
                accessibilityRole="button"
                accessibilityLabel={`View ${studentFullName(item)}'s attendance`}
              >
                <AppText style={styles.serial}>{index + 1}</AppText>
                <Avatar name={studentFullName(item)} uri={item.avatar} size={36} />
                <AppText style={styles.name} numberOfLines={1}>
                  {studentFullName(item)}
                </AppText>
                <Ionicons name="chevron-forward" size={16} color={colors.subtle} />
              </Pressable>
              <View style={styles.pills}>
                {STATUSES.map((s) => {
                  const on = current === s.key;
                  return (
                    <Pressable
                      key={s.key}
                      onPress={() => setStatus(item.id!, s.key)}
                      disabled={locked || closed}
                      style={[
                        styles.pill,
                        on && { backgroundColor: s.color, borderColor: s.color },
                        (locked || closed) && !on && styles.pillLocked,
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on, disabled: locked || closed }}
                      accessibilityLabel={`${studentFullName(item)}: ${s.word}`}
                    >
                      <AppText style={[styles.pillText, on && styles.pillTextOn]}>{s.label}</AppText>
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
        title={closed ? "School closed" : locked ? "Attendance submitted ✓" : saving ? "Saving…" : "Save attendance"}
        onPress={onSave}
        loading={saving}
        disabled={locked || closed || roster.length === 0}
      />

      {/* Calendar picker */}
      <Modal visible={calOpen} transparent animationType="fade" onRequestClose={() => setCalOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setCalOpen(false)}>
          <Pressable style={styles.calCard} onPress={() => {}}>
            <MonthCalendar
              value={date}
              maxDate={todayIso()}
              onSelect={(d) => {
                setDate(d);
                setCalOpen(false);
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <StudentAttendanceModal
        studentId={summaryFor?.id ?? null}
        name={summaryFor ? studentFullName(summaryFor) : ""}
        avatarUri={summaryFor?.avatar}
        onClose={() => setSummaryFor(null)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  sep: { height: spacing.sm },

  dateCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: spacing.sm },
  arrow: { padding: spacing.xs },
  dateCenter: { flex: 1, alignItems: "center", gap: 2 },
  dateTitleRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  dateTitle: { fontSize: fontSize.md },

  overlay: { flex: 1, backgroundColor: colors.scrim, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  calCard: { width: "100%", maxWidth: 360, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.sm, ...shadow.lg },

  banner: { backgroundColor: colors.warningSoft, borderColor: colors.warning, paddingVertical: spacing.sm },
  lockBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
    paddingVertical: spacing.sm,
  },
  summaryRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  legendItem: { fontSize: fontSize.xs, color: colors.muted },

  row: { gap: spacing.sm, padding: spacing.md },
  rowTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  serial: { minWidth: 20, textAlign: "center", fontSize: fontSize.sm, color: colors.muted, fontWeight: fontWeight.semibold },
  name: { flex: 1, fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.text },
  pills: { flexDirection: "row", gap: spacing.xs },
  pill: {
    flex: 1,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  pillText: { fontSize: fontSize.sm, color: colors.muted, fontWeight: fontWeight.semibold },
  pillTextOn: { color: colors.onPrimary },
  pillLocked: { opacity: 0.45 },
});

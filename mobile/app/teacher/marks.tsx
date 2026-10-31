import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useFocusEffect } from "expo-router";
import {
  Screen,
  ScreenHeader,
  AppText,
  Card,
  Button,
  TextField,
  Loading,
  Chips,
  Avatar,
  PagedList,
  type ChipOption,
} from "@/components";
import { getMyTeacher } from "@/api/teacher";
import { listStudents, studentFullName, type Student } from "@/api/students";
import { listExams } from "@/api/exams";
import { listClasses, type SchoolClass } from "@/api/classes";
import { getMarks, saveMarks, type MarkRow } from "@/api/marks";
import { ApiError } from "@/api/client";
import { colors, radius, spacing, fontWeight, fontSize } from "@/theme";

interface Scope {
  classes: string[];
  classTeacherOf: string;
  classTeacherSection: string;
  isClassTeacher: boolean;
  subjects: string[];
}

/** One student's entry. For a theory-only paper only `theory` is used (as the total). */
type Entry = { theory: string; practical: string; absent: boolean };
const BLANK: Entry = { theory: "", practical: "", absent: false };
const digits = (v: string) => v.replace(/[^\d]/g, "");

export default function Marks() {
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<Scope | null>(null);
  const [exams, setExams] = useState<string[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);

  const [examName, setExamName] = useState("");
  const [className, setClassName] = useState("");
  const [section, setSection] = useState("");
  const [subject, setSubject] = useState("");

  const [hasPractical, setHasPractical] = useState(false);
  const [maxMarks, setMaxMarks] = useState("100");
  const [theoryMax, setTheoryMax] = useState("70");
  const [practicalMax, setPracticalMax] = useState("30");

  const [roster, setRoster] = useState<Student[]>([]);
  const [entryMap, setEntryMap] = useState<Record<string, Entry>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadRefs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [t, ex, cl] = await Promise.all([getMyTeacher(), listExams(), listClasses()]);
      setScope({
        classes: (t.classes ?? []).filter(Boolean),
        classTeacherOf: t.classTeacherOf ?? "",
        classTeacherSection: t.classTeacherSection ?? "",
        isClassTeacher: !!t.isClassTeacher,
        subjects: (t.subjects ?? []).filter(Boolean),
      });
      setExams(ex.map((e) => e.name).filter(Boolean));
      setClasses(cl);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load exam data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRefs();
    }, [loadRefs])
  );

  const classOptions: ChipOption[] = useMemo(() => {
    if (!scope) return [];
    return [...new Set([...scope.classes, scope.classTeacherOf].filter(Boolean))].map((c) => ({
      label: c,
      value: c,
    }));
  }, [scope]);

  const subjectOptions: ChipOption[] = useMemo(
    () => (scope?.subjects ?? []).map((s) => ({ label: s, value: s })),
    [scope]
  );

  const examOptions: ChipOption[] = useMemo(() => exams.map((e) => ({ label: e, value: e })), [exams]);

  // Section picker, section-locked like the server: any section of a class they
  // subject-teach, only their own section for their class-teacher-only class.
  const sectionOptions: ChipOption[] = useMemo(() => {
    if (!scope) return [];
    const all = classes.find((c) => c.name === className)?.sections ?? [];
    const classTeacherOnly =
      !scope.classes.includes(className) &&
      scope.isClassTeacher &&
      scope.classTeacherOf === className &&
      !!scope.classTeacherSection;
    const allowed = classTeacherOnly ? [scope.classTeacherSection] : all;
    return allowed.map((s) => ({ label: s, value: s }));
  }, [classes, className, scope]);

  // Snap each selection into a valid value as options load / the class changes.
  useEffect(() => {
    if (!classOptions.length) return;
    if (!classOptions.some((o) => o.value === className)) {
      const pref =
        scope?.classTeacherOf && classOptions.some((o) => o.value === scope.classTeacherOf)
          ? scope.classTeacherOf
          : classOptions[0].value;
      setClassName(pref);
    }
  }, [classOptions, className, scope]);
  useEffect(() => {
    if (sectionOptions.length && !sectionOptions.some((o) => o.value === section)) {
      setSection(sectionOptions[0].value);
    }
  }, [sectionOptions, section]);
  useEffect(() => {
    if (subjectOptions.length && !subjectOptions.some((o) => o.value === subject)) {
      setSubject(subjectOptions[0].value);
    }
  }, [subjectOptions, subject]);
  useEffect(() => {
    if (examOptions.length && !examOptions.some((o) => o.value === examName)) {
      setExamName(examOptions[0].value);
    }
  }, [examOptions, examName]);

  // Roster + saved marks for the chosen exam/class/section/subject; infers the scheme.
  useEffect(() => {
    if (!examName || !className || !section || !subject) {
      setRoster([]);
      setEntryMap({});
      return;
    }
    let alive = true;
    Promise.all([
      listStudents({ className, section, status: "active" }),
      getMarks(examName, className, section),
    ])
      .then(([students, saved]) => {
        if (!alive) return;
        const sorted = [...students].sort((a, b) => studentFullName(a).localeCompare(studentFullName(b)));
        setRoster(sorted);
        const forSubject = saved.filter((m) => m.subject === subject);
        const byId = new Map(forSubject.map((m) => [String(m.studentId), m]));
        // Re-create the scheme the marks were saved under.
        const sample = forSubject[0];
        if (sample) {
          if (sample.theoryMax != null || sample.practicalMax != null) {
            setHasPractical(true);
            setTheoryMax(String(sample.theoryMax ?? 70));
            setPracticalMax(String(sample.practicalMax ?? 30));
          } else {
            setHasPractical(false);
            if (sample.maxMarks) setMaxMarks(String(sample.maxMarks));
          }
        }
        setEntryMap(
          Object.fromEntries(
            sorted.map((s) => {
              const m = byId.get(String(s.id));
              if (!m) return [s.id!, { ...BLANK }];
              return [
                s.id!,
                {
                  theory: m.theory != null ? String(m.theory) : m.absent ? "" : String(m.marks ?? ""),
                  practical: m.practical != null ? String(m.practical) : "",
                  absent: !!m.absent,
                },
              ];
            })
          )
        );
      })
      .catch((e) => alive && setError(e instanceof ApiError ? e.message : "Could not load the sheet."));
    return () => {
      alive = false;
    };
  }, [examName, className, section, subject]);

  const setEntry = (id: string, patch: Partial<Entry>) =>
    setEntryMap((p) => ({ ...p, [id]: { ...(p[id] ?? BLANK), ...patch } }));

  const theoryMaxN = Number(theoryMax) || 0;
  const practicalMaxN = Number(practicalMax) || 0;
  const maxN = hasPractical ? theoryMaxN + practicalMaxN : Number(maxMarks) || 0;
  const entryTotal = (e: Entry) =>
    hasPractical ? (Number(e.theory) || 0) + (Number(e.practical) || 0) : Number(e.theory) || 0;

  const onSave = async () => {
    if (maxN < 1) {
      setError(hasPractical ? "Set the theory / practical max first." : "Max marks must be at least 1.");
      return;
    }
    const records: MarkRow[] = [];
    for (const s of roster) {
      const e = entryMap[s.id!] ?? BLANK;
      const base = { studentId: s.id!, studentName: studentFullName(s), roll: Number(s.rollNo) || 0, subject };
      if (e.absent) {
        records.push({
          ...base,
          marks: 0,
          maxMarks: maxN,
          absent: true,
          ...(hasPractical ? { theoryMax: theoryMaxN, practicalMax: practicalMaxN } : {}),
        });
        continue;
      }
      if (hasPractical) {
        if (e.theory === "" && e.practical === "") continue;
        const t = Number(e.theory) || 0;
        const p = Number(e.practical) || 0;
        if (t > theoryMaxN) {
          setError(`${studentFullName(s)}: theory can't exceed ${theoryMaxN}.`);
          return;
        }
        if (p > practicalMaxN) {
          setError(`${studentFullName(s)}: practical can't exceed ${practicalMaxN}.`);
          return;
        }
        records.push({
          ...base,
          marks: t + p,
          maxMarks: maxN,
          theory: t,
          practical: p,
          theoryMax: theoryMaxN,
          practicalMax: practicalMaxN,
          absent: false,
        });
      } else {
        if (e.theory === "") continue;
        const m = Number(e.theory) || 0;
        if (m > maxN) {
          setError(`${studentFullName(s)}: marks can't exceed ${maxN}.`);
          return;
        }
        records.push({ ...base, marks: m, maxMarks: maxN, absent: false });
      }
    }
    if (records.length === 0) {
      setError("Enter at least one student's marks (or mark them absent).");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await saveMarks({ examName, className, section, records });
      setMessage(`Saved ${res.saved}${res.skipped ? ` · ${res.skipped} skipped` : ""} ✓`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not save marks.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Screen scroll={false}>
        <Loading label="Loading…" />
      </Screen>
    );
  }

  if (!scope) {
    return (
      <Screen>
        <ScreenHeader title="Mark Entry" back />
        <Card>
          <AppText style={{ color: colors.dangerText }}>{error ?? "Could not load your teacher profile."}</AppText>
        </Card>
      </Screen>
    );
  }

  const ready = !!examName && !!className && !!section && !!subject;

  return (
    <Screen scroll={false} style={{ gap: spacing.md }}>
      <ScreenHeader title="Mark Entry" back />

      <PagedList
        data={ready ? roster : []}
        resetKey={`${examName}|${className}|${section}|${subject}`}
        keyExtractor={(s) => s.id ?? s.admissionNo}
        pageSize={20}
        emptyText={
          ready
            ? `No active students in ${className} · ${section}.`
            : "Pick an exam, class, section and subject to load the sheet."
        }
        ListHeaderComponent={
          <Card style={{ gap: spacing.md }}>
            {examOptions.length === 0 ? (
              <AppText variant="muted">No exams created yet — ask the office to add one.</AppText>
            ) : (
              <View style={styles.field}>
                <AppText variant="label">Exam</AppText>
                <Chips options={examOptions} value={examName} onChange={setExamName} />
              </View>
            )}
            <View style={styles.field}>
              <AppText variant="label">Class</AppText>
              <Chips options={classOptions} value={className} onChange={setClassName} />
            </View>
            <View style={styles.field}>
              <AppText variant="label">Section</AppText>
              <Chips options={sectionOptions} value={section} onChange={setSection} />
            </View>
            {subjectOptions.length === 0 ? (
              <AppText variant="muted">No subjects are assigned to you yet.</AppText>
            ) : (
              <View style={styles.field}>
                <AppText variant="label">Subject</AppText>
                <Chips options={subjectOptions} value={subject} onChange={setSubject} />
              </View>
            )}

            <View style={styles.field}>
              <AppText variant="label">Marks scheme</AppText>
              <View style={styles.toggle}>
                <Pressable
                  onPress={() => setHasPractical(false)}
                  style={[styles.toggleBtn, !hasPractical && styles.toggleOn]}
                >
                  <AppText style={!hasPractical ? styles.toggleTextOn : styles.toggleText}>Theory only</AppText>
                </Pressable>
                <Pressable
                  onPress={() => setHasPractical(true)}
                  style={[styles.toggleBtn, hasPractical && styles.toggleOn]}
                >
                  <AppText style={hasPractical ? styles.toggleTextOn : styles.toggleText}>Theory + Practical</AppText>
                </Pressable>
              </View>
            </View>

            {hasPractical ? (
              <>
                <View style={styles.maxRow}>
                  <View style={styles.flex}>
                    <TextField
                      label="Theory max"
                      value={theoryMax}
                      onChangeText={(v) => setTheoryMax(digits(v))}
                      keyboardType="number-pad"
                    />
                  </View>
                  <View style={styles.flex}>
                    <TextField
                      label="Practical max"
                      value={practicalMax}
                      onChangeText={(v) => setPracticalMax(digits(v))}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>
                <AppText variant="muted">Total per student: {maxN}</AppText>
              </>
            ) : (
              <TextField
                label="Max marks (applies to all)"
                value={maxMarks}
                onChangeText={(v) => setMaxMarks(digits(v))}
                keyboardType="number-pad"
              />
            )}
          </Card>
        }
        renderItem={({ item: s }) => {
          const e = entryMap[s.id!] ?? BLANK;
          const total = entryTotal(e);
          return (
            <Card style={styles.row}>
              <View style={styles.rowTop}>
                <Avatar name={studentFullName(s)} uri={s.avatar} size={40} />
                <View style={styles.flex}>
                  <AppText style={styles.name} numberOfLines={1}>
                    {studentFullName(s)}
                  </AppText>
                  <AppText variant="small" style={styles.roll}>
                    Roll {String(s.rollNo)}
                  </AppText>
                </View>
                <Pressable
                  onPress={() => setEntry(s.id!, { absent: !e.absent })}
                  style={[styles.absent, e.absent && styles.absentOn]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: e.absent }}
                  accessibilityLabel={`Mark ${studentFullName(s)} absent`}
                >
                  <AppText style={e.absent ? styles.absentTextOn : styles.absentText}>
                    {e.absent ? "Absent" : "Absent?"}
                  </AppText>
                </Pressable>
              </View>

              {e.absent ? null : hasPractical ? (
                <View style={styles.inputs}>
                  <MarkBox label="Theory" value={e.theory} max={theoryMax} onChange={(v) => setEntry(s.id!, { theory: v })} />
                  <MarkBox
                    label="Practical"
                    value={e.practical}
                    max={practicalMax}
                    onChange={(v) => setEntry(s.id!, { practical: v })}
                  />
                  <View style={styles.totalBox}>
                    <AppText variant="small" style={styles.inputLabel}>
                      Total
                    </AppText>
                    <AppText style={styles.totalVal}>
                      {total}/{maxN}
                    </AppText>
                  </View>
                </View>
              ) : (
                <View style={styles.inputs}>
                  <MarkBox label="Marks" value={e.theory} max={maxMarks} onChange={(v) => setEntry(s.id!, { theory: v })} />
                </View>
              )}
            </Card>
          );
        }}
      />

      {message ? <AppText style={{ color: colors.successText }}>{message}</AppText> : null}
      {error ? <AppText style={{ color: colors.dangerText }}>{error}</AppText> : null}
      {ready && roster.length > 0 ? (
        <Button title={saving ? "Saving…" : "Save marks"} onPress={onSave} loading={saving} />
      ) : null}
    </Screen>
  );
}

function MarkBox({
  label,
  value,
  max,
  onChange,
}: {
  label: string;
  value: string;
  max: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.box}>
      <AppText variant="small" style={styles.inputLabel}>
        {label}
      </AppText>
      <View style={styles.boxInput}>
        <TextField
          value={value}
          onChangeText={(v) => onChange(v.replace(/[^\d]/g, ""))}
          keyboardType="number-pad"
          placeholder="—"
          style={styles.markInput}
        />
        <AppText variant="muted"> /{max || "—"}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  flex: { flex: 1 },

  toggle: { flexDirection: "row", gap: spacing.sm },
  toggleBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    backgroundColor: colors.surface,
  },
  toggleOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  toggleText: { color: colors.muted, fontWeight: fontWeight.medium, fontSize: fontSize.sm },
  toggleTextOn: { color: colors.onPrimary, fontWeight: fontWeight.semibold, fontSize: fontSize.sm },
  maxRow: { flexDirection: "row", gap: spacing.md },

  row: { gap: spacing.sm, padding: spacing.md },
  rowTop: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  name: { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.text },
  roll: { color: colors.muted },

  absent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  absentOn: { backgroundColor: colors.dangerSoft, borderColor: colors.danger },
  absentText: { color: colors.muted, fontSize: fontSize.xs, fontWeight: fontWeight.medium },
  absentTextOn: { color: colors.dangerText, fontSize: fontSize.xs, fontWeight: fontWeight.semibold },

  inputs: { flexDirection: "row", alignItems: "flex-end", gap: spacing.md },
  box: { flex: 1, gap: 2 },
  inputLabel: { color: colors.muted },
  boxInput: { flexDirection: "row", alignItems: "center" },
  markInput: { flex: 1, textAlign: "center" },
  totalBox: { alignItems: "flex-end", gap: 2, minWidth: 64 },
  totalVal: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.primaryText },
});

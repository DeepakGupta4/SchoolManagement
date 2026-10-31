import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Screen, ScreenHeader, AppText, Card, Button, TextField, Loading, Chips, PagedList, type ChipOption } from "@/components";
import { getMyTeacher } from "@/api/teacher";
import { listStudents, studentFullName, type Student } from "@/api/students";
import { listExams } from "@/api/exams";
import { listClasses, type SchoolClass } from "@/api/classes";
import { getMarks, saveMarks, type MarkRow } from "@/api/marks";
import { ApiError } from "@/api/client";
import { colors, radius, spacing, fontWeight } from "@/theme";

interface Scope {
  classes: string[];
  classTeacherOf: string;
  classTeacherSection: string;
  isClassTeacher: boolean;
  subjects: string[];
}

export default function Marks() {
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<Scope | null>(null);
  const [exams, setExams] = useState<string[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);

  const [examName, setExamName] = useState("");
  const [className, setClassName] = useState("");
  const [section, setSection] = useState("");
  const [subject, setSubject] = useState("");
  const [maxMarks, setMaxMarks] = useState("100");

  const [roster, setRoster] = useState<Student[]>([]);
  const [marksMap, setMarksMap] = useState<Record<string, string>>({});
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

  // Roster + saved marks for the chosen exam/class/section/subject.
  useEffect(() => {
    if (!examName || !className || !section || !subject) {
      setRoster([]);
      setMarksMap({});
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
        setMarksMap(
          Object.fromEntries(
            sorted.map((s) => [s.id!, byId.has(String(s.id)) ? String(byId.get(String(s.id))!.marks) : ""])
          )
        );
        if (forSubject[0]?.maxMarks) setMaxMarks(String(forSubject[0].maxMarks));
      })
      .catch((e) => alive && setError(e instanceof ApiError ? e.message : "Could not load the sheet."));
    return () => {
      alive = false;
    };
  }, [examName, className, section, subject]);

  const setMark = (id: string, v: string) =>
    setMarksMap((p) => ({ ...p, [id]: v.replace(/[^\d]/g, "") }));

  const onSave = async () => {
    const maxN = Number(maxMarks);
    if (!Number.isFinite(maxN) || maxN < 1) {
      setError("Max marks must be at least 1.");
      return;
    }
    const records: MarkRow[] = [];
    for (const s of roster) {
      const raw = marksMap[s.id!] ?? "";
      if (raw === "") continue;
      const m = Number(raw);
      if (m > maxN) {
        setError(`${studentFullName(s)}: marks can't exceed ${maxN}.`);
        return;
      }
      records.push({
        studentId: s.id!,
        studentName: studentFullName(s),
        roll: Number(s.rollNo) || 0,
        subject,
        marks: m,
        maxMarks: maxN,
      });
    }
    if (records.length === 0) {
      setError("Enter at least one student's marks.");
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
            <TextField
              label="Max marks (applies to all)"
              value={maxMarks}
              onChangeText={(v) => setMaxMarks(v.replace(/[^\d]/g, ""))}
              keyboardType="number-pad"
            />
          </Card>
        }
        renderItem={({ item: s }) => (
          <Card style={styles.row}>
            <View style={styles.rollName}>
              <AppText variant="small" style={{ color: colors.primaryText }}>
                #{String(s.rollNo)}
              </AppText>
              <AppText style={styles.name} numberOfLines={1}>
                {studentFullName(s)}
              </AppText>
            </View>
            <View style={styles.markCell}>
              <TextField
                value={marksMap[s.id!] ?? ""}
                onChangeText={(v) => setMark(s.id!, v)}
                keyboardType="number-pad"
                placeholder="—"
                style={styles.markInput}
              />
              <AppText variant="muted"> / {maxMarks || "—"}</AppText>
            </View>
          </Card>
        )}
      />

      {message ? <AppText style={{ color: colors.successText }}>{message}</AppText> : null}
      {error ? <AppText style={{ color: colors.dangerText }}>{error}</AppText> : null}
      {ready && roster.length > 0 ? (
        <Button title={saving ? "Saving…" : "Save marks"} onPress={onSave} loading={saving} />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md },
  rollName: { flex: 1, gap: 2 },
  name: { fontSize: 14, fontWeight: fontWeight.medium },
  markCell: { flexDirection: "row", alignItems: "center" },
  markInput: { width: 64, textAlign: "center" },
});

import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen, ScreenHeader, AppText, Card, TextField, Button, Loading } from "@/components";
import { getMyTeacher } from "@/api/teacher";
import { createStudent, updateStudent, getStudent, type Student } from "@/api/students";
import { ApiError } from "@/api/client";
import { colors, radius, spacing } from "@/theme";

const GENDERS = ["male", "female", "other"] as const;

/** Add / edit a student. Class + section are the teacher's own (locked + forced server-side). */
export default function StudentForm() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cls, setCls] = useState({ className: "", section: "" });

  const [f, setF] = useState({
    admissionNo: "",
    rollNo: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "male" as Student["gender"],
    admissionDate: new Date().toISOString().slice(0, 10),
    address: "",
    gName: "",
    gRelation: "",
    gPhone: "",
    gEmail: "",
  });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const t = await getMyTeacher();
        if (alive) setCls({ className: t.classTeacherOf ?? "", section: t.classTeacherSection ?? "" });
        if (isEdit && id) {
          const s = await getStudent(id);
          if (!alive) return;
          setF({
            admissionNo: s.admissionNo,
            rollNo: String(s.rollNo),
            firstName: s.firstName,
            lastName: s.lastName,
            email: s.email,
            phone: s.phone,
            dateOfBirth: s.dateOfBirth,
            gender: s.gender,
            admissionDate: s.admissionDate,
            address: s.address,
            gName: s.guardian?.name ?? "",
            gRelation: s.guardian?.relation ?? "",
            gPhone: s.guardian?.phone ?? "",
            gEmail: s.guardian?.email ?? "",
          });
        }
      } catch (e) {
        if (alive) setError(e instanceof ApiError ? e.message : "Could not load.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, isEdit]);

  const onSave = async () => {
    setError(null);
    setSaving(true);
    const body: Partial<Student> = {
      admissionNo: f.admissionNo.trim(),
      rollNo: f.rollNo.trim(),
      firstName: f.firstName.trim(),
      lastName: f.lastName.trim(),
      email: f.email.trim(),
      phone: f.phone.trim(),
      dateOfBirth: f.dateOfBirth.trim(),
      gender: f.gender,
      admissionDate: f.admissionDate.trim(),
      address: f.address.trim(),
      className: cls.className,
      section: cls.section,
      guardian: {
        name: f.gName.trim(),
        relation: f.gRelation.trim(),
        phone: f.gPhone.trim(),
        email: f.gEmail.trim() || undefined,
      },
    };
    try {
      if (isEdit && id) await updateStudent(id, body);
      else await createStudent(body);
      router.back();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not save.");
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

  return (
    <Screen style={{ gap: spacing.md }}>
      <ScreenHeader title={isEdit ? "Edit student" : "Add student"} back />

      <Card style={{ gap: spacing.xs }}>
        <AppText variant="label">Class (your class — locked)</AppText>
        <AppText>
          {cls.className || "—"}
          {cls.section ? ` · ${cls.section}` : ""}
        </AppText>
      </Card>

      <TextField label="Admission no." value={f.admissionNo} onChangeText={(v) => set("admissionNo", v)} editable={!isEdit} />
      <TextField label="Roll no." value={f.rollNo} onChangeText={(v) => set("rollNo", v)} keyboardType="number-pad" />
      <TextField label="First name" value={f.firstName} onChangeText={(v) => set("firstName", v)} />
      <TextField label="Last name" value={f.lastName} onChangeText={(v) => set("lastName", v)} />
      <TextField label="Email" value={f.email} onChangeText={(v) => set("email", v)} autoCapitalize="none" keyboardType="email-address" />
      <TextField
        label="Phone (10 digits)"
        value={f.phone}
        onChangeText={(v) => set("phone", v.replace(/\D/g, "").slice(0, 10))}
        keyboardType="number-pad"
      />
      <TextField label="Date of birth (YYYY-MM-DD)" value={f.dateOfBirth} onChangeText={(v) => set("dateOfBirth", v)} placeholder="2015-06-01" />

      <View>
        <AppText variant="label">Gender</AppText>
        <View style={styles.seg}>
          {GENDERS.map((g) => (
            <Pressable key={g} onPress={() => set("gender", g)} style={[styles.segBtn, f.gender === g && styles.segOn]}>
              <AppText style={f.gender === g ? { color: colors.onPrimary } : { color: colors.muted }}>{g}</AppText>
            </Pressable>
          ))}
        </View>
      </View>

      <TextField label="Admission date (YYYY-MM-DD)" value={f.admissionDate} onChangeText={(v) => set("admissionDate", v)} />
      <TextField label="Address" value={f.address} onChangeText={(v) => set("address", v)} multiline />

      <AppText variant="heading">Guardian</AppText>
      <TextField label="Name" value={f.gName} onChangeText={(v) => set("gName", v)} />
      <TextField label="Relation" value={f.gRelation} onChangeText={(v) => set("gRelation", v)} placeholder="Father / Mother / Guardian" />
      <TextField
        label="Phone (10 digits)"
        value={f.gPhone}
        onChangeText={(v) => set("gPhone", v.replace(/\D/g, "").slice(0, 10))}
        keyboardType="number-pad"
      />
      <TextField label="Email (optional)" value={f.gEmail} onChangeText={(v) => set("gEmail", v)} autoCapitalize="none" keyboardType="email-address" />

      {error ? <AppText style={{ color: colors.dangerText }}>{error}</AppText> : null}
      <Button title={isEdit ? "Save changes" : "Add student"} onPress={onSave} loading={saving} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  seg: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
  segBtn: {
    flex: 1,
    height: 42,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  segOn: { backgroundColor: colors.primary, borderColor: colors.primary },
});

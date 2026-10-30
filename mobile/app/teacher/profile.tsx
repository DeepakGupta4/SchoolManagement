import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Screen, AppText, Card, Button, TextField } from "@/components";
import { useAuth } from "@/store/auth";
import { updateMe, changeMyPassword } from "@/api/auth";
import { ApiError } from "@/api/client";
import { colors, spacing, fontSize, fontWeight } from "@/theme";

// Avatars travel inside the JSON PATCH body, so cap the data-URL length.
const MAX_AVATAR_CHARS = 2_000_000;
// Server + client minimum for a new password.
const MIN_PASSWORD = 8;

export default function Profile() {
  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);

  // (1) Identity card — seeded from the cached user, each with its own feedback.
  const [name, setName] = useState(user?.name ?? "");
  const [avatar, setAvatar] = useState(user?.avatar ?? "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  // (2) Change-password card.
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdMsg, setPwdMsg] = useState<string | null>(null);

  if (!user) {
    return (
      <Screen>
        <AppText variant="title">My Profile</AppText>
        <Card>
          <AppText variant="muted">You&apos;re not signed in.</AppText>
        </Card>
      </Screen>
    );
  }

  const initial = (user.name ?? "?").slice(0, 1).toUpperCase();

  // Pick from the library as a base64 data-URL; reject anything over the cap.
  const pickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      base64: true,
      quality: 0.5,
    });
    const a = res.assets?.[0];
    if (res.canceled || !a?.base64) return;
    const mime = a.mimeType || "image/jpeg";
    const dataUrl = `data:${mime};base64,${a.base64}`;
    if (dataUrl.length > MAX_AVATAR_CHARS) {
      setProfileError("Image too large — pick a smaller one.");
      return;
    }
    setProfileError(null);
    setProfileMsg(null);
    setAvatar(dataUrl);
  };

  const onSaveProfile = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setProfileError("Name can't be empty.");
      return;
    }
    setSavingProfile(true);
    setProfileError(null);
    setProfileMsg(null);
    try {
      const updated = await updateMe({ name: trimmed, avatar: avatar || undefined });
      setUser(updated);
      setName(updated.name);
      setAvatar(updated.avatar ?? "");
      setProfileMsg("Profile saved ✓");
    } catch (e) {
      setProfileError(e instanceof ApiError ? e.message : "Could not save your profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const onChangePassword = async () => {
    if (newPassword.length < MIN_PASSWORD) {
      setPwdError(`New password must be at least ${MIN_PASSWORD} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError("New password and confirmation don't match.");
      return;
    }
    setSavingPwd(true);
    setPwdError(null);
    setPwdMsg(null);
    try {
      await changeMyPassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPwdMsg("Password changed ✓");
    } catch (e) {
      setPwdError(e instanceof ApiError ? e.message : "Could not change your password.");
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <Screen style={{ gap: spacing.lg }}>
      <AppText variant="title">My Profile</AppText>

      {/* (1) Avatar + name */}
      <Card style={{ gap: spacing.md }}>
        <View style={styles.identity}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <AppText style={styles.avatarInitial}>{initial}</AppText>
            </View>
          )}
          <View style={styles.flex}>
            <AppText variant="heading" numberOfLines={1}>
              {user.name}
            </AppText>
            <AppText variant="muted" numberOfLines={1}>
              {user.email}
            </AppText>
            <AppText variant="small">Role: {user.role}</AppText>
          </View>
        </View>

        <Button title="Change photo" variant="outline" onPress={pickPhoto} />
        <TextField
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="Your full name"
          autoCapitalize="words"
        />

        {profileError ? <AppText style={{ color: colors.dangerText }}>{profileError}</AppText> : null}
        {profileMsg ? <AppText style={{ color: colors.successText }}>{profileMsg}</AppText> : null}
        <Button
          title={savingProfile ? "Saving…" : "Save"}
          onPress={onSaveProfile}
          loading={savingProfile}
        />
      </Card>

      {/* (2) Change password */}
      <Card style={{ gap: spacing.md }}>
        <AppText variant="heading">Change password</AppText>
        <TextField
          label="Current password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          autoCapitalize="none"
          placeholder="••••••••"
        />
        <TextField
          label="New password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          autoCapitalize="none"
          placeholder={`At least ${MIN_PASSWORD} characters`}
        />
        <TextField
          label="Confirm new password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
          placeholder="Re-enter new password"
        />

        {pwdError ? <AppText style={{ color: colors.dangerText }}>{pwdError}</AppText> : null}
        {pwdMsg ? <AppText style={{ color: colors.successText }}>{pwdMsg}</AppText> : null}
        <Button
          title={savingPwd ? "Updating…" : "Update password"}
          onPress={onChangePassword}
          loading={savingPwd}
          disabled={!currentPassword || !newPassword || !confirmPassword}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  identity: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  avatarFallback: { backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  avatarInitial: { color: colors.primaryText, fontSize: fontSize.xl, fontWeight: fontWeight.bold },
});

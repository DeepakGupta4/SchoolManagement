import { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { AppText, TextField, GradientButton } from "@/components";
import { login } from "@/api/auth";
import { ApiError } from "@/api/client";
import { useAuth } from "@/store/auth";
import { colors, spacing, radius, fontSize, fontWeight, shadow } from "@/theme";

import LOGO from "../assets/logo-mark.png";

export default function Login() {
  const router = useRouter();
  const signIn = useAuth((s) => s.signIn);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [twoFa, setTwoFa] = useState(false);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await login(email.trim(), password, twoFa ? code : undefined);
      if ("twoFactorRequired" in res) {
        setTwoFa(true); // password ok → now ask for the code
        return;
      }
      signIn(res.user);
      router.replace("/");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not sign in.");
    } finally {
      setLoading(false);
    }
  };

  const disabled = !email || !password || (twoFa && code.length !== 6);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      <StatusBar style="dark" />
      {/* soft brand halos behind everything */}
      <View pointerEvents="none" style={[styles.halo, styles.halo1]} />
      <View pointerEvents="none" style={[styles.halo, styles.halo2]} />

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* brand */}
          <View style={styles.brand}>
            <View style={styles.tile}>
              <Image source={LOGO} style={styles.logo} resizeMode="contain" />
            </View>
            <AppText variant="title">
              School<AppText variant="title" style={styles.wordmarkAccent}>Deck</AppText>
            </AppText>
            <AppText variant="muted" style={styles.tagline}>
              Your school, beautifully managed
            </AppText>
          </View>

          {/* form */}
          <View style={styles.card}>
            <AppText style={styles.title}>{twoFa ? "Almost there" : "Welcome back"}</AppText>
            <AppText variant="muted" style={styles.subtitle}>
              {twoFa ? "Enter the 6-digit code from your authenticator app" : "Sign in to continue to your dashboard"}
            </AppText>

            {!twoFa ? (
              <>
                <TextField
                  label="Email"
                  leftIcon="mail-outline"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@school.com"
                  placeholderTextColor={colors.muted}
                  editable={!loading}
                />
                <TextField
                  label="Password"
                  leftIcon="lock-closed-outline"
                  secureTextEntry={!show}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.muted}
                  editable={!loading}
                  returnKeyType="go"
                  onSubmitEditing={() => {
                    if (!disabled) onSubmit();
                  }}
                  rightSlot={
                    <Pressable
                      onPress={() => setShow((s) => !s)}
                      hitSlop={12}
                      accessibilityRole="button"
                      accessibilityLabel={show ? "Hide password" : "Show password"}
                    >
                      <Ionicons name={show ? "eye-off-outline" : "eye-outline"} size={20} color={colors.muted} />
                    </Pressable>
                  }
                />
              </>
            ) : (
              <TextField
                label="Authentication code"
                leftIcon="shield-checkmark-outline"
                keyboardType="number-pad"
                maxLength={6}
                value={code}
                onChangeText={(t) => setCode(t.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                placeholderTextColor={colors.muted}
                editable={!loading}
              />
            )}

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color={colors.dangerText} />
                <AppText style={styles.errorText}>{error}</AppText>
              </View>
            ) : null}

            <GradientButton
              title={twoFa ? "Verify code" : "Sign in"}
              icon="arrow-forward"
              onPress={onSubmit}
              loading={loading}
              disabled={disabled}
              style={styles.cta}
            />

            {twoFa ? (
              <Pressable
                onPress={() => {
                  setTwoFa(false);
                  setCode("");
                  setError(null);
                }}
                style={styles.linkWrap}
              >
                <AppText style={styles.link}>Use a different account</AppText>
              </Pressable>
            ) : (
              <Pressable onPress={onForgot} style={styles.linkWrap}>
                <AppText style={styles.link}>Forgot password?</AppText>
              </Pressable>
            )}
          </View>

          {/* footer */}
          <View style={styles.footer}>
            <Ionicons name="lock-closed" size={13} color={colors.muted} />
            <AppText variant="muted">Protected by 2-factor authentication</AppText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** No self-serve reset yet — point the user to their school office. */
function onForgot() {
  Alert.alert("Reset password", "Please contact your school administrator to reset your password.");
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: "center", padding: spacing.xl, gap: spacing.xl },

  halo: { position: "absolute", borderRadius: radius.pill },
  halo1: { width: 340, height: 340, top: -140, left: -110, backgroundColor: colors.primarySoft, opacity: 0.45 },
  halo2: { width: 240, height: 240, top: -100, right: -110, backgroundColor: colors.primarySoft, opacity: 0.4 },

  brand: { alignItems: "center", gap: spacing.sm },
  tile: {
    width: 76,
    height: 76,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  logo: { width: 50, height: 50 },
  wordmarkAccent: { color: colors.primary },
  tagline: { textAlign: "center" },

  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
    ...shadow.lg,
  },
  title: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  subtitle: { marginBottom: spacing.sm },

  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorText: { color: colors.dangerText, flex: 1, fontSize: fontSize.sm },

  cta: { marginTop: spacing.xs },
  linkWrap: {
    alignSelf: "center",
    minHeight: 44,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  link: { color: colors.primary, fontWeight: fontWeight.semibold, fontSize: fontSize.sm },

  footer: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.xs },
});

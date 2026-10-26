"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { TriangleAlert, CheckCircle2 } from "lucide-react";
import { Button, Card, CardContent, Input } from "@/components/ui";
import { useAuthStore } from "@/store";
import { login, forgotPassword, resetPassword } from "@/lib/api/auth";
import { loginSchema, type LoginSchema } from "@/lib/schemas/login";

/** Demo accounts seeded by the backend — all share one password. */
const DEMO_ACCOUNTS = [
  { label: "Admin", email: "admin@springdale.edu" },
  { label: "Principal", email: "principal@springdale.edu" },
  { label: "Teacher", email: "priya.sharma@springdale.edu" },
  { label: "Accounts", email: "accounts@springdale.edu" },
];

const DEMO_PASSWORD = "springdale123";

// New schools sign up on the marketing site. Defaults to the deployed showcase
// URL; override with NEXT_PUBLIC_SHOWCASE_URL if it changes (e.g. custom domain).
const SHOWCASE_URL = (process.env.NEXT_PUBLIC_SHOWCASE_URL ?? "https://school-management-x3di.vercel.app").replace(/\/$/, "");
const REGISTER_HREF = `${SHOWCASE_URL}/school/register`;

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetToken = searchParams.get("reset") ?? "";
  const signIn = useAuthStore((s) => s.signIn);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "forgot" | "reset">(
    resetToken ? "reset" : "login"
  );
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [resetDone, setResetDone] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleForgot = async () => {
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    setError(null);
    try {
      await forgotPassword(forgotEmail.trim());
      setForgotSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send reset email.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleReset = async () => {
    if (!newPassword || newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setResetLoading(true);
    setError(null);
    try {
      await resetPassword(resetToken, newPassword);
      setResetDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reset password.");
    } finally {
      setResetLoading(false);
    }
  };

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: DEMO_ACCOUNTS[0].email,
      password: DEMO_PASSWORD,
      remember: true,
    },
  });

  // Highlight the demo account whose email is currently in the field.
  const currentEmail = useWatch({ control, name: "email" });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      const user = await login(values.email, values.password);
      signIn(user);
      // The platform owner has no school dashboard — send them to their console.
      router.replace(user.role === "super_admin" ? "/overview" : "/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not sign in. Please try again.");
    }
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex size-11 items-center justify-center overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-border">
            <Image src="/logo-icon.png" alt="SchoolDeck" width={44} height={44} className="size-full object-contain" />
          </div>
          <h1 className="text-lg font-semibold text-text">
            {mode === "forgot" ? "Reset your password" : mode === "reset" ? "Set new password" : "Sign in to SchoolDeck"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {mode === "forgot" ? "Enter your email and we'll send a reset link" : mode === "reset" ? "Choose a new password" : "Your school management account"}
          </p>
        </div>

        {/* ── Forgot password ── */}
        {mode === "forgot" && (
          <Card>
            <CardContent className="flex flex-col gap-4">
              {forgotSent ? (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <CheckCircle2 className="size-8 text-success" />
                  <p className="text-sm font-medium text-text">Check your inbox</p>
                  <p className="text-xs text-muted">If an account exists for that email, a reset link has been sent.</p>
                  <Button variant="outline" className="w-full" onClick={() => setMode("login")}>Back to sign in</Button>
                </div>
              ) : (
                <>
                  <Input label="Email" type="email" autoComplete="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} />
                  {error && <p className="flex items-start gap-2 rounded-md bg-danger-soft px-3 py-2.5 text-xs text-danger-text"><TriangleAlert className="mt-0.5 size-3.5 shrink-0" />{error}</p>}
                  <Button className="w-full" onClick={handleForgot} disabled={forgotLoading}>{forgotLoading ? "Sending…" : "Send reset link"}</Button>
                  <button type="button" onClick={() => setMode("login")} className="text-center text-xs text-primary hover:underline">Back to sign in</button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Reset password ── */}
        {mode === "reset" && (
          <Card>
            <CardContent className="flex flex-col gap-4">
              {resetDone ? (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <CheckCircle2 className="size-8 text-success" />
                  <p className="text-sm font-medium text-text">Password updated!</p>
                  <Button className="w-full" onClick={() => { setMode("login"); setResetDone(false); }}>Sign in</Button>
                </div>
              ) : (
                <>
                  <Input label="New password" type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} hint="At least 8 characters." />
                  {error && <p className="flex items-start gap-2 rounded-md bg-danger-soft px-3 py-2.5 text-xs text-danger-text"><TriangleAlert className="mt-0.5 size-3.5 shrink-0" />{error}</p>}
                  <Button className="w-full" onClick={handleReset} disabled={resetLoading}>{resetLoading ? "Updating…" : "Set new password"}</Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Login ── */}
        {mode === "login" && (
          <Card>
            <CardContent className="flex flex-col gap-4">
            <div>
              <p className="mb-2 text-xs font-medium text-muted">Demo accounts</p>
              <div className="grid grid-cols-2 gap-1.5">
                {DEMO_ACCOUNTS.map((account) => {
                  const active = currentEmail === account.email;
                  return (
                    <button
                      key={account.email}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setValue("email", account.email);
                        setValue("password", DEMO_PASSWORD);
                      }}
                      className={
                        active
                          ? "focus-ring rounded-md border border-primary bg-primary-soft px-2 py-1.5 text-xs font-semibold text-primary-text shadow-sm ring-1 ring-primary/20 transition-colors"
                          : "focus-ring rounded-md border border-transparent bg-surface-hover px-2 py-1.5 text-xs font-medium text-muted transition-colors hover:text-text"
                      }
                    >
                      {account.label}
                    </button>
                  );
                })}
              </div>
              {/* Anyone who isn't one of the demo roles — including a school's own
                  custom roles — signs in here with their own email & password. */}
              <button
                type="button"
                onClick={() => {
                  setValue("email", "");
                  setValue("password", "");
                }}
                className="focus-ring mt-1.5 w-full rounded-md border border-dashed border-border px-2 py-1.5 text-xs font-medium text-muted transition-colors hover:border-border-strong hover:text-text"
              >
                Others — sign in with your own account
              </button>
            </div>

            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                {...register("email")}
                error={errors.email?.message}
              />
              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                {...register("password")}
                error={errors.password?.message}
              />

              <label className="flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  {...register("remember")}
                  className="focus-ring size-4 cursor-pointer rounded-sm accent-[var(--primary)]"
                />
                <span className="text-sm text-muted">Keep me signed in</span>
              </label>

              {error && (
                <p className="flex items-start gap-2 rounded-md bg-danger-soft px-3 py-2.5 text-xs text-danger-text">
                  <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                  {error}
                </p>
              )}

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Signing in…" : "Sign in"}
              </Button>

              <button type="button" onClick={() => { setMode("forgot"); setError(null); setForgotSent(false); }} className="text-center text-xs text-primary hover:underline">
                Forgot password?
              </button>
            </form>

          </CardContent>
          </Card>
        )}

        <p className="mt-5 text-center text-sm text-muted">
          New school?{" "}
          <a href={REGISTER_HREF} className="font-medium text-primary hover:underline">
            Start your 7-day free trial →
          </a>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { School, TriangleAlert } from "lucide-react";
import { Button, Card, CardContent, Input } from "@/components/ui";
import { useAuthStore } from "@/store";
import { login } from "@/lib/api/auth";
import { loginSchema, type LoginSchema } from "@/lib/schemas/login";

/** Demo accounts seeded by the backend — all share one password. */
const DEMO_ACCOUNTS = [
  { label: "Admin", email: "admin@springdale.edu" },
  { label: "Principal", email: "principal@springdale.edu" },
  { label: "Teacher", email: "priya.sharma@springdale.edu" },
];

const DEMO_PASSWORD = "springdale123";

export default function LoginPage() {
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: DEMO_ACCOUNTS[0].email,
      password: DEMO_PASSWORD,
      remember: true,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      const user = await login(values.email, values.password);
      signIn(user);
      router.replace("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not sign in. Please try again.");
    }
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex size-11 items-center justify-center rounded-lg gradient-indigo shadow-sm">
            <School className="size-5 text-white" />
          </div>
          <h1 className="text-lg font-semibold text-text">Sign in to EduManage</h1>
          <p className="mt-1 text-sm text-muted">Springdale School · New Delhi</p>
        </div>

        <Card>
          <CardContent className="flex flex-col gap-4">
            <div>
              <p className="mb-2 text-xs font-medium text-muted">Demo accounts</p>
              <div className="grid grid-cols-3 gap-1.5">
                {DEMO_ACCOUNTS.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => {
                      setValue("email", account.email);
                      setValue("password", DEMO_PASSWORD);
                    }}
                    className="focus-ring rounded-md bg-surface-hover px-2 py-1.5 text-xs font-medium text-muted transition-colors hover:text-text"
                  >
                    {account.label}
                  </button>
                ))}
              </div>
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
            </form>

            <p className="rounded-md bg-warning-soft px-3 py-2 text-xs text-warning-text">
              Demo build — accounts are seeded by the backend. Password for all:{" "}
              <span className="font-mono font-semibold">{DEMO_PASSWORD}</span>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

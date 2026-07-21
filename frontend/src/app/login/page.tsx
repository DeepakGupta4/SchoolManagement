"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { School } from "lucide-react";
import { Button, Card, CardContent, Input } from "@/components/ui";
import { useAuthStore } from "@/store";
import { loginSchema, type LoginSchema } from "@/lib/schemas/login";
import type { UserRole } from "@/types";

/**
 * Demo sign-in. There is no auth backend yet, so any well-formed credentials
 * are accepted and the chosen role is written to the client store. Swap the
 * body of `onSubmit` for a real token exchange when the API lands — nothing
 * else on this page needs to change.
 */

const DEMO_ACCOUNTS: { role: UserRole; name: string; email: string; label: string }[] = [
  { role: "school_admin", name: "Rajesh Kumar", email: "admin@springdale.edu", label: "School Admin" },
  { role: "teacher", name: "Priya Sharma", email: "priya.sharma@springdale.edu", label: "Teacher" },
  { role: "student", name: "Aarav Sharma", email: "aarav.sharma@springdale.edu", label: "Student" },
];

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [selected, setSelected] = useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: DEMO_ACCOUNTS[0].email,
      password: "springdale",
      remember: true,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const account = DEMO_ACCOUNTS[selected];
    setUser({
      id: String(selected + 1),
      name: account.name,
      email: values.email,
      role: account.role,
      avatar: "",
      schoolId: "school_1",
    });
    router.push("/dashboard");
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
              <p className="mb-2 text-xs font-medium text-muted">Sign in as</p>
              <div className="grid grid-cols-3 gap-1.5">
                {DEMO_ACCOUNTS.map((account, i) => (
                  <button
                    key={account.role}
                    type="button"
                    onClick={() => {
                      setSelected(i);
                      setValue("email", account.email);
                    }}
                    aria-pressed={selected === i}
                    className={
                      selected === i
                        ? "focus-ring rounded-md bg-primary px-2 py-1.5 text-xs font-medium text-white"
                        : "focus-ring rounded-md bg-surface-hover px-2 py-1.5 text-xs font-medium text-muted transition-colors hover:text-text"
                    }
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

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            <p className="rounded-md bg-warning-soft px-3 py-2 text-xs text-warning-text">
              Demo build — there is no auth backend yet, so any valid-looking
              credentials will sign you in.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

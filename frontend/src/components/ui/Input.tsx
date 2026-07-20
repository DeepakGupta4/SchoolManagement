"use client";

import React from "react";
import { cn } from "@/lib/utils";

/** Shared control styling so Input, Select and Textarea line up exactly. */
export const controlClasses =
  "focus-ring w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text transition-colors placeholder:text-subtle hover:border-border-strong disabled:cursor-not-allowed disabled:opacity-60";

interface FieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
  htmlFor?: string;
}

/** Label + control + error/hint wrapper. Use with any control. */
export function Field({ label, error, hint, required, className, children, htmlFor }: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-xs font-medium text-muted">
          {label}
          {required && <span className="ml-0.5 text-danger">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : hint ? (
        <p className="text-xs text-subtle">{hint}</p>
      ) : null}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, icon, className, id, required, ...props },
  ref
) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;

  const control = (
    <div className="relative">
      {icon && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle">
          {icon}
        </span>
      )}
      <input
        ref={ref}
        id={inputId}
        required={required}
        aria-invalid={error ? true : undefined}
        className={cn(controlClasses, icon && "pl-9", error && "border-danger", className)}
        {...props}
      />
    </div>
  );

  if (!label && !error && !hint) return control;

  return (
    <Field label={label} error={error} hint={hint} required={required} htmlFor={inputId}>
      {control}
    </Field>
  );
});

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, className, id, required, rows = 3, ...props },
  ref
) {
  const generatedId = React.useId();
  const textareaId = id ?? generatedId;

  return (
    <Field label={label} error={error} hint={hint} required={required} htmlFor={textareaId}>
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        className={cn(controlClasses, "resize-y", error && "border-danger", className)}
        {...props}
      />
    </Field>
  );
});

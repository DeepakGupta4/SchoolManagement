"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Field } from "./Input";

interface MultiSelectProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
}

/**
 * Toggleable chip group for picking several values (subjects, classes).
 * Kept as chips rather than a dropdown so all selections stay visible.
 */
export function MultiSelect({
  label,
  error,
  hint,
  required,
  options,
  value,
  onChange,
}: MultiSelectProps) {
  const toggle = (option: string) =>
    onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option]);

  return (
    <Field label={label} error={error} hint={hint} required={required}>
      <div
        role="group"
        aria-label={label}
        className={cn(
          "flex flex-wrap gap-1.5 rounded-md border border-border bg-surface p-2",
          error && "border-danger"
        )}
      >
        {options.map((option) => {
          const selected = value.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              aria-pressed={selected}
              className={cn(
                "focus-ring inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                selected
                  ? "bg-primary text-white"
                  : "bg-surface-hover text-muted hover:text-text"
              )}
            >
              {selected && <Check className="size-3" />}
              {option}
            </button>
          );
        })}
      </div>
    </Field>
  );
}

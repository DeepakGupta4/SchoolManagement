"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Field, controlClasses } from "./Input";

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
}

/**
 * Native <select> under the hood — keeps it trivially compatible with
 * react-hook-form's register() and with browser-native validation.
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, options, placeholder, className, id, required, ...props },
  ref
) {
  const generatedId = React.useId();
  const selectId = id ?? generatedId;

  const control = (
    <div className="relative">
      <select
        ref={ref}
        id={selectId}
        required={required}
        aria-invalid={error ? true : undefined}
        className={cn(
          controlClasses,
          "cursor-pointer appearance-none pr-9",
          error && "border-danger",
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
    </div>
  );

  if (!label && !error && !hint) return control;

  return (
    <Field label={label} error={error} hint={hint} required={required} htmlFor={selectId}>
      {control}
    </Field>
  );
});

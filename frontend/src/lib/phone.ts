import type { ChangeEvent } from "react";

/** Exactly 10 digits. */
export const PHONE_REGEX = /^\d{10}$/;
export const PHONE_MESSAGE = "Enter a 10-digit mobile number";

/** react-hook-form onChange: strip non-digits and cap at 10. */
export function digitsOnly10(e: ChangeEvent<HTMLInputElement>) {
  e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
}

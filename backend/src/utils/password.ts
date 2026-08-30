import crypto from "node:crypto";

/**
 * A readable-but-strong temporary password for a newly approved school admin.
 *
 * Uses crypto randomness (never Math.random for anything security-related) and
 * drops visually ambiguous characters (0/O, 1/l/I) so it survives being read
 * off an email and typed by hand. Always ends with a digit and a symbol so it
 * clears common "needs a number and special character" policies.
 */
const LETTERS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";
const DIGITS = "23456789";
const SYMBOLS = "@#$%&*";

export function generateTempPassword(letterCount = 10): string {
  const bytes = crypto.randomBytes(letterCount);
  let body = "";
  for (let i = 0; i < letterCount; i++) {
    body += LETTERS[bytes[i]! % LETTERS.length];
  }
  const digit = DIGITS[crypto.randomInt(DIGITS.length)];
  const digit2 = DIGITS[crypto.randomInt(DIGITS.length)];
  const symbol = SYMBOLS[crypto.randomInt(SYMBOLS.length)];
  return `${body}${symbol}${digit}${digit2}`;
}

/** A short, URL-safe unique suffix for building tenant ids. */
export function shortId(bytes = 4): string {
  return crypto.randomBytes(bytes).toString("hex");
}

/** Turns a school name into a compact, lowercase, hyphenated slug. */
export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 24) || "school"
  );
}

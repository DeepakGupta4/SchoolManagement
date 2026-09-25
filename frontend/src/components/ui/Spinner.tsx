import { cn } from "@/lib/utils";

const SIZES = {
  xs: "size-3.5 border-2",
  sm: "size-4 border-2",
  md: "size-6 border-2",
  lg: "size-8 border-[3px]",
} as const;

export type SpinnerSize = keyof typeof SIZES;

/**
 * The one spinner for the whole app. A CSS border ring (not an icon), so it
 * always spins — it doesn't depend on an icon font or lucide. `currentColor`
 * drives the visible arc, so it inherits the surrounding text colour.
 */
export function Spinner({
  size = "sm",
  className,
  label,
}: {
  size?: SpinnerSize;
  className?: string;
  /** Screen-reader text; defaults to "Loading". */
  label?: string;
}) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        "inline-block shrink-0 animate-spin rounded-full border-current border-t-transparent align-[-0.125em]",
        SIZES[size],
        className
      )}
    >
      <span className="sr-only">{label ?? "Loading"}</span>
    </span>
  );
}

/**
 * Centered spinner with an optional caption — for full-panel / section loading.
 */
export function Loading({
  label = "Loading…",
  className,
  size = "lg",
}: {
  label?: string;
  className?: string;
  size?: SpinnerSize;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-10 text-muted", className)}>
      <Spinner size={size} className="text-primary" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

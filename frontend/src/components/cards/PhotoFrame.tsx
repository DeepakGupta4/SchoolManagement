import { UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Passport-photo frame for printed documents. When no photo is supplied it
 * shows a neutral silhouette in a bordered box — the way a real card looks
 * before a photo is pasted in — rather than coloured initials, which read as
 * a UI avatar and make the card look fake.
 */
export function PhotoFrame({
  src,
  name,
  className,
}: {
  src?: string;
  name: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-sm bg-slate-100 ring-1 ring-slate-300",
        className
      )}
      style={{ aspectRatio: "35 / 45" }} // passport ratio
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="size-full object-cover" />
      ) : (
        <UserRound className="size-1/2 text-slate-300" strokeWidth={1.5} />
      )}
    </div>
  );
}

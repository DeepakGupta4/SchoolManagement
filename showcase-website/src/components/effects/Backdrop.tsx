import { cn } from '@/lib/utils'

/**
 * Aurora: three oversized, heavily-blurred conic/radial blobs drifting on
 * independent timings. Sits at the very back of a section.
 */
export function Aurora({
  className,
  intensity = 1,
}: {
  className?: string
  intensity?: number
}) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 -z-20 overflow-hidden', className)}
      style={{ opacity: `calc(var(--aurora-opacity) * ${intensity})` }}
    >
      <div
        className="absolute -top-[30%] -left-[15%] h-[70vw] w-[70vw] animate-aurora rounded-full blur-[110px]"
        style={{
          background:
            'radial-gradient(circle at 30% 30%, color-mix(in oklab, var(--color-brand-600) 55%, transparent), transparent 62%)',
        }}
      />
      <div
        className="absolute -top-[10%] right-[-20%] h-[62vw] w-[62vw] animate-aurora rounded-full blur-[120px]"
        style={{
          animationDelay: '-9s',
          animationDuration: '32s',
          background:
            'radial-gradient(circle at 60% 40%, color-mix(in oklab, var(--color-azure-600) 52%, transparent), transparent 64%)',
        }}
      />
      <div
        className="absolute bottom-[-30%] left-[20%] h-[58vw] w-[58vw] animate-aurora rounded-full blur-[130px]"
        style={{
          animationDelay: '-18s',
          animationDuration: '38s',
          background:
            'radial-gradient(circle at 50% 50%, color-mix(in oklab, var(--color-aqua-500) 44%, transparent), transparent 66%)',
        }}
      />
    </div>
  )
}

/** Fixed film-grain overlay — kills gradient banding and adds a tactile finish. */
export function NoiseOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[60] opacity-[0.028] mix-blend-overlay dark:opacity-[0.05]"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }}
    />
  )
}

/** Subtle blueprint grid, radially masked so it dissolves at the edges. */
export function GridBackdrop({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 -z-10 grid-lines', className)}
      style={{
        maskImage: 'radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent 78%)',
        WebkitMaskImage:
          'radial-gradient(ellipse 70% 60% at 50% 40%, black, transparent 78%)',
      }}
    />
  )
}

/** A single positioned gradient orb — used to seed depth into flat sections. */
export function Orb({
  className,
  color = 'var(--color-brand-600)',
  size = 480,
  blur = 90,
  opacity = 0.4,
}: {
  className?: string
  color?: string
  size?: number
  blur?: number
  opacity?: number
}) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute -z-10 rounded-full', className)}
      style={{
        width: size,
        height: size,
        opacity,
        filter: `blur(${blur}px)`,
        background: `radial-gradient(circle, color-mix(in oklab, ${color} 70%, transparent), transparent 66%)`,
      }}
    />
  )
}

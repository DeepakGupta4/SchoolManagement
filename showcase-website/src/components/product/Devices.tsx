import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * MacBook-style laptop frame. Pure CSS — no image assets, so it stays sharp
 * at every density and follows the active theme.
 */
export function LaptopFrame({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('relative w-full', className)}>
      {/* Lid */}
      <div className="relative rounded-t-[18px] border border-b-0 border-[rgb(var(--glass-border)/0.16)] bg-[linear-gradient(180deg,rgb(var(--glass-border)/0.1),rgb(var(--glass-border)/0.03))] p-[10px] pb-0 shadow-lift backdrop-blur-xl md:rounded-t-[22px] md:p-3 md:pb-0">
        {/* Screen bezel */}
        <div className="relative overflow-hidden rounded-t-[10px] border border-[rgb(var(--glass-border)/0.14)] bg-ink-950 md:rounded-t-[14px]">
          {/* Camera notch */}
          <div className="absolute top-0 left-1/2 z-20 h-[14px] w-[86px] -translate-x-1/2 rounded-b-[8px] bg-ink-950 md:h-[18px] md:w-[110px]">
            <span className="absolute top-1/2 left-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink-700" />
          </div>
          <div className="aspect-[16/10] w-full bg-surface">{children}</div>
        </div>
      </div>

      {/* Base */}
      <div className="relative h-[10px] rounded-b-[6px] bg-[linear-gradient(180deg,rgb(var(--glass-border)/0.2),rgb(var(--glass-border)/0.08))] md:h-[13px]">
        <div className="absolute top-0 left-1/2 h-[4px] w-[16%] -translate-x-1/2 rounded-b-[6px] bg-[rgb(var(--glass-border)/0.22)]" />
      </div>
      <div className="mx-auto h-[3px] w-[72%] rounded-b-full bg-[rgb(var(--glass-border)/0.1)] blur-[1px]" />

      {/* Contact shadow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-[6%] -bottom-8 h-14 rounded-[50%] blur-2xl"
        style={{
          background:
            'radial-gradient(ellipse at center, color-mix(in oklab, var(--color-brand-600) 34%, transparent), transparent 70%)',
        }}
      />
    </div>
  )
}

/** iPad-style tablet frame. */
export function TabletFrame({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[26px] border border-[rgb(var(--glass-border)/0.16)] bg-[linear-gradient(150deg,rgb(var(--glass-border)/0.12),rgb(var(--glass-border)/0.04))] p-2.5 shadow-lift backdrop-blur-xl',
        className,
      )}
    >
      <div className="overflow-hidden rounded-[18px] border border-[rgb(var(--glass-border)/0.12)] bg-surface">
        {children}
      </div>
    </div>
  )
}

/** iPhone-style phone frame with side buttons and a Dynamic-Island notch. */
export function PhoneFrame({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative rounded-[34px] border border-[rgb(var(--glass-border)/0.18)] bg-[linear-gradient(160deg,rgb(var(--glass-border)/0.14),rgb(var(--glass-border)/0.04))] p-[7px] shadow-lift backdrop-blur-xl',
        className,
      )}
    >
      {/* side buttons */}
      <span className="absolute top-[22%] -left-[2px] h-9 w-[2px] rounded-l bg-[rgb(var(--glass-border)/0.22)]" />
      <span className="absolute top-[34%] -left-[2px] h-14 w-[2px] rounded-l bg-[rgb(var(--glass-border)/0.22)]" />
      <span className="absolute top-[26%] -right-[2px] h-16 w-[2px] rounded-r bg-[rgb(var(--glass-border)/0.22)]" />

      <div className="relative overflow-hidden rounded-[28px] border border-[rgb(var(--glass-border)/0.12)] bg-surface">
        <div className="absolute top-[7px] left-1/2 z-20 h-[18px] w-[74px] -translate-x-1/2 rounded-full bg-ink-950" />
        <div className="aspect-[9/19.5] w-full">{children}</div>
      </div>
    </div>
  )
}

/** Browser chrome wrapper for inline product shots. */
export function BrowserFrame({
  children,
  className,
  url = 'app.buildschoolos.com/overview',
}: {
  children: ReactNode
  className?: string
  url?: string
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-[rgb(var(--glass-border)/0.12)] bg-elevated shadow-premium',
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-[rgb(var(--glass-border)/0.08)] bg-[rgb(var(--surface-muted))] px-3 py-2">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        </div>
        <div className="mx-auto max-w-[60%] flex-1 truncate rounded-md bg-[rgb(var(--glass-border)/0.08)] px-3 py-1 text-center font-mono text-[10px] text-subtle">
          {url}
        </div>
      </div>
      {children}
    </div>
  )
}

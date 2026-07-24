import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { EASE_PREMIUM, VIEWPORT_EARLY } from '@/lib/motion'
import { Reveal } from './Reveal'

/* ------------------------------------------------------------------ Pill */

export function Pill({
  children,
  className,
  icon,
}: {
  children: ReactNode
  className?: string
  icon?: ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full glass px-3.5 py-1.5',
        'font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-subtle',
        className,
      )}
    >
      {icon}
      {children}
    </span>
  )
}

/* --------------------------------------------------------------- Eyebrow */

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-600 dark:text-brand-300">
      <span className="h-px w-6 bg-[linear-gradient(90deg,transparent,currentColor)]" />
      {children}
    </span>
  )
}

/* -------------------------------------------------------- SectionHeading */

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  className,
}: {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  align?: 'center' | 'left'
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-5',
        align === 'center' ? 'items-center text-center' : 'items-start text-left',
        className,
      )}
    >
      {eyebrow && (
        <Reveal y={16} duration={0.7}>
          <Eyebrow>{eyebrow}</Eyebrow>
        </Reveal>
      )}
      <Reveal delay={0.06}>
        <h2 className="max-w-4xl text-[clamp(2rem,5.2vw,3.75rem)] leading-[1.04] font-semibold">
          {title}
        </h2>
      </Reveal>
      {description && (
        <Reveal delay={0.14}>
          <p
            className={cn(
              'max-w-2xl text-[15px] leading-relaxed text-subtle md:text-[17px]',
              align === 'center' && 'mx-auto',
            )}
          >
            {description}
          </p>
        </Reveal>
      )}
    </div>
  )
}

/* --------------------------------------------------------------- Section */

export function Section({
  id,
  children,
  className,
  containerClassName,
}: {
  id?: string
  children: ReactNode
  className?: string
  containerClassName?: string
}) {
  return (
    <section
      id={id}
      className={cn('relative scroll-mt-24 py-24 md:py-32 lg:py-40', className)}
    >
      <div className={cn('container-x', containerClassName)}>{children}</div>
    </section>
  )
}

/* --------------------------------------------------------------- Marquee */

export function Marquee({
  children,
  reverse = false,
  speed = 42,
  className,
  pauseOnHover = true,
}: {
  children: ReactNode
  reverse?: boolean
  speed?: number
  className?: string
  pauseOnHover?: boolean
}) {
  return (
    <div className={cn('group relative flex overflow-hidden mask-fade-x', className)}>
      <div
        className={cn(
          'flex w-max shrink-0 items-center',
          reverse ? 'animate-marquee-reverse' : 'animate-marquee',
          pauseOnHover && 'group-hover:[animation-play-state:paused]',
        )}
        style={{ animationDuration: `${speed}s` }}
      >
        {children}
        {children}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------ GradientRule */

export function GradientRule({ className }: { className?: string }) {
  return (
    <motion.div
      initial={{ scaleX: 0, opacity: 0 }}
      whileInView={{ scaleX: 1, opacity: 1 }}
      viewport={VIEWPORT_EARLY}
      transition={{ duration: 1.2, ease: EASE_PREMIUM }}
      className={cn(
        'h-px w-full origin-center bg-[linear-gradient(90deg,transparent,rgb(var(--glass-border)/0.28),transparent)]',
        className,
      )}
    />
  )
}

/* ----------------------------------------------------------------- Stat */

export function LiveDot({ className }: { className?: string }) {
  return (
    <span className={cn('relative inline-flex h-2 w-2', className)}>
      <span className="absolute inset-0 animate-pulse-ring rounded-full bg-emerald-400" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
    </span>
  )
}

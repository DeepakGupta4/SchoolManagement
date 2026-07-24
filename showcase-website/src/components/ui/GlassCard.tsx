import { useRef, useState, type ReactNode } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useHasPointer } from '@/hooks/useMouse'

type Props = {
  children: ReactNode
  className?: string
  /** Max tilt in degrees. 0 disables the 3D tilt. */
  tilt?: number
  /** Renders a cursor-tracking radial highlight across the glass. */
  spotlight?: boolean
  as?: 'div' | 'article' | 'li'
}

/**
 * The workhorse surface: frosted glass, cursor spotlight, and an optional
 * perspective tilt that tracks the pointer.
 */
export function GlassCard({
  children,
  className,
  tilt = 8,
  spotlight = true,
  as = 'div',
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const hasPointer = useHasPointer()
  const [glow, setGlow] = useState({ x: 50, y: 50, active: false })

  const rx = useMotionValue(0)
  const ry = useMotionValue(0)
  const rotateX = useSpring(rx, { stiffness: 180, damping: 20, mass: 0.5 })
  const rotateY = useSpring(ry, { stiffness: 180, damping: 20, mass: 0.5 })

  const translateZ = useTransform([rotateX, rotateY], ([a, b]: number[]) =>
    Math.min(26, (Math.abs(a) + Math.abs(b)) * 1.6),
  )

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!ref.current || !hasPointer) return
    const rect = ref.current.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width
    const py = (e.clientY - rect.top) / rect.height
    if (tilt > 0) {
      rx.set((0.5 - py) * tilt * 2)
      ry.set((px - 0.5) * tilt * 2)
    }
    if (spotlight) setGlow({ x: px * 100, y: py * 100, active: true })
  }

  const onLeave = () => {
    rx.set(0)
    ry.set(0)
    setGlow((g) => ({ ...g, active: false }))
  }

  const MotionTag = motion[as] as typeof motion.div

  return (
    <MotionTag
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ rotateX, rotateY, transformPerspective: 1200 }}
      className={cn(
        'group relative isolate overflow-hidden rounded-3xl glass',
        'transition-[border-color,box-shadow] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
        'hover:border-brand-400/30 hover:shadow-lift will-change-transform',
        className,
      )}
    >
      {spotlight && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            opacity: glow.active ? 1 : 0,
            background: `radial-gradient(420px circle at ${glow.x}% ${glow.y}%, color-mix(in oklab, var(--color-brand-500) 22%, transparent), transparent 62%)`,
          }}
        />
      )}

      {/* top hairline highlight */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px bg-[linear-gradient(90deg,transparent,rgb(var(--glass-border)/0.35),transparent)]"
      />

      <motion.div style={{ translateZ }} className="relative h-full preserve-3d">
        {children}
      </motion.div>
    </MotionTag>
  )
}

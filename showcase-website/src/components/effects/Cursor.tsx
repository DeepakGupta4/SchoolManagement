import { useEffect, useState } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useHasPointer } from '@/hooks/useMouse'

/**
 * Two-body cursor: a crisp dot that tracks 1:1 and a lagging ring that
 * expands over interactive targets. Hidden entirely on touch devices.
 */
export function AnimatedCursor() {
  const hasPointer = useHasPointer()
  const [hovering, setHovering] = useState(false)
  const [visible, setVisible] = useState(false)

  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const ringX = useSpring(x, { stiffness: 200, damping: 22, mass: 0.5 })
  const ringY = useSpring(y, { stiffness: 200, damping: 22, mass: 0.5 })
  const dotX = useSpring(x, { stiffness: 900, damping: 40, mass: 0.2 })
  const dotY = useSpring(y, { stiffness: 900, damping: 40, mass: 0.2 })

  useEffect(() => {
    if (!hasPointer) return

    const move = (e: PointerEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
      setVisible(true)

      const target = e.target as HTMLElement | null
      setHovering(
        !!target?.closest('a, button, [role="button"], input, textarea, [data-cursor]'),
      )
    }
    const leave = () => setVisible(false)

    window.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerleave', leave)
    return () => {
      window.removeEventListener('pointermove', move)
      document.removeEventListener('pointerleave', leave)
    }
  }, [hasPointer, x, y])

  if (!hasPointer) return null

  return (
    <>
      <motion.div
        aria-hidden
        style={{ x: ringX, y: ringY }}
        animate={{
          opacity: visible ? 1 : 0,
          scale: hovering ? 1.65 : 1,
          borderColor: hovering
            ? 'color-mix(in oklab, var(--color-brand-500) 85%, transparent)'
            : 'rgb(var(--glass-border) / 0.4)',
        }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-none fixed top-0 left-0 z-[100] -ml-4 -mt-4 h-8 w-8 rounded-full border backdrop-blur-[1px]"
      />
      <motion.div
        aria-hidden
        style={{ x: dotX, y: dotY }}
        animate={{ opacity: visible ? 1 : 0, scale: hovering ? 0.45 : 1 }}
        transition={{ duration: 0.2 }}
        className="pointer-events-none fixed top-0 left-0 z-[100] -ml-[3px] -mt-[3px] h-1.5 w-1.5 rounded-full bg-brand-500"
      />
    </>
  )
}

/** Viewport-wide glow that follows the pointer. Purely decorative. */
export function MouseGlow() {
  const hasPointer = useHasPointer()
  const x = useMotionValue(-1000)
  const y = useMotionValue(-1000)
  const gx = useSpring(x, { stiffness: 44, damping: 22, mass: 1.1 })
  const gy = useSpring(y, { stiffness: 44, damping: 22, mass: 1.1 })

  useEffect(() => {
    if (!hasPointer) return
    const move = (e: PointerEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [hasPointer, x, y])

  if (!hasPointer) return null

  return (
    <motion.div
      aria-hidden
      style={{ x: gx, y: gy }}
      className="pointer-events-none fixed top-0 left-0 z-0 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-[80px] mix-blend-plus-lighter dark:opacity-70"
    >
      <div
        className="h-full w-full rounded-full"
        style={{
          background:
            'radial-gradient(circle, color-mix(in oklab, var(--color-brand-500) 30%, transparent), transparent 62%)',
        }}
      />
    </motion.div>
  )
}

/** Top-edge scroll progress bar. */
export function ScrollProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const doc = document.documentElement
      const max = doc.scrollHeight - doc.clientHeight
      setProgress(max > 0 ? (doc.scrollTop / max) * 100 : 0)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    update()
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <div
      aria-hidden
      className="fixed inset-x-0 top-0 z-[70] h-[2px] bg-transparent"
    >
      <div
        className="h-full origin-left bg-[linear-gradient(90deg,var(--color-brand-600),var(--color-azure-600),var(--color-aqua-400))] transition-[width] duration-100 ease-out"
        style={{
          width: `${progress}%`,
          boxShadow: '0 0 14px color-mix(in oklab, var(--color-brand-500) 70%, transparent)',
        }}
      />
    </div>
  )
}

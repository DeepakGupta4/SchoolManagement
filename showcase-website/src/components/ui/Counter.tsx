import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

/** easeOutExpo — fast start, long graceful settle. */
const ease = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t))

/**
 * Scroll-triggered number ramp. Hand-rolled rather than pulled from a
 * package: it gives us Indian digit grouping and one fewer dependency.
 */
export function Counter({
  to,
  duration = 2400,
  suffix = '',
  prefix = '',
  className,
}: {
  to: number
  duration?: number
  suffix?: string
  prefix?: string
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!inView) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(to)
      return
    }

    let raf = 0
    let start: number | null = null

    const step = (now: number) => {
      if (start === null) start = now
      const t = Math.min((now - start) / duration, 1)
      setValue(Math.round(to * ease(t)))
      if (t < 1) raf = requestAnimationFrame(step)
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [inView, to, duration])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {value.toLocaleString('en-IN')}
      {suffix}
    </span>
  )
}

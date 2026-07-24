import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Renders children at a fixed design size and scales the whole thing to fit
 * the container. The dashboard replica is laid out for a ~1120px viewport;
 * without this it reflows into an unreadable mess inside a laptop mockup or
 * the hero stage. Scaling keeps the composition identical at every size.
 */
export function ScaledPreview({
  children,
  designWidth = 1120,
  designHeight = 700,
  className,
}: {
  children: ReactNode
  designWidth?: number
  designHeight?: number
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / designWidth)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [designWidth])

  return (
    <div
      ref={ref}
      className={cn('relative overflow-hidden', className)}
      style={{ aspectRatio: `${designWidth} / ${designHeight}` }}
    >
      <div
        className="absolute top-0 left-0 origin-top-left"
        style={{
          width: designWidth,
          height: designHeight,
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  )
}

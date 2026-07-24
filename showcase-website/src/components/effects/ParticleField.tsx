import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { prefersReducedMotion, seeded } from '@/lib/utils'

type Particle = {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  r: number
  hue: number
}

const HUES = [268, 221, 189]

/**
 * Canvas particle field with parallax depth and proximity linking. Pointer
 * acts as a soft attractor. Deliberately hand-rolled rather than pulling in
 * three.js — one 2D canvas keeps the hero at 60fps and the bundle small.
 */
export function ParticleField({
  className,
  density = 0.00009,
  linkDistance = 130,
  interactive = true,
}: {
  className?: string
  density?: number
  linkDistance?: number
  interactive?: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return
    if (prefersReducedMotion()) return

    let width = 0
    let height = 0
    let dpr = 1
    let particles: Particle[] = []
    let raf = 0
    const pointer = { x: -9999, y: -9999 }

    const build = () => {
      const rect = canvas.getBoundingClientRect()
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = rect.width
      height = rect.height
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const count = Math.round(
        Math.min(150, Math.max(38, width * height * density)),
      )
      particles = Array.from({ length: count }, (_, i) => {
        const z = 0.35 + seeded(i * 3.1) * 0.65
        return {
          x: seeded(i * 1.7) * width,
          y: seeded(i * 2.3) * height,
          z,
          vx: (seeded(i * 4.9) - 0.5) * 0.22 * z,
          vy: (seeded(i * 5.7) - 0.5) * 0.22 * z,
          r: (0.7 + seeded(i * 6.3) * 1.5) * z,
          hue: HUES[i % HUES.length],
        }
      })
    }

    const frame = () => {
      ctx.clearRect(0, 0, width, height)

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy

        if (interactive) {
          const dx = pointer.x - p.x
          const dy = pointer.y - p.y
          const dist = Math.hypot(dx, dy)
          if (dist < 190 && dist > 0.5) {
            const pull = ((190 - dist) / 190) * 0.045 * p.z
            p.x += dx * pull
            p.y += dy * pull
          }
        }

        if (p.x < -20) p.x = width + 20
        if (p.x > width + 20) p.x = -20
        if (p.y < -20) p.y = height + 20
        if (p.y > height + 20) p.y = -20
      }

      // proximity links
      ctx.lineWidth = 0.6
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i]
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d2 = dx * dx + dy * dy
          if (d2 > linkDistance * linkDistance) continue
          const alpha = (1 - Math.sqrt(d2) / linkDistance) * 0.22 * a.z
          ctx.strokeStyle = `hsl(${a.hue} 85% 65% / ${alpha})`
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
        }
      }

      for (const p of particles) {
        ctx.fillStyle = `hsl(${p.hue} 90% 70% / ${0.28 + p.z * 0.45})`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
      }

      raf = requestAnimationFrame(frame)
    }

    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointer.x = e.clientX - rect.left
      pointer.y = e.clientY - rect.top
    }
    const onLeave = () => {
      pointer.x = -9999
      pointer.y = -9999
    }

    build()
    raf = requestAnimationFrame(frame)

    const ro = new ResizeObserver(build)
    ro.observe(canvas)
    if (interactive) {
      window.addEventListener('pointermove', onPointer, { passive: true })
      window.addEventListener('pointerleave', onLeave)
    }

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('pointerleave', onLeave)
    }
  }, [density, linkDistance, interactive])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 -z-10 h-full w-full', className)}
    />
  )
}

import { motion } from 'framer-motion'
import { cn, seeded } from '@/lib/utils'
import { EASE_PREMIUM } from '@/lib/motion'

/* --------------------------------------------------------- Sparkline area */

export function AreaSpark({
  points,
  className,
  stroke = 'var(--color-brand-500)',
  fill = 'var(--color-brand-500)',
  height = 64,
  animate = true,
}: {
  points: number[]
  className?: string
  stroke?: string
  fill?: string
  height?: number
  animate?: boolean
}) {
  const w = 100
  const max = Math.max(...points)
  const min = Math.min(...points)
  const span = max - min || 1
  const step = w / (points.length - 1)

  const coords = points.map((p, i) => [i * step, 100 - ((p - min) / span) * 82 - 9])
  const line = coords
    .map(([x, y], i) => {
      if (i === 0) return `M${x},${y}`
      const [px, py] = coords[i - 1]
      const cx = (px + x) / 2
      return `C${cx},${py} ${cx},${y} ${x},${y}`
    })
    .join(' ')
  const area = `${line} L${w},100 L0,100 Z`
  const id = `spark-${stroke.replace(/[^a-z0-9]/gi, '')}-${points.length}`

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className={cn('w-full', className)}
      style={{ height }}
      aria-hidden
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity="0.38" />
          <stop offset="100%" stopColor={fill} stopOpacity="0" />
        </linearGradient>
      </defs>
      <motion.path
        d={area}
        fill={`url(#${id})`}
        initial={animate ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.4 }}
      />
      <motion.path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth="1.6"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        initial={animate ? { pathLength: 0 } : false}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.6, ease: EASE_PREMIUM }}
      />
    </svg>
  )
}

/* ------------------------------------------------------------------ Bars */

export function BarChart({
  values,
  labels,
  className,
  accentIndex,
}: {
  values: number[]
  labels?: string[]
  className?: string
  accentIndex?: number
}) {
  const max = Math.max(...values)
  return (
    <div className={cn('flex h-full items-end gap-[6px]', className)}>
      {values.map((v, i) => (
        <div key={i} className="group/bar flex h-full flex-1 flex-col justify-end gap-1.5">
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            whileInView={{ height: `${(v / max) * 100}%`, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: i * 0.05, ease: EASE_PREMIUM }}
            className={cn(
              'w-full rounded-[4px] transition-colors duration-300',
              i === accentIndex
                ? 'bg-[linear-gradient(180deg,var(--color-brand-400),var(--color-brand-600))]'
                : 'bg-[linear-gradient(180deg,rgb(var(--glass-border)/0.32),rgb(var(--glass-border)/0.1))] group-hover/bar:bg-[linear-gradient(180deg,var(--color-azure-500),var(--color-azure-700))]',
            )}
          />
          {labels && (
            <span className="text-center font-mono text-[8px] text-subtle">{labels[i]}</span>
          )}
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ Ring */

export function RingChart({
  value,
  size = 92,
  stroke = 8,
  label,
  sub,
}: {
  value: number
  size?: number
  stroke?: number
  label?: string
  sub?: string
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <defs>
          <linearGradient id={`ring-${size}-${value}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-brand-500)" />
            <stop offset="55%" stopColor="var(--color-azure-500)" />
            <stop offset="100%" stopColor="var(--color-aqua-400)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-[rgb(var(--glass-border)/0.14)]"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke={`url(#ring-${size}-${value})`}
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: c - (value / 100) * c }}
          viewport={{ once: true }}
          transition={{ duration: 1.6, ease: EASE_PREMIUM, delay: 0.3 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-[15px] font-semibold text-strong">
          {label ?? `${value}%`}
        </span>
        {sub && <span className="font-mono text-[8px] tracking-wider text-subtle">{sub}</span>}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- Heat grid */

export function HeatGrid({ rows = 5, cols = 18 }: { rows?: number; cols?: number }) {
  return (
    <div
      className="grid gap-[3px]"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}
      aria-hidden
    >
      {Array.from({ length: rows * cols }, (_, i) => {
        const v = seeded(i * 7.3)
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.6 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: (i % cols) * 0.012 + Math.floor(i / cols) * 0.03 }}
            className="aspect-square rounded-[2px]"
            style={{
              background:
                v > 0.72
                  ? 'color-mix(in oklab, var(--color-brand-500) 85%, transparent)'
                  : v > 0.5
                    ? 'color-mix(in oklab, var(--color-azure-500) 58%, transparent)'
                    : v > 0.3
                      ? 'color-mix(in oklab, var(--color-aqua-500) 32%, transparent)'
                      : 'rgb(var(--glass-border) / 0.1)',
            }}
          />
        )
      })}
    </div>
  )
}
